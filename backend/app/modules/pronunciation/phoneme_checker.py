import logging
import subprocess
from difflib import SequenceMatcher

import torch
from transformers import Wav2Vec2CTCTokenizer, Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC

from app.modules.pronunciation.audio import SAMPLE_RATE, load_audio_16k_mono
from app.modules.pronunciation.checker import PronunciationResult

logger = logging.getLogger("kodama.phonemes")

MODEL_NAME = "facebook/wav2vec2-lv-60-espeak-cv-ft"
ESPEAK_VOICE = "en-us"
_ESPEAK_TIMEOUT = 10

# Калибровка сырого совпадения фонем в оценку 0..1.
# Подобрана на синтезированной речи диктора; на живых пользователях
# сырые значения будут ниже — константы стоит подкрутить по реальным данным.
RAW_FLOOR = 0.35  # ниже — явно другое слово
RAW_CEILING = 0.75  # выше — уверенно верно

# Модель не размечает ударения, а espeak их ставит — убираем.
_STRESS_MARKS = str.maketrans("", "", "ˈˌ")


class G2PError(Exception):
    """Не удалось получить эталонные фонемы."""


def _grapheme_to_phonemes(word: str) -> str:
    """Буквы -> IPA через espeak-ng (тот же фонемный алфавит, что у модели)."""
    try:
        process = subprocess.run(
            ["espeak-ng", "-q", "--ipa", "-v", ESPEAK_VOICE, word],
            capture_output=True,
            text=True,
            check=True,
            timeout=_ESPEAK_TIMEOUT,
        )
    except FileNotFoundError as e:
        raise G2PError("espeak-ng не установлен") from e
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        raise G2PError("espeak-ng не смог обработать слово") from e

    return process.stdout.strip().translate(_STRESS_MARKS).replace(" ", "")


def _calibrate(raw: float) -> float:
    """Растягивает рабочий диапазон сырого совпадения на 0..1."""
    if raw <= RAW_FLOOR:
        return 0.0
    if raw >= RAW_CEILING:
        return 1.0
    return (raw - RAW_FLOOR) / (RAW_CEILING - RAW_FLOOR)


class PhonemeChecker:
    """Английский: распознаём ФОНЕМЫ и сравниваем со звучанием эталона.

    В отличие от японского (там Whisper отвечает на вопрос «какое слово»),
    здесь мы отвечаем на вопрос «какие звуки» — и можем показать,
    что именно произнесено не так.
    """

    def __init__(self) -> None:
        logger.info("Загружаю фонемную модель '%s'...", MODEL_NAME)
        self._features = Wav2Vec2FeatureExtractor.from_pretrained(MODEL_NAME)
        self._tokenizer = Wav2Vec2CTCTokenizer.from_pretrained(MODEL_NAME)
        self._model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
        self._model.eval()
        # Словарь фонем, длинные вперёд — для жадного разбора строки на звуки.
        self._phonemes = sorted(
            (p for p in self._tokenizer.get_vocab() if not p.startswith("<")),
            key=len,
            reverse=True,
        )
        logger.info("Фонемная модель загружена")

    def _split_phonemes(self, text: str) -> list[str]:
        """Строка IPA -> список ЗВУКОВ (aɪ, ɔː — по одному, хоть и два символа).

        Сравнение по звукам, а не по символам: иначе составные фонемы
        частично совпадают и завышают оценку неверных ответов.
        """
        result: list[str] = []
        i = 0
        while i < len(text):
            for phoneme in self._phonemes:
                if text.startswith(phoneme, i):
                    result.append(phoneme)
                    i += len(phoneme)
                    break
            else:
                result.append(text[i])
                i += 1
        return result

    def _recognize(self, audio_path: str) -> str:
        audio = load_audio_16k_mono(audio_path)
        inputs = self._features(
            audio, sampling_rate=SAMPLE_RATE, return_tensors="pt"
        )
        with torch.no_grad():
            logits = self._model(inputs.input_values).logits
        predicted_ids = torch.argmax(logits, dim=-1)[0]
        return self._tokenizer.decode(predicted_ids).replace(" ", "")

    def check(self, audio_path: str, expected: list[str]) -> PronunciationResult:
        word = expected[0] if expected else ""
        reference = _grapheme_to_phonemes(word)

        heard = self._recognize(audio_path)
        heard_phonemes = self._split_phonemes(heard)
        reference_phonemes = self._split_phonemes(reference)

        matcher = SequenceMatcher(None, heard_phonemes, reference_phonemes)
        score = _calibrate(matcher.ratio())

        return PronunciationResult(
            score=score,
            transcript=heard[:255],
            detail={
                "expected_phonemes": reference_phonemes,
                "heard_phonemes": heard_phonemes,
                "mismatches": self._collect_mismatches(matcher),
            },
        )

    @staticmethod
    def _collect_mismatches(matcher: SequenceMatcher) -> list[dict[str, str]]:
        """Что именно прозвучало не так — ради этого фонемы и затевались."""
        heard, reference = matcher.a, matcher.b
        mismatches = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                continue
            mismatches.append(
                {
                    "expected": "".join(reference[j1:j2]),
                    "heard": "".join(heard[i1:i2]),
                }
            )
        return mismatches
