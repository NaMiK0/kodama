from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai.provider import LLMProvider, get_llm_provider
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
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
        )
    except service.CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")


@router.get("/due", response_model=list[schemas.StudyItem])
def due_cards(
    language: Language,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[schemas.StudyItem]:
    return service.get_due_cards(db, current_user.id, language)


@router.get("/new", response_model=list[schemas.StudyItem])
def new_cards(
    language: Language,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[schemas.StudyItem]:
    return service.get_new_cards(db, current_user.id, language, limit)

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
