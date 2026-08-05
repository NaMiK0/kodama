from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.modules.cards.models import Card
from app.modules.decks import schemas
from app.modules.decks.enums import LANGUAGE_LEVELS, DeckTier, Language
from app.modules.decks.models import Deck
from app.modules.study.enums import AnswerDirection
from app.modules.study.models import UserCardProgress

# Пороги среднего ease_factor SM-2 для тира коллекции (см. DeckTier).
# INITIAL_EASE_FACTOR = 2.5: ниже него колода в среднем спотыкалась
# (ease_factor падает при quality < 3), выше — уверенно отвечали верно.
# Откалиброваны на глаз, как FUZZY-порог в answers.py — донастроить по
# реальным данным, когда наберётся история использования.
_SILVER_EASE_THRESHOLD = 2.3
_GOLD_EASE_THRESHOLD = 2.6


def _tier_for_ease(avg_ease: float) -> DeckTier:
    if avg_ease >= _GOLD_EASE_THRESHOLD:
        return DeckTier.GOLD
    if avg_ease >= _SILVER_EASE_THRESHOLD:
        return DeckTier.SILVER
    return DeckTier.BRONZE

class DeckNotFoundError(Exception):
    """Колода не найдена или принадлежит другому пользователю."""

class InvalidLevelError(Exception):
    """Уровень не соответствует языку колоды."""

def create_deck(db: Session, user_id: int, data: schemas.DeckCreate) -> Deck:
    deck = Deck(
        user_id=user_id,
        topic=data.topic,
        language=data.language,
        level=data.level,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    deck.card_count = 0  # только что созданная колода — карточек ещё нет
    return deck

def list_decks(
    db: Session,
    user_id: int,
    language: Language | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[Deck]:
    # Считаем карточки одним запросом (коррелированный подзапрос), а не
    # обращением к deck.cards в цикле — иначе на N колод вышло бы N+1 запрос.
    card_count_subq = (
        select(func.count(Card.id))
        .where(Card.deck_id == Deck.id)
        .correlate(Deck)
        .scalar_subquery()
    )
    stmt = select(Deck, card_count_subq.label("card_count")).where(Deck.user_id == user_id)

    # Язык — не косметический фильтр: у каждого языка свой прогресс, поэтому
    # экраны всегда работают в разрезе одного языка. None оставлен для срезов
    # по обоим языкам сразу (например, будущая коллекция пройденных колод).
    if language is not None:
        stmt = stmt.where(Deck.language == language)

    # Сортировка до limit/offset — иначе страницы поехали бы: без ORDER BY
    # порядок строк в Postgres не гарантирован между запросами.
    stmt = stmt.order_by(Deck.created_at.desc())

    if offset:
        stmt = stmt.offset(offset)
    if limit is not None:
        stmt = stmt.limit(limit)

    rows = db.execute(stmt).all()

    decks = []
    for deck, card_count in rows:
        deck.card_count = card_count
        decks.append(deck)
    return decks

def get_deck(db: Session, user_id: int, deck_id: int) -> Deck:
    deck = db.scalar(select(Deck).where(Deck.id == deck_id, Deck.user_id == user_id))
    if deck is None:
        raise DeckNotFoundError(deck_id)
    deck.card_count = len(deck.cards)
    return deck

def update_deck(db: Session, user_id: int, deck_id: int, data: schemas.DeckUpdate) -> Deck:
    deck = get_deck(db, user_id, deck_id)

    if data.level is not None and data.level not in LANGUAGE_LEVELS[deck.language]:
        raise InvalidLevelError(data.level)

    if data.topic is not None:
        deck.topic = data.topic
    if data.level is not None:
        deck.level = data.level

    db.commit()
    db.refresh(deck)
    deck.card_count = len(deck.cards)
    return deck

def get_collection(
    db: Session, user_id: int, language: Language | None = None
) -> list[schemas.CollectionEntry]:
    """Коллекция полностью разобранных колод с их тиром (см. DeckTier).

    «Разобрана» — у каждой карточки колоды есть прогресс на to_russian (этой
    стороной любое слово входит в оборот, см. get_new_cards). Тир считаем по
    среднему ease_factor ПО ОБЕИМ сторонам сразу — так воспроизведение,
    открывшееся позже, тоже участвует в оценке, а не только узнавание.
    """
    # to_russian считаем через DISTINCT card_id внутри CASE: COUNT(DISTINCT
    # NULL) их игнорирует, поэтому строки с другим направлением не мешают.
    covered_case = case((UserCardProgress.direction == AnswerDirection.TO_RUSSIAN, Card.id))
    stmt = (
        select(
            Deck,
            func.count(func.distinct(Card.id)).label("total_cards"),
            func.count(func.distinct(covered_case)).label("covered_cards"),
            func.avg(UserCardProgress.ease_factor).label("avg_ease"),
        )
        .join(Card, Card.deck_id == Deck.id)
        .outerjoin(
            UserCardProgress,
            (UserCardProgress.card_id == Card.id) & (UserCardProgress.user_id == user_id),
        )
        .where(Deck.user_id == user_id)
        .group_by(Deck.id)
    )
    if language is not None:
        stmt = stmt.where(Deck.language == language)

    entries: list[schemas.CollectionEntry] = []
    for deck, total_cards, covered_cards, avg_ease in db.execute(stmt).all():
        # Пустая колода (0 карточек) формально «разобрана» пустым множеством,
        # но показывать её в коллекции бессмысленно — пропускаем.
        if total_cards == 0 or covered_cards != total_cards or avg_ease is None:
            continue
        deck.card_count = total_cards
        entries.append(
            schemas.CollectionEntry(
                deck=schemas.DeckRead.model_validate(deck),
                tier=_tier_for_ease(avg_ease),
                avg_ease_factor=avg_ease,
            )
        )
    return entries


def delete_deck(db: Session, user_id: int, deck_id: int) -> None:
    deck = get_deck(db, user_id, deck_id)
    db.delete(deck)
    db.commit()
