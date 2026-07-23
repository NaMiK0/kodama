from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
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
