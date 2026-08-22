from datetime import datetime

from enum import StrEnum

from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.decks.enums import Language

def _str_enum(enum_cls: type[StrEnum]) -> Enum:
    return Enum(
        enum_cls,
        native_enum=False,
        values_callable=lambda e: [m.value for m in e]
    )

if TYPE_CHECKING:
    from app.modules.auth.models import User
    from app.modules.decks.models import Deck

class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    language: Mapped[Language] = mapped_column(_str_enum(Language))
    name: Mapped[str] = mapped_column(String(255))

    # Самоссылка для вложенных папок. ON DELETE SET NULL — при удалении
    # родителя дети не удаляются каскадом: их «поднятие» на уровень выше
    # делает сервис (см. library/service.py:delete_folder), а FK лишь
    # подстраховывает целостность на случай прямого DELETE в обход сервиса.
    parent_folder_id: Mapped[int | None] = mapped_column(
        ForeignKey("folders.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="folders")
    parent: Mapped["Folder | None"] = relationship(
        remote_side="Folder.id", back_populates="children"
    )
    children: Mapped[list["Folder"]] = relationship(back_populates="parent")
    decks: Mapped[list["Deck"]] = relationship(back_populates="folder")

    __table_args__ = (
        # Список папок всегда запрашивается в разрезе «мои папки на этом
        # языке» — тот же паттерн, что ix_decks_user_id_language.
        Index("ix_folders_user_id_language", "user_id", "language"),
    )
