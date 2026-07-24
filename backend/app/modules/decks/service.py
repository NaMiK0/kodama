from sqlalchemy import select
from sqlalchemy.orm import Session

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
    return deck

def list_decks(db: Session, user_id: int) -> list[Deck]:
    return list(db.scalars(select(Deck).where(Deck.user_id == user_id)))

def get_deck(db: Session, user_id: int, deck_id: int) -> Deck:
    deck = db.scalar(select(Deck).where(Deck.id == deck_id, Deck.user_id == user_id))
    if deck is None:
        raise DeckNotFoundError(deck_id)
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
    return deck

def delete_deck(db: Session, user_id: int, deck_id: int) -> None:
    deck = get_deck(db, user_id, deck_id)
    db.delete(deck)
    db.commit()