from datetime import time

from pydantic import BaseModel, Field

from app.core.enums import UserRole


class DayHoursRead(BaseModel):
    dia_semana: int = Field(ge=1, le=7, description="ISO 8601: 1 = segunda, 7 = domingo")
    abertura: time
    fechamento: time


class RulesRead(BaseModel):
    """Regras que o front precisa conhecer antes de chamar a API."""

    fuso: str
    intervalo_minutos: int
    horarios: list[DayHoursRead] = Field(description="Dias ausentes: campus fechado")
    duracao_max_minutos: int
    antecedencia_max_dias: int
    limite_reservas_ativas: dict[UserRole, int | None] = Field(
        description="Reservas confirmadas e não terminadas por perfil; nulo = sem limite"
    )
