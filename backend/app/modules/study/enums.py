from enum import StrEnum


class AnswerDirection(StrEnum):
    TO_TARGET = "to_target"      # RU -> изучаемый язык
    TO_RUSSIAN = "to_russian"    # изучаемый язык -> RU
