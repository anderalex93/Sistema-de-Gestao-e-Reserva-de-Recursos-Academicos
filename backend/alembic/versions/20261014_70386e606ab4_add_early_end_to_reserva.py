"""add early end to reserva

Encerrar o uso mais cedo (#43): quem reservou avisa que saiu e o resto do horário fica livre.

- `reserva.encerrada_em`: quando a pessoa encerrou o uso.
- `reserva.fim_previsto`: o fim original, só quando o encerramento encurtou `fim`. A exclusion
  constraint usa `fim`, então o trecho liberado já fica disponível para outras reservas.
- CHECK de coerência: `fim_previsto` só existe com `encerrada_em` e depois de `fim`.

No downgrade, `fim` continua encurtado: o horário liberado pode já ter sido reservado por outra
pessoa, e devolver o fim original violaria a exclusion constraint.

Revision ID: 70386e606ab4
Revises: 165d3a7e5685
Create Date: 2026-10-14 01:00:28.542127

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "70386e606ab4"
down_revision: str | Sequence[str] | None = "165d3a7e5685"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("reserva", sa.Column("encerrada_em", sa.DateTime(timezone=True), nullable=True))
    op.add_column("reserva", sa.Column("fim_previsto", sa.DateTime(timezone=True), nullable=True))
    op.create_check_constraint(
        op.f("ck_reserva_encerramento_coerente"),
        "reserva",
        "fim_previsto IS NULL OR (encerrada_em IS NOT NULL AND fim_previsto > fim)",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_reserva_encerramento_coerente"), "reserva", type_="check")
    op.drop_column("reserva", "fim_previsto")
    op.drop_column("reserva", "encerrada_em")
