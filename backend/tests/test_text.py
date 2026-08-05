from app.core.text import fold_kana, normalize


class TestNormalize:
    def test_lowercases(self):
        assert normalize("Cat") == "cat"

    def test_strips_surrounding_whitespace(self):
        assert normalize("  cat  ") == "cat"

    def test_collapses_internal_whitespace(self):
        assert normalize("big   cat") == "big cat"

    def test_strips_punctuation(self):
        assert normalize("don't!") == "dont"

    def test_empty_string_stays_empty(self):
        assert normalize("") == ""

    def test_does_not_strip_accented_letters(self):
        # Только пунктуация и регистр — диакритика (café) не эталонный ответ
        # для снятия, иначе разные слова могли бы схлопнуться в одно.
        assert normalize("Café") == "café"

    def test_full_width_characters_are_normalized_via_nfkc(self):
        # Полноширинные ASCII-цифры/буквы (частый ввод при японской раскладке)
        # должны сводиться к обычным через NFKC.
        assert normalize("ＡＢＣ") == "abc"


class TestFoldKana:
    def test_katakana_folds_to_hiragana(self):
        assert fold_kana("ネコ") == "ねこ"

    def test_prolonged_sound_mark_is_left_untouched(self):
        # ー (U+30FC) — вне диапазона сворачивания: это не отдельная мора,
        # а знак долготы, общий для обеих азбук.
        assert fold_kana("コーヒー") == "こーひー"

    def test_already_hiragana_is_unchanged(self):
        assert fold_kana("ねこ") == "ねこ"

    def test_non_kana_text_is_unchanged(self):
        assert fold_kana("cat") == "cat"

    def test_empty_string_stays_empty(self):
        assert fold_kana("") == ""

    def test_mixed_script_only_folds_katakana_portion(self):
        assert fold_kana("catネコcat") == "catねこcat"
