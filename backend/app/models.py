"""Единая точка регистрации всех ORM-моделей в реестре SQLAlchemy."""

from app.modules.auth.models import User
from app.modules.cards.models import Card
from app.modules.decks.models import Deck

__all__ = ["User", "Deck", "Card"]