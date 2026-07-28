from datetime import date, timedelta
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cards.models import Card
from app.modules.decks.models import Deck
from app.modules.study.models import UserCardProgress
from app.modules.study.sm2 import INITIAL_EASE_FACTOR, sm2
from app.modules.cards.schemas import CardRead
from app.core.redis import get_redis
from app.modules.ai.provider import LLMProvider
from app.modules.decks.enums import Language
from app.modules.study import schemas
from app.modules.study.grading import composite_quality
from app.modules.study.answers import (
    MatchKind,
    match_answer,
    normalize,
)
from app.modules.study.enums import AnswerDirection

_DUE_CACHE_TTL = 300  # секунд

# v2 в ключе: с переходом на пары «карточка + направление» изменилась форма
# значения. Без смены префикса клиенты 5 минут получали бы старый формат.
def _due_cache_key(user_id: int, language: Language) -> str:
    return f"study:due:v2:{user_id}:{language.value}"

class CardNotFoundError(Exception):
    """Карточка не найдена или принадлежит другому пользователю."""

def _get_owned_card(db: Session, user_id: int, card_id: int) -> Card:
    card = db.scalar(select(Card).join(Deck).where(Card.id == card_id, Deck.user_id == user_id))
    if card is None:
        raise CardNotFoundError(card_id)
    return card

def submit_review(
    db: Session,
    provider: LLMProvider,
    user_id: int,
    card_id: int,
    answer: str,
    direction: AnswerDirection,
    pronunciation_score: float | None = None,
) -> schemas.ReviewResult:
    # Оценку считает СЕРВЕР: сначала проверяем ответ, потом выводим quality.
    # check_answer заодно проверяет владение карточкой.
    verdict = check_answer(db, provider, user_id, card_id, answer, direction)
    quality = composite_quality(verdict.kind, pronunciation_score)

    # Расписание ведётся по паре «карточка + направление»: у узнавания и
    # воспроизведения одного слова свои интервалы.
    progress = db.scalar(
        select(UserCardProgress).where(
            UserCardProgress.user_id == user_id,
            UserCardProgress.card_id == card_id,
            UserCardProgress.direction == direction,
        )
    )

    if progress is None:
        ef, interval, reps = INITIAL_EASE_FACTOR, 0, 0
    else:
        ef, interval, reps = (
            progress.ease_factor,
            progress.interval,
            progress.repetitions,
        )
    result = sm2(ef, interval, reps, quality)
    next_review = date.today() + timedelta(days=result.interval)

    if progress is None:
        progress = UserCardProgress(user_id=user_id, card_id=card_id, direction=direction)
        db.add(progress)

    progress.ease_factor = result.ease_factor
    progress.interval = result.interval
    progress.repetitions = result.repetitions
    progress.next_review_date = next_review

    db.commit()
    db.refresh(progress)

    try:
        # check_answer уже сходил за card.deck.language, но доставать его здесь
        # заново — лишний запрос ради одного лишнего DEL. Языков всего два —
        # удаляем оба ключа, рассинхронизироваться нечему.
        redis = get_redis()
        for lang in Language:
            redis.delete(_due_cache_key(user_id, lang))
    except Exception:
        pass

    return schemas.ReviewResult(
        card_id=card_id,
        correct=verdict.correct,
        kind=verdict.kind,
        expected=verdict.expected,
        quality=quality,
        repetitions=progress.repetitions,
        interval=progress.interval,
        ease_factor=progress.ease_factor,
        next_review_date=progress.next_review_date,
    )

def get_due_cards(db: Session, user_id: int, language: Language) -> list[schemas.StudyItem]:
    redis = get_redis()
    key = _due_cache_key(user_id, language)

    try:
        cached = redis.get(key)
    except Exception:
        cached = None  # Redis недоступен — тихо идём в БД
    if cached is not None:
        return [schemas.StudyItem.model_validate(item) for item in json.loads(cached)]

    today = date.today()
    rows = db.execute(
        select(Card, UserCardProgress.direction)
        .join(UserCardProgress, UserCardProgress.card_id == Card.id)
        .join(Deck, Deck.id == Card.deck_id)
        .where(
            UserCardProgress.user_id == user_id,
            UserCardProgress.next_review_date <= today,
            Deck.language == language,
        )
        # Раньше подошедшая сторона идёт первой: если у карточки сегодня
        # подошли обе, оставим ту, что ждёт дольше.
        .order_by(UserCardProgress.next_review_date, UserCardProgress.id)
    ).all()

    # Обе стороны одного слова в одной сессии — это подсказка: ответ на
    # вторую только что был на экране. Берём одну, вторая догонит завтра
    # (просрочка для интервальных повторений — штатная ситуация).
    seen: set[int] = set()
    result: list[schemas.StudyItem] = []
    for card, direction in rows:
        if card.id in seen:
            continue
        seen.add(card.id)
        result.append(
            schemas.StudyItem(card=CardRead.model_validate(card), direction=direction)
        )

    try:
        redis.set(
            key,
            json.dumps([r.model_dump(mode="json") for r in result]),
            ex=_DUE_CACHE_TTL,
        )
    except Exception:
        pass  # не смогли закешировать — не критично

    return result

