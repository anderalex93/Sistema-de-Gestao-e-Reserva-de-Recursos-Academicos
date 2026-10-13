"""create usuario

Revision ID: 208b532c13d2
Revises: 8f75fac99981
Create Date: 2026-10-13 13:55:48.164849

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "208b532c13d2"
down_revision: str | Sequence[str] | None = "8f75fac99981"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "usuario",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("perfil", sa.String(length=20), server_default="ALUNO", nullable=False),
        sa.Column("matricula", sa.String(length=20), nullable=True),
        sa.Column("ativo", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("aceite_termos_em", sa.DateTime(timezone=True), nullable=True),
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
            "perfil IN ('ALUNO', 'PROFESSOR', 'ADMIN')", name=op.f("ck_usuario_perfil")
        ),
        sa.CheckConstraint("email = lower(email)", name=op.f("ck_usuario_email_minusculo")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_usuario")),
        sa.UniqueConstraint("email", name=op.f("uq_usuario_email")),
        sa.UniqueConstraint("matricula", name=op.f("uq_usuario_matricula")),
    )


def downgrade() -> None:
    op.drop_table("usuario")
