"""add configuracao

Horário de funcionamento e regras de uso ajustáveis pela administração, numa linha única
(`id = 1`). A tabela nasce vazia: até a primeira gravação pela tela de Configurações, valem os
valores do ambiente (`HORARIO_FUNCIONAMENTO`, `RESERVA_*`, `CHECKIN_*`).

Revision ID: e4909110340c
Revises: 70386e606ab4
Create Date: 2026-10-14 01:07:44.095299

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e4909110340c"
down_revision: str | Sequence[str] | None = "70386e606ab4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "configuracao",
        sa.Column("id", sa.SmallInteger(), nullable=False),
        sa.Column("horario_funcionamento", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("duracao_max_minutos", sa.SmallInteger(), nullable=False),
        sa.Column("antecedencia_max_dias", sa.SmallInteger(), nullable=False),
        sa.Column("limite_ativas_aluno", sa.SmallInteger(), nullable=False),
        sa.Column("limite_ativas_professor", sa.SmallInteger(), nullable=False),
        sa.Column("checkin_tolerancia_min", sa.SmallInteger(), nullable=False),
        sa.Column("checkin_antecedencia_min", sa.SmallInteger(), nullable=False),
        sa.Column("atualizado_por_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("id = 1", name=op.f("ck_configuracao_linha_unica")),
        sa.ForeignKeyConstraint(
            ["atualizado_por_id"],
            ["usuario.id"],
            name=op.f("fk_configuracao_atualizado_por_id_usuario"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_configuracao")),
    )


def downgrade() -> None:
    op.drop_table("configuracao")