def get_new_cards(
    db: Session, user_id: int, language: Language, limit: int
) -> list[schemas.StudyItem]:
    """Новые задания на сегодня.

    Слово входит в оборот одной стороной — узнаванием (язык -> RU). Обратная
    сторона открывается только после того, как узнавание хоть раз удалось
    (repetitions >= 1): сначала узнать, потом доставать из головы. Побочный
    выигрыш — лимит новых остаётся лимитом новых СЛОВ, а не половинок.
    """
    known_directions = select(UserCardProgress.card_id).where(
        UserCardProgress.user_id == user_id,
        UserCardProgress.direction == AnswerDirection.TO_RUSSIAN,
    )
    # Воспроизведение открыто там, где узнавание уже прижилось.
    unlocked_recall = select(UserCardProgress.card_id).where(
        UserCardProgress.user_id == user_id,
        UserCardProgress.direction == AnswerDirection.TO_RUSSIAN,
        UserCardProgress.repetitions >= 1,
    )
    started_recall = select(UserCardProgress.card_id).where(
        UserCardProgress.user_id == user_id,
        UserCardProgress.direction == AnswerDirection.TO_TARGET,
    )

    fresh = list(
        db.scalars(
            select(Card)
            .join(Deck)
            .where(
                Deck.user_id == user_id,
                Deck.language == language,
                Card.id.not_in(known_directions),
            )
            .limit(limit)
        )
    )
    items = [
        schemas.StudyItem(
            card=CardRead.model_validate(card), direction=AnswerDirection.TO_RUSSIAN
        )
        for card in fresh
    ]

    remaining = limit - len(items)
    if remaining > 0:
        recall = list(
            db.scalars(
                select(Card)
                .join(Deck)
                .where(
                    Deck.user_id == user_id,
                    Deck.language == language,
                    Card.id.in_(unlocked_recall),
                    Card.id.not_in(started_recall),
                )
                .limit(remaining)
            )
        )
        items.extend(
            schemas.StudyItem(
                card=CardRead.model_validate(card), direction=AnswerDirection.TO_TARGET
            )
            for card in recall
        )

    return items

_ANSWER_CACHE_TTL = 604800  # 7 дней

_JUDGE_SYSTEM_PROMPT = (
    "Ты проверяешь ответ студента в приложении для изучения языков. "
    'Ответь РОВНО одним словом: "да" — если ответ студента приемлем, '
    '"нет" — если нет. Приемлемыми считай синонимы и явные опечатки. '
    "Не считай приемлемым другое по смыслу слово."
)


def _judge_with_llm(
    provider: LLMProvider,
    card_id: int,
    direction: str,
    answer: str,
    expected: list[str],
) -> bool:
    key = f"answer:{card_id}:{direction}:{normalize(answer)}"
    redis = get_redis()

    try:
        cached = redis.get(key)
    except Exception:
        cached = None
    if cached is not None:
        return cached == "1"

    user_prompt = (
        f"Правильные варианты: {', '.join(expected)}\n"
        f"Ответ студента: {answer}\n"
        "Приемлем ли ответ студента?"
    )
    try:
        raw = provider.complete(_JUDGE_SYSTEM_PROMPT, user_prompt)
    except Exception:
        return False  # LLM недоступен — не засчитываем

    correct = raw.strip().lower().startswith("да")

    try:
        redis.set(key, "1" if correct else "0", ex=_ANSWER_CACHE_TTL)
    except Exception:
        pass

    return correct


def check_answer(
    db: Session,
    provider: LLMProvider,
    user_id: int,
    card_id: int,
    answer: str,
    direction: AnswerDirection,
) -> schemas.AnswerCheckResult:
    card = _get_owned_card(db, user_id, card_id)

    if direction == AnswerDirection.TO_RUSSIAN:
        expected = [card.translation]
        allow_fuzzy = True
    else:
        # dict.fromkeys убирает дубли, сохраняя порядок
        # (у английского word и reference совпадают)
        expected = list(
            dict.fromkeys([card.word, card.reference, *card.accepted_answers])
        )
        # для японского опечатка неотличима от другого слова — только точное
        allow_fuzzy = card.deck.language != Language.JA

    kind = match_answer(answer, expected, allow_fuzzy)
    if kind in (MatchKind.EXACT, MatchKind.FUZZY):
        return schemas.AnswerCheckResult(correct=True, kind=kind.value, expected=expected)

    if _judge_with_llm(provider, card_id, direction.value, answer, expected):
        return schemas.AnswerCheckResult(correct=True, kind="llm", expected=expected)

    return schemas.AnswerCheckResult(correct=False, kind="incorrect", expected=expected)