from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.modules.study.enums import AnswerDirection
from app.modules.study.sm2 import INITIAL_EASE_FACTOR


def _str_enum(enum_cls: type[StrEnum]) -> Enum:
    return Enum(
        enum_cls,
        native_enum=False,
        values_callable=lambda e: [m.value for m in e]
    )

class UserCardProgress(Base):
    __tablename__ = "user_card_progress"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    # Единица расписания — не карточка, а «карточка + сторона»: узнавание
    # (язык -> RU) и воспроизведение (RU -> язык) осваиваются с разной
    # скоростью, поэтому у каждой стороны свой интервал. С одной строкой на
    # карточку ответ в одну сторону затирал бы расписание другой.
    direction: Mapped[AnswerDirection] = mapped_column(_str_enum(AnswerDirection))
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
        UniqueConstraint("user_id", "card_id", "direction", name="uq_user_card_direction"),
    )