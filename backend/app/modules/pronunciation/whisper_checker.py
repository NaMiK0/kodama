import logging
from difflib import SequenceMatcher

import whisper

from app.core.config import settings
from app.core.text import fold_kana, normalize
from app.modules.pronunciation.audio import load_audio_16k_mono
from app.modules.pronunciation.checker import PronunciationResult

logger = logging.getLogger("kodama.whisper")


class WhisperChecker:
    """Японский: транскрибация Whisper + сравнение текста с эталоном.

    Осознанный компромисс MVP: оцениваем ЧТО сказано, а не КАК произнесено —
    внятных open-source инструментов для японской фонетики нет.
    """

    def __init__(self) -> None:
        logger.info("Загружаю модель Whisper '%s'...", settings.whisper_model)
        self._model = whisper.load_model(settings.whisper_model)
        logger.info("Модель Whisper загружена")

    def check(self, audio_path: str, expected: list[str]) -> PronunciationResult:
        audio = load_audio_16k_mono(audio_path)

        result = self._model.transcribe(
            audio,
            language="ja",
            fp16=False,  # на CPU fp16 не поддерживается
        )
        transcript = str(result.get("text", "")).strip()

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
