"""create reserva

Revision ID: 8e84561afa7a
Revises: e54ac8b3a940
Create Date: 2026-10-13 15:05:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "8e84561afa7a"
down_revision: str | Sequence[str] | None = "e54ac8b3a940"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reserva",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("codigo", sa.String(length=10), nullable=False),
        sa.Column("recurso_id", sa.BigInteger(), nullable=False),
        sa.Column("usuario_id", sa.BigInteger(), nullable=False),
        sa.Column("inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fim", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="CONFIRMADA", nullable=False),
        sa.Column("finalidade", sa.String(length=200), nullable=True),
        sa.Column("qtd_participantes", sa.SmallInteger(), nullable=True),
        sa.Column("cancelada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelada_por_id", sa.BigInteger(), nullable=True),
        sa.Column("motivo_cancelamento", sa.String(length=300), nullable=True),
        sa.Column(
            "criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('CONFIRMADA', 'CANCELADA')", name=op.f("ck_reserva_status")
        ),
        sa.CheckConstraint("fim > inicio", name=op.f("ck_reserva_fim_depois_do_inicio")),
        sa.CheckConstraint(
            "(status = 'CANCELADA') = (cancelada_em IS NOT NULL)",
            name=op.f("ck_reserva_cancelamento_coerente"),
        ),
        sa.CheckConstraint(
            "qtd_participantes > 0", name=op.f("ck_reserva_participantes_positivo")
        ),
        # RNF03: nenhum par de reservas confirmadas se sobrepõe no mesmo recurso.
        postgresql.ExcludeConstraint(
            (sa.column("recurso_id"), "="),
            (sa.text("tstzrange(inicio, fim, '[)')"), "&&"),
            where=sa.text("status = 'CONFIRMADA'"),
            using="gist",
            name="reserva_sem_sobreposicao",
        ),
        sa.ForeignKeyConstraint(
            ["recurso_id"],
            ["recurso.id"],
            name=op.f("fk_reserva_recurso_id_recurso"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuario.id"],
            name=op.f("fk_reserva_usuario_id_usuario"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["cancelada_por_id"],
            ["usuario.id"],
            name=op.f("fk_reserva_cancelada_por_id_usuario"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reserva")),
        sa.UniqueConstraint("codigo", name=op.f("uq_reserva_codigo")),
    )
    op.create_index("ix_reserva_usuario_id_inicio", "reserva", ["usuario_id", "inicio"])
    op.create_index("ix_reserva_inicio", "reserva", ["inicio"])


def downgrade() -> None:
    op.drop_table("reserva")
