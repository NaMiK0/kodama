from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth import schemas, service
from app.modules.auth.models import User
from app.modules.auth.dependencies import get_current_user
from app.core.security import create_access_token






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

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> schemas.Token:
    user = service.authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=str(user.id))
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user