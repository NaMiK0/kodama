"""Композитная оценка качества (0..5) для SM-2.

Собирается из двух источников: письменный перевод и (опционально) произношение.
Чистая логика без БД и сети — как sm2.
"""

CORRECT_EXACT = 5
CORRECT_APPROX = 4  # опечатка или синоним, принятый LLM
SHAKY_PRONUNCIATION = 3  # перевод верен, но произношение хромает
INCORRECT = 2  # < 3 => SM-2 сбросит интервал

GOOD_PRONUNCIATION = 0.8
POOR_PRONUNCIATION = 0.5


def composite_quality(
    answer_kind: str, pronunciation_score: float | None = None
) -> int:
    """answer_kind: exact | fuzzy | llm | incorrect.
    pronunciation_score: 0..1, либо None — если произношение не проверялось."""
    if answer_kind == "incorrect":
        return INCORRECT  # перевод неверный — низкая оценка, интервал сбрасывается

    base = CORRECT_EXACT if answer_kind == "exact" else CORRECT_APPROX

    if pronunciation_score is None:
        return base  # произношения не было — оцениваем только перевод

    if pronunciation_score >= GOOD_PRONUNCIATION:
        return base
    if pronunciation_score >= POOR_PRONUNCIATION:
        return max(SHAKY_PRONUNCIATION, base - 1)
    return SHAKY_PRONUNCIATION
