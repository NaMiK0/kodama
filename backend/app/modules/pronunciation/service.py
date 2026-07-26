from pathlib import Path
from typing import BinaryIO
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.notifications import publish_notification
from app.modules.cards.models import Card
from app.modules.decks.models import Deck
from app.modules.pronunciation.checker import get_checker
from app.modules.pronunciation.enums import AttemptStatus
from app.modules.pronunciation.models import PronunciationAttempt
from app.modules.pronunciation.queue import publish_attempt

MAX_AUDIO_BYTES = 5 * 1024 * 1024  # 5 МБ — на слово хватает с большим запасом
_CHUNK = 64 * 1024

# Расширение выбираем САМИ по content-type; имя от клиента не используем никогда.
_EXTENSION_BY_TYPE = {
    "audio/webm": ".webm",
    "video/webm": ".webm",  # MediaRecorder иногда помечает запись так
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
}


class CardNotFoundError(Exception):
    """Карточка не найдена или принадлежит другому пользователю."""


class AttemptNotFoundError(Exception):
    """Попытка не найдена или принадлежит другому пользователю."""


class UnsupportedAudioError(Exception):
    """Неподдерживаемый формат аудио."""


class AudioTooLargeError(Exception):
    """Файл больше допустимого размера."""


class EmptyAudioError(Exception):
    """Пустой файл."""


def _get_owned_card(db: Session, user_id: int, card_id: int) -> Card:
    card = db.scalar(
        select(Card).join(Deck).where(Card.id == card_id, Deck.user_id == user_id)
    )
    if card is None:
        raise CardNotFoundError(card_id)
    return card


def _save_audio(stream: BinaryIO, content_type: str | None) -> Path:
    base_type = (content_type or "").split(";")[0].strip().lower()
    suffix = _EXTENSION_BY_TYPE.get(base_type)
    if suffix is None:
        raise UnsupportedAudioError(base_type)

    upload_dir = Path(settings.upload_dir).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)
    path = upload_dir / f"{uuid4().hex}{suffix}"  # своё имя, без данных от клиента

    size = 0
    try:
        with path.open("wb") as out:
            while chunk := stream.read(_CHUNK):
                size += len(chunk)
                if size > MAX_AUDIO_BYTES:
                    raise AudioTooLargeError(size)
                out.write(chunk)
        if size == 0:
            raise EmptyAudioError
    except Exception:
        path.unlink(missing_ok=True)  # не оставляем мусор после неудачи
        raise

    return path


def create_attempt(
    db: Session,
    user_id: int,
    card_id: int,
    stream: BinaryIO,
    content_type: str | None,
) -> PronunciationAttempt:
    _get_owned_card(db, user_id, card_id)  # проверка владения ДО записи файла
    path = _save_audio(stream, content_type)

    attempt = PronunciationAttempt(
        user_id=user_id,
        card_id=card_id,
        status=AttemptStatus.PENDING,
        audio_path=str(path),
    )
    db.add(attempt)
    db.commit()  # сначала фиксируем попытку...
    db.refresh(attempt)
    publish_attempt(attempt.id)  # ...и только потом публикуем
    return attempt


def _discard_audio(path_str: str | None) -> None:
    """Записи голоса не храним: файл удаляется сразу после обработки."""
    if path_str:
        Path(path_str).unlink(missing_ok=True)


def process_attempt(db: Session, attempt_id: int) -> None:
    """Выполняется в воркере: проверяет произношение и сохраняет результат."""
    attempt = db.get(PronunciationAttempt, attempt_id)
    if attempt is None:
        return  # попытка исчезла (например, удалили пользователя)

    user_id = attempt.user_id
    audio_path = attempt.audio_path
    attempt.status = AttemptStatus.PROCESSING
    db.commit()

    try:
        card = db.get(Card, attempt.card_id)
        if card is None:
            raise ValueError("Карточка не найдена")
        if not audio_path or not Path(audio_path).exists():
            raise ValueError("Аудиофайл недоступен")

        checker = get_checker(card.deck.language)
        result = checker.check(audio_path, card.reference)

        attempt.status = AttemptStatus.DONE
        attempt.score = result.score
        attempt.transcript = result.transcript
        attempt.detail = result.detail
    except Exception as e:
        db.rollback()
        attempt = db.get(PronunciationAttempt, attempt_id)
        attempt.status = AttemptStatus.FAILED
        attempt.error = str(e)[:1000]
    finally:
        _discard_audio(audio_path)  # удаляем в ЛЮБОМ случае
        attempt.audio_path = None
        db.commit()

    publish_notification(
        {
            "type": "pronunciation",
            "user_id": user_id,
            "attempt_id": attempt_id,
            "status": attempt.status,
            "score": attempt.score,
            "transcript": attempt.transcript,
        }
    )


def get_attempt(db: Session, user_id: int, attempt_id: int) -> PronunciationAttempt:
    attempt = db.scalar(
        select(PronunciationAttempt).where(
            PronunciationAttempt.id == attempt_id,
            PronunciationAttempt.user_id == user_id,
        )
    )
    if attempt is None:
        raise AttemptNotFoundError(attempt_id)
    return attempt
