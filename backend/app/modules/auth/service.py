from sqlalchemy import select
from sqlalchemy.orm import Session

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.email import EmailSender
from app.core.security import (
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.modules.auth import schemas
from app.modules.auth.models import User

class EmailAlreadyExistsError(Exception):
     """Пользователь с таким email уже зарегистрирован."""

def register_user(db: Session, data: schemas.UserRegister) -> User:
     email = data.email.lower()

     existing = db.scalar(select(User).where(User.email == email))
     if existing is not None:
          raise EmailAlreadyExistsError(email)
     user = User(email=email, password_hash=hash_password(data.password))
     db.add(user)
     db.commit()
     db.refresh(user)
     return user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
     user = db.scalar(select(User).where(User.email == email.lower()))
     if user is None or user.password_hash is None:
          return None
     if not verify_password(password, user.password_hash):
          return None
     return user

class InvalidResetTokenError(Exception):
    """Токен сброса неверен или истёк."""


def request_password_reset(db: Session, sender: EmailSender, email: str) -> None:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None:
        return  # молча выходим: не раскрываем, есть ли такой email

    token = generate_reset_token()
    user.reset_token_hash = hash_reset_token(token)
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.reset_token_expire_minutes
    )
    db.commit()

    link = f"{settings.frontend_base_url}/reset-password?token={token}"
    sender.send(
        to=user.email,
        subject="Восстановление пароля Kodama",
        body=(
            f"Чтобы задать новый пароль, перейдите по ссылке:\n{link}\n\n"
            f"Ссылка действительна {settings.reset_token_expire_minutes} минут.\n"
            "Если вы не запрашивали сброс — просто проигнорируйте это письмо."
        ),
    )


def reset_password(db: Session, token: str, new_password: str) -> None:
    user = db.scalar(
        select(User).where(User.reset_token_hash == hash_reset_token(token))
    )
    if user is None or user.reset_token_expires_at is None:
        raise InvalidResetTokenError

    if user.reset_token_expires_at < datetime.now(timezone.utc):
        raise InvalidResetTokenError

    user.password_hash = hash_password(new_password)
    user.reset_token_hash = None          # токен одноразовый — гасим
    user.reset_token_expires_at = None
    db.commit()

def authenticate_google_user(db: Session, email: str, google_id: str) -> User:
    """Находит пользователя по google_id, либо связывает существующий
    аккаунт с тем же email, либо создаёт нового (без пароля)."""
    user = db.scalar(select(User).where(User.google_id == google_id))
    if user is not None:
        return user

    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is not None:
        user.google_id = google_id  # связываем: раньше входил по паролю
    else:
        user = User(email=email.lower(), google_id=google_id)
        db.add(user)

    db.commit()
    db.refresh(user)
    return user
