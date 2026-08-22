from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.decks.enums import Language

class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    language: Language
    parent_folder_id: int | None = None

class FolderUpdate(BaseModel):
    """Частичное обновление (PATCH). Поле, отсутствующее в теле запроса,
    не должно трогаться — отличаем «не передано» от «явный null» через
    model_fields_set в сервисе, а не через сравнение с None."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_folder_id: int | None = None

class FolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    language: Language
    name: str
    parent_folder_id: int | None
    created_at: datetime
