from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.modules.pronunciation.enums import AttemptStatus


class PronunciationAttempt(Base):
    __tablename__ = "pronunciation_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    card_id: Mapped[int] = mapped_column(
        ForeignKey("cards.id", ondelete="CASCADE"), index=True
    )

    status: Mapped[str] = mapped_column(String(20), default=AttemptStatus.PENDING)

    # Временный путь к загруженному аудио. После обработки файл удаляется,
    # а поле обнуляется — записи голоса мы не храним.
    audio_path: Mapped[str | None] = mapped_column(String(512))

    # ── результат ──
    score: Mapped[float | None] = mapped_column(Float)  # 0..1
    transcript: Mapped[str | None] = mapped_column(String(255))  # что услышала модель
    # Разбор по фонемам для английского (фаза C): какие звуки совпали, какие нет.
    detail: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    error: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
