from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.cards import schemas as card_schemas
from app.modules.cards.models import Card
from app.modules.study import schemas, service
from app.modules.study.models import UserCardProgress

router = APIRouter(prefix="/study", tags=["study"])

@router.post("/review", response_model=schemas.ReviewResult)
def submit_review(
    data: schemas.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserCardProgress:
    try:
        return service.submit_review(db, current_user.id, data.card_id, data.quality)
    except service.CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")


@router.get("/due", response_model=list[card_schemas.CardRead])
def due_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Card]:
    return service.get_due_cards(db, current_user.id)


@router.get("/new", response_model=list[card_schemas.CardRead])
def new_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Card]:
    return service.get_new_cards(db, current_user.id)