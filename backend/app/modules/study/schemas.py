from datetime import date

from pydantic import BaseModel, ConfigDict, Field

class ReviewRequest(BaseModel):
    card_id: int
    quality: int = Field(ge=0, le=5)


class ReviewResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    card_id: int
    repetitions: int
    interval: int
    ease_factor: float
    next_review_date: date
