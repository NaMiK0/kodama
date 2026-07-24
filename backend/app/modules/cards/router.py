from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.cards import schemas, service
from app.modules.cards.models import Card
from app.modules.decks.service import DeckNotFoundError

router = APIRouter(prefix="/decks/{deck_id}/cards", tags=["cards"])


@router.post("", response_model=schemas.CardRead, status_code=status.HTTP_201_CREATED)
def create_card(
    deck_id: int,
    data: schemas.CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Card:
    try:
        return service.create_card(db, current_user.id, deck_id, data)
    except DeckNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Колода не найдена")
    except service.ReferenceRequiredError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Для японской карточки нужно указать reference (чтение хираганой)",
        )


@router.get("", response_model=list[schemas.CardRead])
def list_cards(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Card]:
    try:
        return service.list_cards(db, current_user.id, deck_id)
    except DeckNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Колода не найдена")


@router.get("/{card_id}", response_model=schemas.CardRead)
def get_card(
    deck_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Card:
    try:
        return service.get_card(db, current_user.id, deck_id, card_id)
    except (DeckNotFoundError, service.CardNotFoundError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")


@router.patch("/{card_id}", response_model=schemas.CardRead)
def update_card(
    deck_id: int,
    card_id: int,
    data: schemas.CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Card:
    try:
        return service.update_card(db, current_user.id, deck_id, card_id, data)
    except (DeckNotFoundError, service.CardNotFoundError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    deck_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        service.delete_card(db, current_user.id, deck_id, card_id)
    except (DeckNotFoundError, service.CardNotFoundError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
