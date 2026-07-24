from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CardCreate(BaseModel):
    word: str = Field(min_length=1, max_length=255)
    translation: str = Field(min_length=1, max_length=255)
    # reference опционален: для английского сервис проставит его из word,
    # для японского — обязателен (иначе 422).
    reference: str | None = Field(default=None, max_length=255)
    example_sentence: str | None = None
    accepted_answers: list[str] = Field(default_factory=list)


class CardUpdate(BaseModel):
    word: str | None = Field(default=None, min_length=1, max_length=255)
    translation: str | None = Field(default=None, min_length=1, max_length=255)
    reference: str | None = Field(default=None, max_length=255)
    example_sentence: str | None = None
    accepted_answers: list[str] | None = None


class CardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    deck_id: int
    word: str
    reference: str
    translation: str
    example_sentence: str | None
    accepted_answers: list[str]
    created_at: datetime
