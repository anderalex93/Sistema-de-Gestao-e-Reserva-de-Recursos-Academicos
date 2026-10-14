"""add checkin and no show

Check-in por QR Code e liberação por não comparecimento (#43):

- `recurso.checkin_token`: vai no QR Code afixado no espaço. Os recursos existentes recebem um
  valor aleatório antes do NOT NULL; os novos recebem `secrets.token_urlsafe(16)` pelo model.
- `reserva.checkin_em` e `reserva.liberada_em`, e o status `NAO_COMPARECEU`. O CHECK do status
  (VARCHAR + CHECK, `app/db/types.py`) é recriado com o valor novo. A exclusion constraint
  continua só para `CONFIRMADA`: a reserva liberada deixa de ocupar o horário.
- Índice parcial para a liberação achar as confirmadas sem check-in pelo início.
- Reservas confirmadas que já começaram antes do check-in existir contam como presença
  (`checkin_em = inicio`), para não virarem não comparecimento todas de uma vez.

Revision ID: 165d3a7e5685
Revises: 096bf8b78ba4
Create Date: 2026-10-13 22:22:27.607353

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "165d3a7e5685"
down_revision: str | Sequence[str] | None = "096bf8b78ba4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PENDING_CHECKIN = "status = 'CONFIRMADA' AND checkin_em IS NULL"


def upgrade() -> None:
    op.add_column("recurso", sa.Column("checkin_token", sa.String(length=32), nullable=True))
    op.execute("UPDATE recurso SET checkin_token = md5(random()::text || id::text)")
    op.alter_column("recurso", "checkin_token", nullable=False)
    op.create_unique_constraint(op.f("uq_recurso_checkin_token"), "recurso", ["checkin_token"])

    op.add_column("reserva", sa.Column("checkin_em", sa.DateTime(timezone=True), nullable=True))
    op.add_column("reserva", sa.Column("liberada_em", sa.DateTime(timezone=True), nullable=True))

    op.drop_constraint(op.f("ck_reserva_status"), "reserva", type_="check")
    op.create_check_constraint(
        op.f("ck_reserva_status"),
        "reserva",
        "status IN ('CONFIRMADA', 'CANCELADA', 'NAO_COMPARECEU')",
    )
    op.create_check_constraint(
        op.f("ck_reserva_liberacao_coerente"),
        "reserva",
        "(status = 'NAO_COMPARECEU') = (liberada_em IS NOT NULL)",
    )
    op.create_index(
        "ix_reserva_inicio_sem_checkin",
        "reserva",
        ["inicio"],
        postgresql_where=sa.text(PENDING_CHECKIN),
    )

    op.execute(
        "UPDATE reserva SET checkin_em = inicio WHERE status = 'CONFIRMADA' AND inicio <= now()"
    )


def downgrade() -> None:
    # Sem o status novo, a reserva liberada vira cancelada: também não ocupa o horário.
    op.drop_constraint(op.f("ck_reserva_liberacao_coerente"), "reserva", type_="check")
    op.execute(
        "UPDATE reserva SET status = 'CANCELADA', cancelada_em = liberada_em, "
        "motivo_cancelamento = 'Liberada por não comparecimento.' "
        "WHERE status = 'NAO_COMPARECEU'"
    )
    op.drop_constraint(op.f("ck_reserva_status"), "reserva", type_="check")
    op.create_check_constraint(
        op.f("ck_reserva_status"), "reserva", "status IN ('CONFIRMADA', 'CANCELADA')"
    )
    op.drop_index("ix_reserva_inicio_sem_checkin", table_name="reserva")
    op.drop_column("reserva", "liberada_em")
    op.drop_column("reserva", "checkin_em")

    op.drop_constraint(op.f("uq_recurso_checkin_token"), "recurso", type_="unique")
    op.drop_column("recurso", "checkin_token")
