from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.modules.pronunciation.enums import AttemptStatus


class AttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    card_id: int
    status: AttemptStatus
    score: float | None
    transcript: str | None
    detail: dict[str, Any] | None
    error: str | None
    created_at: datetime
