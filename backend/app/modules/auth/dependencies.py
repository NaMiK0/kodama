from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.modules.auth.models import User

# auto_error=False — отсутствие заголовка больше НЕ ошибка: токен может лежать
# в куке. Схема остаётся ради кнопки Authorize в Swagger.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    header_token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Приоритет у куки: так ходит браузер. Заголовок — для Swagger, curl и тестов.
    token = request.cookies.get(settings.auth_cookie_name) or header_token
    if token is None:
        raise credentials_exception

    subject = decode_access_token(token)
    if subject is None:
        raise credentials_exception

    user = db.scalar(select(User).where(User.id == int(subject)))
    if user is None:
        raise credentials_exception
    return user
