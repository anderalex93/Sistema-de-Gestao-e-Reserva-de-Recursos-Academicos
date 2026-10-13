from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IdMixin, TimestampMixin


class Building(IdMixin, TimestampMixin, Base):
    """Prédio ou ala do campus."""

    __tablename__ = "bloco"

    nome: Mapped[str] = mapped_column(String(60), unique=True)
    descricao: Mapped[str | None] = mapped_column(Text)
    ativo: Mapped[bool] = mapped_column(default=True, server_default="true")
