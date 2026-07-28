"""add direction to user_card_progress

Revision ID: b7e2f5a91c04
Revises: a1c4e77b93d2
Create Date: 2026-07-28 16:20:00.000000

Единицей расписания становится пара «карточка + направление опроса».
До этой миграции строка была одна на карточку, из-за чего ответ в одну
сторону затирал расписание другой — и направление приходилось фиксировать
на всю сессию.

Бэкфила нет намеренно: на момент миграции таблица пуста. Если бы данные
были, пришлось бы решать, какой стороне приписать накопленный интервал.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b7e2f5a91c04'
down_revision: Union[str, Sequence[str], None] = 'a1c4e77b93d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DIRECTION_TYPE = sa.Enum(
    'to_target',
    'to_russian',
    name='answerdirection',
    native_enum=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    # server_default нужен только на время добавления колонки в NOT NULL:
    # существующих строк нет, но опираться на это в DDL незачем.
    op.add_column(
        'user_card_progress',
        sa.Column(
            'direction',
            _DIRECTION_TYPE,
            nullable=False,
            server_default='to_russian',
        ),
    )
    op.alter_column('user_card_progress', 'direction', server_default=None)

    op.drop_constraint('uq_user_card', 'user_card_progress', type_='unique')
    op.create_unique_constraint(
        'uq_user_card_direction',
        'user_card_progress',
        ['user_id', 'card_id', 'direction'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Возврат к одной строке на карточку: пары, различавшиеся только
    # направлением, стали бы дублями — оставляем по одной.
    op.execute(
        """
        DELETE FROM user_card_progress a
        USING user_card_progress b
        WHERE a.user_id = b.user_id
          AND a.card_id = b.card_id
          AND a.id > b.id
        """
    )
    op.drop_constraint('uq_user_card_direction', 'user_card_progress', type_='unique')
    op.create_unique_constraint(
        'uq_user_card', 'user_card_progress', ['user_id', 'card_id']
    )
    op.drop_column('user_card_progress', 'direction')
