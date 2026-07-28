from datetime import datetime

from enum import StrEnum

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.decks.enums import DeckSource, Language, Level

def _str_enum(enum_cls: type[StrEnum]) -> Enum:
    return Enum(
        enum_cls,
        native_enum=False,
        values_callable=lambda e: [m.value for m in e]
    )

if TYPE_CHECKING:
    from app.modules.auth.models import User
    from app.modules.cards.models import Card

class Deck(Base):
    __tablename__ = "decks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    topic: Mapped[str] = mapped_column(String(255))
    language: Mapped[Language] = mapped_column(_str_enum(Language))
    level: Mapped[Level] = mapped_column(_str_enum(Level))
    source: Mapped[DeckSource] = mapped_column(
        _str_enum(DeckSource), default=DeckSource.USER_CREATED
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="decks")
    cards: Mapped[list["Card"]] = relationship(
        back_populates="deck",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        # Список колод всегда запрашивается в разрезе «мои колоды на этом
        # языке» — составной индекс покрывает такой запрос целиком, тогда как
        # одиночный ix_decks_user_id заставил бы отфильтровывать язык поверх.
        Index("ix_decks_user_id_language", "user_id", "language"),
        CheckConstraint(
            "(language = 'en' AND level IN ('A1','A2','B1','B2','C1','C2')) "
            "OR (language = 'ja' AND level IN ('N5','N4','N3','N2','N1'))",
            name="ck_deck_level_matches_language",
        ),
    )