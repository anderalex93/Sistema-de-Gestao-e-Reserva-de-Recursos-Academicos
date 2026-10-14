from typing import Any

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.user import User

SETTINGS_ID = 1


class CampusSettings(TimestampMixin, Base):
    """Horário de funcionamento e regras de uso definidos pela administração.

    Linha única (`id = 1`). Enquanto ela não existe, valem os valores do ambiente
    (`HORARIO_FUNCIONAMENTO`, `RESERVA_*`, `CHECKIN_*`). As faixas e os limites são validados no
    DTO de entrada; o banco guarda só o que já passou pela validação.
    """

    __tablename__ = "configuracao"
    __table_args__ = (CheckConstraint(f"id = {SETTINGS_ID}", name="linha_unica"),)

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, default=SETTINGS_ID)
    # [{"dia_semana": 1..7, "abertura": "HH:MM", "fechamento": "HH:MM"}]; dia ausente = fechado.
    horario_funcionamento: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    duracao_max_minutos: Mapped[int] = mapped_column(SmallInteger)
    antecedencia_max_dias: Mapped[int] = mapped_column(SmallInteger)
    limite_ativas_aluno: Mapped[int] = mapped_column(SmallInteger)
    limite_ativas_professor: Mapped[int] = mapped_column(SmallInteger)
    checkin_tolerancia_min: Mapped[int] = mapped_column(SmallInteger)
    checkin_antecedencia_min: Mapped[int] = mapped_column(SmallInteger)
    atualizado_por_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("usuario.id", ondelete="SET NULL")
    )

    atualizado_por: Mapped[User | None] = relationship()
