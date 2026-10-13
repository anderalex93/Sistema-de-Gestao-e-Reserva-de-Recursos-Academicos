"""Base declarativa e mixins compartilhados pelos models."""

from datetime import datetime
from typing import Any, ClassVar

from sqlalchemy import BigInteger, DateTime, Identity, MetaData, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Nomes previsíveis para constraints e índices, exigidos para o Alembic gerar migrações estáveis.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    type_annotation_map: ClassVar[dict[Any, Any]] = {datetime: DateTime(timezone=True)}


class IdMixin:
    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)


class TimestampMixin:
    criado_em: Mapped[datetime] = mapped_column(server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
