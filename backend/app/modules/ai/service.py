import json

from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.modules.ai.enums import JobStatus
from app.modules.ai.models import GenerationJob
from app.modules.ai.queue import publish_generation_job, publish_notification
from app.modules.ai import schemas
from app.modules.ai.provider import LLMProvider
from app.modules.cards.models import Card
from app.modules.decks.enums import DeckSource, Language
from app.modules.decks.models import Deck


class GenerationError(Exception):
    """Не удалось получить корректные карточки от модели."""


_SYSTEM_PROMPT = """Ты генератор карточек для изучения языка. Отвечай ТОЛЬКО валидным JSON-массивом, без markdown и без пояснений. Каждый элемент массива — объект с полями:
- "word": слово или выражение на изучаемом языке. Для английского — само слово. Для японского — запись ХИРАГАНОЙ (никогда не кандзи);
- "translation": перевод на русский;
- "example_sentence": короткий пример на изучаемом языке;
- "accepted_answers": массив всех допустимых письменных вариантов ответа. Для японского ОБЯЗАТЕЛЬНО добавь сюда кандзи-форму слова (если она есть) в дополнение к хирагане.
"""


def _build_user_prompt(request: schemas.GenerateDeckRequest) -> str:
    lang_name = "английского" if request.language == Language.EN else "японского"
    return (
        f"Сгенерируй {request.count} карточек для изучения {lang_name} языка "
        f"уровня {request.level.value} по теме «{request.topic}»."
    )


def _parse_cards(raw: str) -> list[schemas.GeneratedCard]:
    start, end = raw.find("["), raw.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise GenerationError("Модель не вернула JSON-массив")
    try:
        items = json.loads(raw[start : end + 1])
    except json.JSONDecodeError as e:
        raise GenerationError("Не удалось распарсить JSON от модели") from e

    cards: list[schemas.GeneratedCard] = []
    for item in items:
        try:
            cards.append(schemas.GeneratedCard.model_validate(item))
        except ValidationError:
            continue  # кривую карточку пропускаем, весь запрос не роняем
    if not cards:
        raise GenerationError("Модель не вернула ни одной валидной карточки")
    return cards


def generate_deck(
    db: Session,
    user_id: int,
    provider: LLMProvider,
    request: schemas.GenerateDeckRequest,
) -> Deck:
    raw = provider.complete(_SYSTEM_PROMPT, _build_user_prompt(request))
    generated = _parse_cards(raw)

    deck = Deck(
        user_id=user_id,
        topic=request.topic,
        language=request.language,
        level=request.level,
        source=DeckSource.AI_GENERATED,
    )
    for gc in generated:
        deck.cards.append(
            Card(
                word=gc.word,
                reference=gc.reference or gc.word,  # эталон = слово (для ИИ всегда совпадает)
                translation=gc.translation,
                example_sentence=gc.example_sentence,
                accepted_answers=gc.accepted_answers,
            )
        )

    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


class JobNotFoundError(Exception):
    """Задача генерации не найдена или принадлежит другому пользователю."""


def create_job(
    db: Session, user_id: int, request: schemas.GenerateDeckRequest
) -> GenerationJob:
    job = GenerationJob(
        user_id=user_id,
        status=JobStatus.PENDING,
        topic=request.topic,
        language=request.language,
        level=request.level,
        count=request.count,
    )
    db.add(job)
    db.commit()          # сначала фиксируем job в БД...
    db.refresh(job)
    publish_generation_job(job.id)   # ...и только потом публикуем
    return job


def get_job(db: Session, user_id: int, job_id: int) -> GenerationJob:
    job = db.scalar(
        select(GenerationJob).where(
            GenerationJob.id == job_id,
            GenerationJob.user_id == user_id,
        )
    )
    if job is None:
        raise JobNotFoundError(job_id)
    return job

def process_job(db: Session, provider: LLMProvider, job_id: int) -> None:
    job = db.get(GenerationJob, job_id)
    if job is None:
        return  # задача исчезла — пропускаем

    user_id = job.user_id
    job.status = JobStatus.PROCESSING
    db.commit()

    try:
        request = schemas.GenerateDeckRequest(
            topic=job.topic,
            language=job.language,
            level=job.level,
            count=job.count,
        )
        deck = generate_deck(db, user_id, provider, request)
    except Exception as e:
        db.rollback()
        job = db.get(GenerationJob, job_id)
        job.status = JobStatus.FAILED
        job.error = str(e)[:1000]
        db.commit()
        publish_notification(user_id, job_id, JobStatus.FAILED, None)
        return

    job.status = JobStatus.DONE
    job.deck_id = deck.id
    db.commit()
    publish_notification(user_id, job_id, JobStatus.DONE, deck.id)