from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IdMixin


class Feature(IdMixin, Base):
    """Atributo pesquisável de um recurso (projetor, ar-condicionado, computadores...)."""

    __tablename__ = "caracteristica"

    nome: Mapped[str] = mapped_column(String(60), unique=True)
