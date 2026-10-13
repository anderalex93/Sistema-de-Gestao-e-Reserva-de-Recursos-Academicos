"""enable btree_gist extension

Necessária para a exclusion constraint que impede reservas sobrepostas (RNF03), que combina
igualdade de `recurso_id` (btree) com sobreposição de intervalo (GiST).

Revision ID: 8f75fac99981
Revises:
Create Date: 2026-10-13 11:15:37.544357

"""

from collections.abc import Sequence

from alembic import op

revision: str = "8f75fac99981"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS btree_gist")
