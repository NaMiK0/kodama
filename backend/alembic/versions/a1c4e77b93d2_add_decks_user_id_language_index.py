"""add composite index on decks(user_id, language)

Revision ID: a1c4e77b93d2
Revises: d6c55af8bef8
Create Date: 2026-07-28 12:34:11.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1c4e77b93d2'
down_revision: Union[str, Sequence[str], None] = 'd6c55af8bef8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        'ix_decks_user_id_language', 'decks', ['user_id', 'language'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_decks_user_id_language', table_name='decks')
