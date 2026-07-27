from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.cards.models import Card
from app.modules.decks import schemas
from app.modules.decks.enums import LANGUAGE_LEVELS
from app.modules.decks.models import Deck

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

def list_decks(db: Session, user_id: int) -> list[Deck]:
    # Считаем карточки одним запросом (коррелированный подзапрос), а не
    # обращением к deck.cards в цикле — иначе на N колод вышло бы N+1 запрос.
    card_count_subq = (
        select(func.count(Card.id))
        .where(Card.deck_id == Deck.id)
        .correlate(Deck)
        .scalar_subquery()
    )
    rows = db.execute(
        select(Deck, card_count_subq.label("card_count"))
        .where(Deck.user_id == user_id)
        .order_by(Deck.created_at.desc())
    ).all()

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

def delete_deck(db: Session, user_id: int, deck_id: int) -> None:
    deck = get_deck(db, user_id, deck_id)
    db.delete(deck)
    db.commit()
