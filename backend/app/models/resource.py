from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    ForeignKey,
    SmallInteger,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ResourceType
from app.db.base import Base, IdMixin, TimestampMixin
from app.db.types import str_enum
from app.models.building import Building
from app.models.feature import Feature

resource_feature = Table(
    "recurso_caracteristica",
    Base.metadata,
    Column(
        "recurso_id", BigInteger, ForeignKey("recurso.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "caracteristica_id",
        BigInteger,
        ForeignKey("caracteristica.id", ondelete="RESTRICT"),
        primary_key=True,
        index=True,
    ),
)


class Resource(IdMixin, TimestampMixin, Base):
    """Tudo o que pode ser reservado: sala de estudo, laboratório, auditório ou equipamento."""

    __tablename__ = "recurso"
    __table_args__ = (
        UniqueConstraint("bloco_id", "nome"),
        CheckConstraint("capacidade > 0", name="capacidade_positiva"),
        CheckConstraint(
            "tipo = 'EQUIPAMENTO' OR capacidade IS NOT NULL", name="capacidade_obrigatoria"
        ),
    )

    bloco_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("bloco.id", ondelete="RESTRICT"), index=True
    )
    nome: Mapped[str] = mapped_column(String(80))
    tipo: Mapped[ResourceType] = mapped_column(str_enum(ResourceType, name="tipo"), index=True)
    capacidade: Mapped[int | None] = mapped_column(SmallInteger)
    andar: Mapped[str | None] = mapped_column(String(20))
    descricao: Mapped[str | None] = mapped_column(Text)
    ativo: Mapped[bool] = mapped_column(default=True, server_default="true")

    # Sempre exibidos junto com o recurso: carregados na mesma consulta (bloco) ou logo em seguida.
    bloco: Mapped[Building] = relationship(lazy="joined", innerjoin=True)
    caracteristicas: Mapped[list[Feature]] = relationship(
        secondary=resource_feature, order_by=Feature.nome, lazy="selectin"
    )
