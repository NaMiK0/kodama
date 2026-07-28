from difflib import SequenceMatcher
from enum import StrEnum

from app.core.text import normalize
from app.modules.study.enums import AnswerDirection

__all__ = ["AnswerDirection", "MatchKind", "match_answer", "FUZZY_THRESHOLD", "FUZZY_MIN_LENGTH"]

FUZZY_THRESHOLD = 0.90
FUZZY_MIN_LENGTH = 5  # на коротких словах опечатка неотличима от другого слова


class MatchKind(StrEnum):
    EXACT = "exact"        # точное совпадение
    FUZZY = "fuzzy"        # опечатка, но засчитываем
    UNKNOWN = "unknown"    # не совпало — дальше решает LLM


def match_answer(answer: str, expected: list[str], allow_fuzzy: bool) -> MatchKind:
    normalized = normalize(answer)
    if not normalized:
        return MatchKind.UNKNOWN

    candidates = [normalize(e) for e in expected if e]

    if normalized in candidates:
        return MatchKind.EXACT

    if allow_fuzzy and len(normalized) >= FUZZY_MIN_LENGTH:
        for candidate in candidates:
            if len(candidate) < FUZZY_MIN_LENGTH:
                continue
            if SequenceMatcher(None, normalized, candidate).ratio() >= FUZZY_THRESHOLD:
                return MatchKind.FUZZY

    return MatchKind.UNKNOWN