import pytest

from app.modules.study.sm2 import INITIAL_EASE_FACTOR, MIN_EASE_FACTOR, sm2


def test_first_correct_review_sets_interval_to_one_day():
    result = sm2(INITIAL_EASE_FACTOR, interval=0, repetitions=0, quality=5)
    assert result.interval == 1
    assert result.repetitions == 1


def test_second_correct_review_sets_interval_to_six_days():
    result = sm2(INITIAL_EASE_FACTOR, interval=1, repetitions=1, quality=5)
    assert result.interval == 6
    assert result.repetitions == 2


def test_third_review_grows_interval_by_ease_factor():
    result = sm2(ease_factor=2.5, interval=6, repetitions=2, quality=5)
    assert result.interval == round(6 * 2.5)
    assert result.repetitions == 3


@pytest.mark.parametrize("quality", [0, 1, 2])
def test_quality_below_three_resets_repetitions_and_interval(quality):
    # Карточка с солидной историей, но провалившая текущий ответ — сброс,
    # а не постепенное уменьшение (это и есть смысл порога quality < 3).
    result = sm2(ease_factor=2.5, interval=30, repetitions=5, quality=quality)
    assert result.repetitions == 0
    assert result.interval == 1


def test_quality_three_still_counts_as_correct():
    # quality=3 — граница: SM-2 всё ещё продвигает repetitions, хотя
    # ease_factor при этом уже снижается (см. test_ease_factor_formula).
    result = sm2(ease_factor=2.5, interval=6, repetitions=1, quality=3)
    assert result.repetitions == 2
    assert result.interval == 6


@pytest.mark.parametrize(
    "quality, expected_delta",
    [
        (5, 0.10),
        (4, 0.00),
        (3, -0.14),
        (2, -0.32),
        (1, -0.54),
        (0, -0.80),
    ],
)
def test_ease_factor_formula_matches_sm2_spec(quality, expected_delta):
    result = sm2(ease_factor=2.5, interval=1, repetitions=1, quality=quality)
    assert result.ease_factor == pytest.approx(2.5 + expected_delta, abs=1e-9)


def test_ease_factor_never_drops_below_floor():
    ease_factor = INITIAL_EASE_FACTOR
    # Много подряд провальных ответов — ease_factor обязан упереться в пол,
    # а не уйти в отрицательные величины.
    for _ in range(10):
        result = sm2(ease_factor, interval=1, repetitions=0, quality=0)
        ease_factor = result.ease_factor
    assert ease_factor == MIN_EASE_FACTOR


@pytest.mark.parametrize("quality", [-1, 6])
def test_quality_outside_range_raises(quality):
    with pytest.raises(ValueError):
        sm2(INITIAL_EASE_FACTOR, interval=0, repetitions=0, quality=quality)
