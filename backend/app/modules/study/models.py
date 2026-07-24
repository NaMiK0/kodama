from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.modules.study.sm2 import INITIAL_EASE_FACTOR

class UserCardProgress(Base):
    __tablename__ = "user_card_progress"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    ease_factor: Mapped[float] = mapped_column(default=INITIAL_EASE_FACTOR)
    interval: Mapped[int] = mapped_column(default=0)
    repetitions: Mapped[int] = mapped_column(default=0)
    next_review_date: Mapped[date] = mapped_column(Date, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "card_id", name="uq_user_card"),
    )