"""index reserva recurso inicio

Disponibilidade, quadro e agenda buscam as reservas de um recurso numa janela de horário
(RNF02, #33). O índice GiST da exclusion constraint é parcial (só CONFIRMADA) e indexa o
`tstzrange`, então não atende `inicio < :fim AND fim > :inicio` nem reservas canceladas.

Revision ID: 096bf8b78ba4
Revises: 8e84561afa7a
Create Date: 2026-10-13 18:41:52.743468

"""

from collections.abc import Sequence

from alembic import op

revision: str = "096bf8b78ba4"
down_revision: str | Sequence[str] | None = "8e84561afa7a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("ix_reserva_recurso_id_inicio", "reserva", ["recurso_id", "inicio"])


def downgrade() -> None:
    op.drop_index("ix_reserva_recurso_id_inicio", table_name="reserva")
