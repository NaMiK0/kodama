from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cards import schemas
from app.modules.cards.models import Card
from app.modules.decks import service as decks_service
from app.modules.decks.enums import Language


class CardNotFoundError(Exception):
    """Карточка не найдена в этой колоде."""


class ReferenceRequiredError(Exception):
    """Для японского reference (чтение) обязателен — вывести из word нельзя."""


def create_card(
    db: Session, user_id: int, deck_id: int, data: schemas.CardCreate
) -> Card:
    # get_deck заодно проверяет владение колодой (иначе DeckNotFoundError)
    deck = decks_service.get_deck(db, user_id, deck_id)

    reference = data.reference
    if reference is None:
        if deck.language == Language.EN:
            reference = data.word          # для английского reference == word
        else:
            raise ReferenceRequiredError

    card = Card(
        deck_id=deck.id,
        word=data.word,
        reference=reference,
        translation=data.translation,
        example_sentence=data.example_sentence,
        accepted_answers=data.accepted_answers,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def list_cards(db: Session, user_id: int, deck_id: int) -> list[Card]:
    decks_service.get_deck(db, user_id, deck_id)  # проверка владения колодой
    return list(db.scalars(select(Card).where(Card.deck_id == deck_id)))


def get_card(db: Session, user_id: int, deck_id: int, card_id: int) -> Card:
    decks_service.get_deck(db, user_id, deck_id)
    card = db.scalar(
        select(Card).where(Card.id == card_id, Card.deck_id == deck_id)
    )
    if card is None:
        raise CardNotFoundError(card_id)
    return card


def update_card(
    db: Session, user_id: int, deck_id: int, card_id: int, data: schemas.CardUpdate
) -> Card:
    card = get_card(db, user_id, deck_id, card_id)

    if data.word is not None:
        card.word = data.word
    if data.translation is not None:
        card.translation = data.translation
    if data.reference is not None:
        card.reference = data.reference
    if data.example_sentence is not None:
        card.example_sentence = data.example_sentence
    if data.accepted_answers is not None:
        card.accepted_answers = data.accepted_answers

    db.commit()
    db.refresh(card)
    return card


def delete_card(db: Session, user_id: int, deck_id: int, card_id: int) -> None:
    card = get_card(db, user_id, deck_id, card_id)
    db.delete(card)
    db.commit()
