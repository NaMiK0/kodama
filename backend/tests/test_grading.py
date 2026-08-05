import pytest

from app.modules.study.grading import (
    CORRECT_APPROX,
    CORRECT_EXACT,
    INCORRECT,
    SHAKY_PRONUNCIATION,
    composite_quality,
)


def test_exact_answer_without_extras():
    assert composite_quality("exact") == CORRECT_EXACT


@pytest.mark.parametrize("kind", ["fuzzy", "llm"])
def test_approximate_answer_kinds_get_lower_base(kind):
    assert composite_quality(kind) == CORRECT_APPROX


def test_incorrect_short_circuits_regardless_of_other_signals():
    # Неверный перевод — низшая оценка, даже если произношение идеальное
    # и слово прошло через безупречное заучивание. Смысловая ошибка
    # перекрывает всё остальное.
    assert composite_quality("incorrect", pronunciation_score=1.0, learning_mistakes=0) == INCORRECT


class TestLearningMistakes:
    def test_no_mistakes_keeps_full_score(self):
        assert composite_quality("exact", learning_mistakes=0) == CORRECT_EXACT

    def test_any_mistake_drops_score_by_one(self):
        assert composite_quality("exact", learning_mistakes=1) == CORRECT_EXACT - 1

    def test_mistake_count_does_not_compound(self):
        # Штраф бинарный (был ли хоть один промах), а не пропорциональный
        # их числу — 5 промахов наказывают ровно так же, как один.
        assert composite_quality("exact", learning_mistakes=5) == CORRECT_EXACT - 1

    def test_mistake_floors_at_shaky_not_below(self):
        # CORRECT_APPROX - 1 уже равен SHAKY_PRONUNCIATION в текущих константах —
        # проверяем, что штраф не пробивает пол дальше вниз.
        assert composite_quality("fuzzy", learning_mistakes=1) == SHAKY_PRONUNCIATION


class TestPronunciation:
    def test_good_pronunciation_keeps_base(self):
        assert composite_quality("exact", pronunciation_score=0.8) == CORRECT_EXACT

    def test_pronunciation_none_skips_pronunciation_logic_entirely(self):
        assert composite_quality("exact", pronunciation_score=None) == CORRECT_EXACT

    def test_poor_pronunciation_boundary_included(self):
        assert composite_quality("exact", pronunciation_score=0.5) == CORRECT_EXACT - 1

    def test_just_below_good_threshold_is_poor_bucket(self):
        assert composite_quality("exact", pronunciation_score=0.79) == CORRECT_EXACT - 1

    def test_below_poor_threshold_floors_to_shaky(self):
        assert composite_quality("exact", pronunciation_score=0.49) == SHAKY_PRONUNCIATION

    def test_zero_pronunciation_floors_to_shaky(self):
        assert composite_quality("exact", pronunciation_score=0.0) == SHAKY_PRONUNCIATION


def test_learning_mistakes_and_pronunciation_combine_in_order():
    # Промах в заучивании понижает БАЗУ до пронунсиэйшн-проверки — хорошее
    # произношение уже не восстанавливает полную оценку.
    assert (
        composite_quality("exact", pronunciation_score=0.9, learning_mistakes=1)
        == CORRECT_EXACT - 1
    )
    # А плохое произношение поверх уже сниженной базы бьёт по ней ещё раз.
    assert (
        composite_quality("exact", pronunciation_score=0.6, learning_mistakes=1)
        == SHAKY_PRONUNCIATION
    )
