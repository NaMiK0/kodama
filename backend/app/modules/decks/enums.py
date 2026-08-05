from enum import StrEnum

class Language(StrEnum):
    EN = "en"
    JA = "ja"

class DeckSource(StrEnum):
    USER_CREATED = "user_created"
    AI_GENERATED = "ai_generated"

class DeckTier(StrEnum):
    """Тир колоды в коллекции — по среднему ease_factor SM-2 её карточек.
    Чем увереннее пользователь отвечает, тем выше ease_factor растит SM-2,
    поэтому он и берётся мерой «насколько хорошо колода выучена»."""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"

class Level(StrEnum):
    # Английский (CEFR)
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"
    # Японский (JLPT)
    N5 = "N5"
    N4 = "N4"
    N3 = "N3"
    N2 = "N2"
    N1 = "N1"

LANGUAGE_LEVELS: dict[Language, set[Level]] = {
    Language.EN: {Level.A1, Level.A2, Level.B1, Level.B2, Level.C1, Level.C2},
    Language.JA: {Level.N5, Level.N4, Level.N3, Level.N2, Level.N1},
}