from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai import schemas, service
from app.modules.ai.provider import LLMProvider, get_llm_provider
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post(
    "/decks",
    response_model=schemas.GeneratedDeckResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_deck(
    request:schemas.GenerateDeckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    provider: LLMProvider = Depends(get_llm_provider),
) -> schemas.GeneratedDeckResponse:
    try:
        deck = service.generate_deck(db, current_user.id, provider, request)
    except service.GenerationError as e:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Не удалось сгенерировать колоду: {e}",
        )
    return schemas.GeneratedDeckResponse(deck=deck, cards=deck.cards)