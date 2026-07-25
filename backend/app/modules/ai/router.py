from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai import schemas, service
from app.modules.ai.models import GenerationJob
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/decks",
    response_model=schemas.JobRead,
    status_code=status.HTTP_202_ACCEPTED,
)
def generate_deck(
    request: schemas.GenerateDeckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerationJob:
    # Не генерим здесь — создаём задачу, кладём в очередь и сразу отвечаем.
    return service.create_job(db, current_user.id, request)


@router.get("/jobs/{job_id}", response_model=schemas.JobRead)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerationJob:
    try:
        return service.get_job(db, current_user.id, job_id)
    except service.JobNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
