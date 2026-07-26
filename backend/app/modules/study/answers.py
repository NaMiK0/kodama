import unicodedata
from difflib import SequenceMatcher
from enum import StrEnum

FUZZY_THRESHOLD = 0.90
FUZZY_MIN_LENGTH = 5  # на коротких словах опечатка неотличима от другого слова


class AnswerDirection(StrEnum):
    TO_TARGET = "to_target"      # RU -> изучаемый язык
    TO_RUSSIAN = "to_russian"    # изучаемый язык -> RU


class MatchKind(StrEnum):
    EXACT = "exact"        # точное совпадение
    FUZZY = "fuzzy"        # опечатка, но засчитываем
    UNKNOWN = "unknown"    # не совпало — дальше решает LLM


def normalize(text: str) -> str:
    """Приводит ответ к каноничному виду перед сравнением."""
    text = unicodedata.normalize("NFKC", text)
    text = text.strip().lower()
    text = "".join(
        ch for ch in text if not unicodedata.category(ch).startswith("P")
    )
    return " ".join(text.split())


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