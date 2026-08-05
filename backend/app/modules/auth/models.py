from datetime import datetime

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.decks.models import Deck


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    password_hash: Mapped[str | None] = mapped_column(String(255))
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    reset_token_hash: Mapped[str | None] = mapped_column(String(255))
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
        )

    # Настройки пользователя. Отдельной таблицы под них пока не заводим —
    # их всего две, JOIN ради этого не оправдан.
    offer_pronunciation: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    new_cards_daily_limit: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="20"
    )

    decks: Mapped[list["Deck"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "password_hash IS NOT NULL OR google_id IS NOT NULL",
            name="ck_user_has_auth_method",
        ),
        CheckConstraint(
            "new_cards_daily_limit BETWEEN 1 AND 50",
            name="ck_user_new_cards_daily_limit_range",
        ),
    )
