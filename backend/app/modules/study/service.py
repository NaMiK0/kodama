from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cards.models import Card
from app.modules.decks.models import Deck
from app.modules.study.models import UserCardProgress
from app.modules.study.sm2 import INITIAL_EASE_FACTOR, sm2

class CardNotFoundError(Exception):
    """Карточка не найдена или принадлежит другому пользователю."""

def _get_owned_card(db: Session, user_id: int, card_id: int) -> Card:
    card = db.scalar(select(Card).join(Deck).where(Card.id == card_id, Deck.user_id == user_id))
    if card is None:
        raise CardNotFoundError(card_id)
    return card

def submit_review(
        db: Session,
        user_id: int,
        card_id: int,
        quality: int
) -> UserCardProgress:
    _get_owned_card(db, user_id, card_id) #проверка владения

    progress = db.scalar(select(UserCardProgress).where(UserCardProgress.user_id == user_id, UserCardProgress.card_id == card_id))

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
        progress = UserCardProgress(user_id=user_id, card_id=card_id)
        db.add(progress)

    progress.ease_factor = result.ease_factor
    progress.interval = result.interval
    progress.repetitions = result.repetitions
    progress.next_review_date = next_review

    db.commit()
    db.refresh(progress)
    return progress

def get_due_cards(db: Session, user_id: int) -> list[Card]:
    today = date.today()
    return list(
        db.scalars(
            select(Card)
            .join(UserCardProgress, UserCardProgress.card_id == Card.id)
            .where(
                UserCardProgress.user_id == user_id,
                UserCardProgress.next_review_date <= today,
            )
        )
    )

def get_new_cards(db: Session, user_id: int) -> list[Card]:
    reviewed = select(UserCardProgress.card_id).where(
        UserCardProgress.user_id == user_id
    )
    return list(
        db.scalars(
            select(Card)
            .join(Deck)
            .where(Deck.user_id == user_id, Card.id.not_in(reviewed))
        )
    )
