import unicodedata


def normalize(text: str) -> str:
    """Приводит текст к каноничному виду перед сравнением.

    Общая для всего приложения: ею пользуются и проверка письменных ответов,
    и сравнение транскрипции произношения. Одна функция — чтобы обе части
    судили одинаково.
    """
    text = unicodedata.normalize("NFKC", text)
    text = text.strip().lower()
    text = "".join(ch for ch in text if not unicodedata.category(ch).startswith("P"))
    return " ".join(text.split())


_KATAKANA_START = 0x30A1
_KATAKANA_END = 0x30F6
_KANA_OFFSET = 0x60  # блоки катаканы и хираганы идут в Unicode параллельно


def fold_kana(text: str) -> str:
    """Катакана -> хирагана (ネコ -> ねこ).

    ТОЛЬКО для сравнения произношения: в речи способа записи не существует,
    ネコ и ねこ — один и тот же звук, а какой алфавит выберет Whisper, дело случая.

    К письменным ответам НЕ применяется: там выбор алфавита осмыслен
    (заимствования пишутся катаканой, и こーひー вместо コーヒー — ошибка).
    """
    return "".join(
        chr(ord(ch) - _KANA_OFFSET)
        if _KATAKANA_START <= ord(ch) <= _KATAKANA_END
        else ch
        for ch in text
    )
