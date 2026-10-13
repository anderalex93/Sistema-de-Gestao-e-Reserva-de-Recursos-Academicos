"""create catalogo (bloco, caracteristica, recurso, recurso_caracteristica)

Revision ID: e54ac8b3a940
Revises: 208b532c13d2
Create Date: 2026-10-13 14:40:25.077649

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e54ac8b3a940"
down_revision: str | Sequence[str] | None = "208b532c13d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamps() -> list[sa.Column[object]]:
    return [
        sa.Column(
            "criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "bloco",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("nome", sa.String(length=60), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("ativo", sa.Boolean(), server_default="true", nullable=False),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_bloco")),
        sa.UniqueConstraint("nome", name=op.f("uq_bloco_nome")),
    )
    op.create_table(
        "caracteristica",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("nome", sa.String(length=60), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_caracteristica")),
        sa.UniqueConstraint("nome", name=op.f("uq_caracteristica_nome")),
    )
    op.create_table(
        "recurso",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("bloco_id", sa.BigInteger(), nullable=False),
        sa.Column("nome", sa.String(length=80), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("capacidade", sa.SmallInteger(), nullable=True),
        sa.Column("andar", sa.String(length=20), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("ativo", sa.Boolean(), server_default="true", nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "tipo IN ('SALA_ESTUDO', 'LABORATORIO', 'AUDITORIO', 'EQUIPAMENTO')",
            name=op.f("ck_recurso_tipo"),
        ),
        sa.CheckConstraint("capacidade > 0", name=op.f("ck_recurso_capacidade_positiva")),
        sa.CheckConstraint(
            "tipo = 'EQUIPAMENTO' OR capacidade IS NOT NULL",
            name=op.f("ck_recurso_capacidade_obrigatoria"),
        ),
        sa.ForeignKeyConstraint(
            ["bloco_id"], ["bloco.id"], name=op.f("fk_recurso_bloco_id_bloco"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recurso")),
        sa.UniqueConstraint("bloco_id", "nome", name=op.f("uq_recurso_bloco_id_nome")),
    )
    op.create_index(op.f("ix_recurso_bloco_id"), "recurso", ["bloco_id"])
    op.create_index(op.f("ix_recurso_tipo"), "recurso", ["tipo"])
    op.create_table(
        "recurso_caracteristica",
        sa.Column("recurso_id", sa.BigInteger(), nullable=False),
        sa.Column("caracteristica_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["caracteristica_id"],
            ["caracteristica.id"],
            name=op.f("fk_recurso_caracteristica_caracteristica_id_caracteristica"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["recurso_id"],
            ["recurso.id"],
            name=op.f("fk_recurso_caracteristica_recurso_id_recurso"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "recurso_id", "caracteristica_id", name=op.f("pk_recurso_caracteristica")
        ),
    )
    op.create_index(
        op.f("ix_recurso_caracteristica_caracteristica_id"),
        "recurso_caracteristica",
        ["caracteristica_id"],
    )


def downgrade() -> None:
    op.drop_table("recurso_caracteristica")
    op.drop_table("recurso")
    op.drop_table("caracteristica")
    op.drop_table("bloco")
