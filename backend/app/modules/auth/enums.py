from enum import StrEnum


class AvatarId(StrEnum):
    """Фирменные аватары Kodama — лесные мотивы в тему названия (木霊).
    Картинки для них рисует Никита; бэкенд хранит только идентификатор."""

    SPROUT = "sprout"
    LEAF = "leaf"
    PINE = "pine"
    MOON = "moon"
    STONE = "stone"
    SPIRIT = "spirit"
