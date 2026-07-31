from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai.provider import LLMProvider, get_llm_provider
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.cards.schemas import CardRead
from app.modules.decks import service as decks_service
from app.modules.decks.enums import Language
from app.modules.study import schemas, service

router = APIRouter(prefix="/study", tags=["study"])

@router.post("/review", response_model=schemas.ReviewResult)
def submit_review(
    data: schemas.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    provider: LLMProvider = Depends(get_llm_provider),
) -> schemas.ReviewResult:
    try:
        return service.submit_review(
            db,
            provider,
            current_user.id,
            data.card_id,
            data.answer,
            data.direction,
            data.pronunciation_score,
            data.learning_mistakes,
        )
    except service.CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")


@router.get("/due", response_model=list[schemas.StudyItem])
def due_cards(
    language: Language,
    deck_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[schemas.StudyItem]:
    if deck_id is not None:
        _check_deck_ownership(db, current_user.id, deck_id)
    return service.get_due_cards(db, current_user.id, language, deck_id)


@router.get("/new", response_model=list[schemas.StudyItem])
def new_cards(
    language: Language,
    limit: int = Query(default=20, ge=1, le=50),
    deck_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[schemas.StudyItem]:
    if deck_id is not None:
        _check_deck_ownership(db, current_user.id, deck_id)
    return service.get_new_cards(db, current_user.id, language, limit, deck_id)


def _check_deck_ownership(db: Session, user_id: int, deck_id: int) -> None:
    try:
        decks_service.get_deck(db, user_id, deck_id)
    except decks_service.DeckNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Колода не найдена")


@router.get("/unseen", response_model=list[CardRead])
def unseen_cards(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CardRead]:
    _check_deck_ownership(db, current_user.id, deck_id)
    return service.get_unseen_cards(db, current_user.id, deck_id)


@router.post("/mark-known", status_code=status.HTTP_204_NO_CONTENT)
def mark_known(
    data: schemas.MarkKnownRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        service.mark_known(db, current_user.id, data.card_id)
    except service.CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")


@router.post("/check-answer", response_model=schemas.AnswerCheckResult)
def check_answer(
    data: schemas.AnswerCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    provider: LLMProvider = Depends(get_llm_provider),
) -> schemas.AnswerCheckResult:
    try:
        return service.check_answer(
            db, provider, current_user.id, data.card_id, data.answer, data.direction
        )
    except service.CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
