from dataclasses import dataclass

INITIAL_EASE_FACTOR = 2.5
MIN_EASE_FACTOR = 1.3

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