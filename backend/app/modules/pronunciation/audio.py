import subprocess

import numpy as np

SAMPLE_RATE = 16_000
_FFMPEG_TIMEOUT = 60


class AudioDecodeError(Exception):
    """Не удалось декодировать аудио."""


def load_audio_16k_mono(path: str) -> np.ndarray:
    """Декодирует любой аудиоформат в float32-массив 16 kHz mono.

    Именно такой вход ждут и Whisper, и wav2vec2 — поэтому конвертер общий.
    Заодно это настоящая валидация файла: не аудио — ffmpeg не декодирует.
    """
    command = [
        "ffmpeg",
        "-nostdin",
        "-hide_banner",
        "-loglevel", "error",
        "-i", path,
        "-f", "s16le",  # сырые 16-битные PCM-семплы в stdout
        "-ac", "1",  # моно
        "-ar", str(SAMPLE_RATE),
        "-",
    ]
    try:
        process = subprocess.run(
            command, capture_output=True, check=True, timeout=_FFMPEG_TIMEOUT
        )
    except FileNotFoundError as e:
        raise AudioDecodeError("ffmpeg не установлен") from e
    except subprocess.CalledProcessError as e:
        raise AudioDecodeError(e.stderr.decode(errors="replace")[:200]) from e
    except subprocess.TimeoutExpired as e:
        raise AudioDecodeError("ffmpeg не уложился в таймаут") from e

    samples = np.frombuffer(process.stdout, dtype=np.int16)
    if samples.size == 0:
        raise AudioDecodeError("в файле нет аудиоданных")

    # int16 (-32768..32767) -> float32 в диапазоне [-1, 1]
    return samples.astype(np.float32) / 32768.0
