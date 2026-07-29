import logging
from difflib import SequenceMatcher
from functools import lru_cache

import whisper

from app.core.config import settings
from app.core.text import fold_kana, normalize
from app.modules.decks.enums import Language
from app.modules.pronunciation.audio import load_audio_16k_mono
from app.modules.pronunciation.checker import PronunciationResult


logger = logging.getLogger("kodama.whisper")


@lru_cache
def _load_model():
    """Общая модель на оба языка — кэш по факту первого вызова, не привязан
    к языку. Раздельные WhisperChecker(EN)/WhisperChecker(JA) не должны
    грузить модель дважды."""
    logger.info("Загружаю модель Whisper '%s'...", settings.whisper_model)
    model = whisper.load_model(settings.whisper_model)
    logger.info("Модель Whisper загружена")
    return model


class WhisperChecker:
    """Транскрибация Whisper + сравнение текста с эталоном — для обоих языков.

    Раньше английский проверялся отдельным фонемным анализатором (wav2vec2 +
    espeak-ng), но на замере живых данных он проваливал короткую лексику A1
    (score=0 на "cat"/"book"/"hello" при чистом произношении — арифметика
    RAW_FLOOR на коротких словах, см. историю). Whisper на тех же словах
    отличает верное произношение от акцента: 8/8 на эталонном голосе против
    4/8 на голосе с сильным акцентом (не распознал "cat"→"Good.",
    "hello"→"Cool.").

    Сравнение текста зависит от языка:
    - японский: посимвольный SequenceMatcher после fold_kana — кана - это
      моры, орфография (кандзи/кана) не имеет отношения к звучанию;
    - английский: точное совпадение после normalize(). Посимвольное сравнение
      вводит в заблуждение — "able" вместо "apple" даёт ratio 0.67 ("Похоже"),
      хотя это другое слово, а не лёгкая невнятность.
    """

    def __init__(self, language: Language) -> None:
        self._language = language
        self._model = _load_model()

    def check(self, audio_path: str, expected: list[str]) -> PronunciationResult:
        audio = load_audio_16k_mono(audio_path)
        result = self._model.transcribe(
            audio,
            language=self._language.value,
            fp16=False,  # на CPU fp16 не поддерживается
        )
        transcript = str(result.get("text", "")).strip()

        if self._language == Language.JA:
            return self._score_ja(transcript, expected)
        return self._score_en(transcript, expected)

    def _score_ja(self, transcript: str, expected: list[str]) -> PronunciationResult:
        # fold_kana: Whisper выдаёт ネコ там, где карточка хранит ねこ —
        # в речи это один и тот же звук, различать записи бессмысленно.
        normalized = fold_kana(normalize(transcript))
        candidates = [fold_kana(normalize(form)) for form in expected if form]

        # Берём ЛУЧШЕЕ совпадение: Whisper может выдать кандзи, а reference —
        # кана, и наоборот. Любая допустимая запись засчитывается.
        score = 0.0
        best_match = ""
        for candidate in candidates:
            ratio = SequenceMatcher(None, normalized, candidate).ratio()
            if ratio > score:
                score, best_match = ratio, candidate

        return PronunciationResult(
            score=score,
            transcript=transcript[:255],
            detail={"matched": best_match, "normalized": normalized},
        )

    def _score_en(self, transcript: str, expected: list[str]) -> PronunciationResult:
        normalized = normalize(transcript)
        candidates = [normalize(form) for form in expected if form]
        score = 1.0 if normalized in candidates else 0.0

        return PronunciationResult(score=score, transcript=transcript[:255], detail=None)
