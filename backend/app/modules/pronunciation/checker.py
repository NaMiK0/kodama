from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Protocol

from app.core.config import settings
from app.modules.decks.enums import Language


@dataclass(frozen=True)
class PronunciationResult:
    score: float  # 0..1 — насколько произношение близко к эталону
    transcript: str  # что услышала модель
    detail: dict[str, Any] | None = None  # разбор (по фонемам — в фазе C)


class PronunciationChecker(Protocol):
    """Абстракция проверки произношения.

    Единая реализация для обоих языков — транскрибация Whisper с последующим
    сравнением текста с эталоном (фонемный анализ английского не прошёл
    проверку на живых данных, см. WhisperChecker).

    expected: допустимые формы слова. Первый элемент — канонический reference
    (эталон произношения); остальные — альтернативные записи (Whisper может
    выдать кандзи там, где reference хираганой, или вариант написания на EN).
    """

    def check(self, audio_path: str, expected: list[str]) -> PronunciationResult: ...


class StubChecker:
    """Заглушка: не трогает ML, нужна для отладки пайплайна целиком."""

    def check(self, audio_path: str, expected: list[str]) -> PronunciationResult:
        return PronunciationResult(
            score=0.9,
            transcript=expected[0] if expected else "",
            detail={"stub": True},
        )


@lru_cache
def get_checker(language: Language) -> PronunciationChecker:
    """Ленивый синглтон: модель загружается один раз на процесс.

    Импорт реальной реализации — ВНУТРИ функции, чтобы процесс API
    никогда не тянул torch: ML нужен только воркеру. lru_cache на language
    даёт по синглтону-инстансу WhisperChecker на каждый язык (у них разная
    логика сравнения текста), сама модель Whisper внутри общая (кэш HF).
    """
    if settings.pronunciation_backend != "real":
        return StubChecker()

    from app.modules.pronunciation.whisper_checker import WhisperChecker

    return WhisperChecker(language)
