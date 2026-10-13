from datetime import datetime

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import UserRole
from app.db.base import Base, IdMixin, TimestampMixin
from app.db.types import str_enum


class User(IdMixin, TimestampMixin, Base):
    """Conta de acesso ao EduSpace.

    LGPD: base legal Art. 7º, V (execução do serviço solicitado pelo titular). Dados mínimos para
    identificar quem reserva: nome e e-mail obrigatórios, matrícula opcional. Transparência,
    aceite e direitos do titular (Art. 18) na issue #34.
    """

    __tablename__ = "usuario"
    __table_args__ = (CheckConstraint("email = lower(email)", name="email_minusculo"),)

    nome: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    perfil: Mapped[UserRole] = mapped_column(
        str_enum(UserRole, name="perfil"), default=UserRole.ALUNO, server_default=UserRole.ALUNO
    )
    matricula: Mapped[str | None] = mapped_column(String(20), unique=True)
    ativo: Mapped[bool] = mapped_column(default=True, server_default="true")
    aceite_termos_em: Mapped[datetime | None]
