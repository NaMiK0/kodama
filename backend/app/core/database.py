from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, echo=False)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Базовый класс всех ORM-моделей. От него будут наследоваться таблицы,
    а его metadata потом использует Alembic для генерации миграций."""

    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI-зависимость: открывает сессию на время запроса и гарантированно
    закрывает её в конце — даже если внутри обработчика произошла ошибка."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
