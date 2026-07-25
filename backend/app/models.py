"""Единая точка регистрации всех ORM-моделей в реестре SQLAlchemy."""

from app.modules.auth.models import User
from app.modules.cards.models import Card
from app.modules.decks.models import Deck
from app.modules.study.models import UserCardProgress
from app.modules.ai.models import GenerationJob

__all__ = ["User", "Deck", "Card", "UserCardProgress", "GenerationJob"]