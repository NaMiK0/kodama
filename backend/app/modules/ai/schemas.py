from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.ai.enums import JobStatus
from app.modules.cards.schemas import CardRead
from app.modules.decks.schemas import DeckCreate, DeckRead

class GenerateDeckRequest(DeckCreate):
    count: int = Field(default=10, ge=1, le=30)

class GeneratedCard(BaseModel):
    word: str
    reference: str | None = None
    translation: str
    example_sentence: str | None = None
    accepted_answers: list[str] = Field(default_factory=list)


class GeneratedDeckResponse(BaseModel):
    deck: DeckRead
    cards: list[CardRead]

class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: JobStatus
    deck_id: int | None
    error: str | None
    created_at: datetime