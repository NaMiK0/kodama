import pytest

from app.modules.study.answers import FUZZY_MIN_LENGTH, MatchKind, match_answer


class TestExactMatch:
    def test_exact_match(self):
        assert match_answer("cat", ["cat"], allow_fuzzy=True) == MatchKind.EXACT

    def test_case_and_punctuation_are_normalized_before_comparing(self):
        assert match_answer("Cat!", ["cat"], allow_fuzzy=True) == MatchKind.EXACT

    def test_matches_any_of_several_accepted_forms(self):
        assert match_answer("dog", ["cat", "dog"], allow_fuzzy=True) == MatchKind.EXACT

    def test_empty_expected_entries_are_ignored_not_matched(self):
        # accepted_answers может содержать пустые строки — не должны
        # случайно засчитать пустой ответ как совпадение с ними.
        assert match_answer("cat", ["", "cat"], allow_fuzzy=True) == MatchKind.EXACT

    def test_empty_answer_is_unknown_not_a_match_on_empty_candidate(self):
        assert match_answer("", ["", "cat"], allow_fuzzy=True) == MatchKind.UNKNOWN


class TestFuzzyMatch:
    def test_typo_within_threshold_is_fuzzy(self):
        # aeroplan/aeroplane -> ratio 0.941, выше порога 0.90.
        assert match_answer("aeroplan", ["aeroplane"], allow_fuzzy=True) == MatchKind.FUZZY

    def test_different_word_below_threshold_is_not_fuzzy_matched(self):
        # Калиброванный на реальных данных случай: train/rain даёт 0.889 —
        # ниже порога 0.90, иначе разные слова засчитывались бы как опечатка.
        assert match_answer("train", ["rain"], allow_fuzzy=True) == MatchKind.UNKNOWN

    def test_fuzzy_disabled_falls_back_to_unknown_even_for_close_typo(self):
        assert match_answer("aeroplan", ["aeroplane"], allow_fuzzy=False) == MatchKind.UNKNOWN

    def test_answer_shorter_than_min_length_skips_fuzzy_even_if_close(self):
        # "cet"/"cat" — высокое сходство посимвольно, но короче FUZZY_MIN_LENGTH:
        # на коротких словах опечатка неотличима от другого слова.
        assert len("cet") < FUZZY_MIN_LENGTH
        assert match_answer("cet", ["cat"], allow_fuzzy=True) == MatchKind.UNKNOWN

    def test_candidate_shorter_than_min_length_is_skipped_too(self):
        assert match_answer("aeroplane", ["cat"], allow_fuzzy=True) == MatchKind.UNKNOWN


@pytest.mark.parametrize("empty_answer", ["", "   ", "!!!"])
def test_answer_that_normalizes_to_empty_is_unknown(empty_answer):
    assert match_answer(empty_answer, ["cat"], allow_fuzzy=True) == MatchKind.UNKNOWN
