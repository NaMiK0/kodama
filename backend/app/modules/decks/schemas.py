from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.decks.enums import LANGUAGE_LEVELS, DeckSource, DeckTier, Language, Level

class DeckCreate(BaseModel):
    topic: str = Field(min_length=1, max_length=255)
    language: Language
    level: Level

    @model_validator(mode="after")
    def check_level_matches_language(self) -> "DeckCreate":
        if self.level not in LANGUAGE_LEVELS[self.language]:
            raise ValueError(f"Уровень {self.level.value} не подходит языку {self.language.value}")
        return self

class DeckUpdate(BaseModel):
    topic: str | None = Field(default=None, min_length=1, max_length=255)
    level: Level | None = None

class DeckRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic: str
    language: Language
    level: Level
    source: DeckSource
    created_at: datetime
    # Не колонка в БД — служба вычисляет одним запросом и прикрепляет
    # к ORM-объекту (deck.card_count = ...) перед возвратом.
    card_count: int


class CollectionEntry(BaseModel):
    """Одна карточка коллекции — колода вместе с её тиром."""
    model_config = ConfigDict(from_attributes=True)

    deck: DeckRead
    tier: DeckTier
    avg_ease_factor: float

