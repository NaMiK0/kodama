from dataclasses import dataclass

INITIAL_EASE_FACTOR = 2.5
MIN_EASE_FACTOR = 1.3

# Разбор колоды (свайп "Знаю"): самооценка без проверки ответом. Отправляем
# карточку на ту же ступень лестницы, где стоит однажды подтверждённое слово
# (repetitions=1) — следующий честный ответ продолжит обычным sm2(interval=6),
# без специальных случаев. Отдельная константа, а не sm2(quality=5) с нуля:
# тот дал бы interval=1 и вернул слово уже завтра, не сняв нагрузку с бюджета.
SELF_ASSESSED_KNOWN_INTERVAL = 4

# Порог "зрелой" карточки для статистики (как в Anki): интервал от 21 дня
# означает, что слово повторяется реже раза в три недели — риск забыть
# заметно ниже, чем у "молодых" карточек с частыми повторениями.
MATURE_INTERVAL_DAYS = 21

@dataclass(frozen=True)
class Sm2Result:
    ease_factor: float
    interval: int
    repetitions: int

def sm2(ease_factor: float, interval: int, repetitions: int, quality: int) -> Sm2Result:
    if not 0 <= quality <= 5:
        raise ValueError("quality должен быть в диапазоне 0..5")

    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ease_factor < MIN_EASE_FACTOR:
        ease_factor = MIN_EASE_FACTOR

    return Sm2Result(ease_factor=ease_factor, interval=interval, repetitions=repetitions)