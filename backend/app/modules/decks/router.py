from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.decks import schemas, service
from app.modules.decks.enums import Language
from app.modules.decks.models import Deck

router = APIRouter(prefix="/decks", tags=["decks"])

@router.post("", response_model=schemas.DeckRead, status_code=status.HTTP_201_CREATED)
def create_deck(
    data: schemas.DeckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Deck:
    return service.create_deck(db, current_user.id, data)

@router.get("", response_model=list[schemas.DeckRead])
def list_decks(
    language: Language | None = None,
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Deck]:
    return service.list_decks(db, current_user.id, language, limit, offset)

@router.get("/collection", response_model=list[schemas.CollectionEntry])
def get_collection(
    language: Language | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[schemas.CollectionEntry]:
    # Путь должен идти ДО /{deck_id}: иначе "collection" пытался бы
    # распарситься как int-параметр deck_id и падал 422.
    return service.get_collection(db, current_user.id, language)


@router.get("/{deck_id}", response_model=schemas.DeckRead)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Deck:
    try:
        return service.get_deck(db,current_user.id, deck_id)
    except service.DeckNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Колода не найдена")

@router.patch("/{deck_id}", response_model=schemas.DeckRead)
def update_deck(
    deck_id: int,
    data: schemas.DeckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Deck:
    try:
        return service.update_deck(db, current_user.id, deck_id, data)
    except service.DeckNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Колода не найдена")
    except service.InvalidLevelError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Уровень не соответствует языку колоды",
        )

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        service.delete_deck(db, current_user.id, deck_id)
    except service.DeckNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Колода не найдена")