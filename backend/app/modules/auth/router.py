from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth import schemas, service
from app.modules.auth.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post(
    "/register",
    response_model=schemas.UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)) -> User:
    try:
        return service.register_user(db, data)
    except service.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email уже существует",
        )

