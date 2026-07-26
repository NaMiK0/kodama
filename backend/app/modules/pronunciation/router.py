from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.pronunciation import schemas, service
from app.modules.pronunciation.models import PronunciationAttempt

router = APIRouter(prefix="/pronunciation", tags=["pronunciation"])


@router.post(
    "/attempts",
    response_model=schemas.AttemptRead,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_attempt(
    card_id: int = Form(...),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PronunciationAttempt:
    try:
        return service.create_attempt(
            db, current_user.id, card_id, audio.file, audio.content_type
        )
    except service.CardNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Карточка не найдена")
    except service.UnsupportedAudioError:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Неподдерживаемый формат аудио",
        )
    except service.AudioTooLargeError:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Файл слишком большой",
        )
    except service.EmptyAudioError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Пустой аудиофайл"
        )


@router.get("/attempts/{attempt_id}", response_model=schemas.AttemptRead)
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PronunciationAttempt:
    try:
        return service.get_attempt(db, current_user.id, attempt_id)
    except service.AttemptNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Попытка не найдена")
