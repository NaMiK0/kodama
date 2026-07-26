from datetime import date

from app.modules.study.answers import AnswerDirection

from pydantic import BaseModel, ConfigDict, Field

class ReviewRequest(BaseModel):
    card_id: int
    answer: str
    direction: AnswerDirection
    # Заполнится, когда появится проверка произношения (0..1).
    pronunciation_score: float | None = Field(default=None, ge=0.0, le=1.0)


class ReviewResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    card_id: int
    # результат проверки ответа
    correct: bool
    kind: str
    expected: list[str]
    quality: int  # композитная оценка, посчитанная СЕРВЕРОМ
    # новое состояние расписания
    repetitions: int
    interval: int
    ease_factor: float
    next_review_date: date

class AnswerCheckRequest(BaseModel):
    card_id: int
    answer: str
    direction: AnswerDirection


class AnswerCheckResult(BaseModel):
    correct: bool
    kind: str            # exact | fuzzy | llm | incorrect
    expected: list[str]  # чтобы UI мог показать правильный ответ