import json

from pydantic import ValidationError
from sqlalchemy.orm import Session

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