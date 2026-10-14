from datetime import datetime, time
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.enums import SettingsSource
from app.schemas.rules import DayHoursRead


class DayHoursWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dia_semana: int = Field(ge=1, le=7, description="ISO 8601: 1 = segunda, 7 = domingo")
    abertura: time
    fechamento: time

    @field_validator("abertura", "fechamento")
    @classmethod
    def _on_the_grid(cls, value: time) -> time:
        if value.minute not in {0, 30} or value.second or value.microsecond:
            msg = "Use horários cheios ou de meia hora (08:00, 08:30...)."
            raise ValueError(msg)
        return value

    @model_validator(mode="after")
    def _closes_after_opening(self) -> Self:
        if self.fechamento <= self.abertura:
            msg = "O fechamento precisa ser depois da abertura."
            raise ValueError(msg)
        return self


class CampusSettingsUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "horarios": [
                        {"dia_semana": 1, "abertura": "08:00", "fechamento": "21:00"},
                        {"dia_semana": 2, "abertura": "08:00", "fechamento": "21:00"},
                        {"dia_semana": 3, "abertura": "08:00", "fechamento": "21:00"},
                        {"dia_semana": 4, "abertura": "08:00", "fechamento": "21:00"},
                        {"dia_semana": 5, "abertura": "08:00", "fechamento": "21:00"},
                        {"dia_semana": 6, "abertura": "08:00", "fechamento": "12:00"},
                    ],
                    "duracao_max_minutos": 240,
                    "antecedencia_max_dias": 14,
                    "limite_ativas_aluno": 3,
                    "limite_ativas_professor": 10,
                    "checkin_tolerancia_min": 15,
                    "checkin_antecedencia_min": 15,
                }
            ]
        },
    )

    horarios: list[DayHoursWrite] = Field(
        min_length=1,
        max_length=7,
        description="Um item por dia aberto; dia ausente = campus fechado",
    )
    duracao_max_minutos: int = Field(ge=30, le=900, multiple_of=30)
    antecedencia_max_dias: int = Field(ge=1, le=365)
    limite_ativas_aluno: int = Field(ge=1, le=100)
    limite_ativas_professor: int = Field(ge=1, le=100)
    checkin_tolerancia_min: int = Field(
        ge=0, le=120, description="0 = check-in opcional, sem liberação por não comparecimento"
    )
    checkin_antecedencia_min: int = Field(ge=0, le=120)

    @field_validator("horarios")
    @classmethod
    def _one_range_per_day(cls, days: list[DayHoursWrite]) -> list[DayHoursWrite]:
        weekdays = [day.dia_semana for day in days]
        if len(set(weekdays)) != len(weekdays):
            msg = "Cada dia da semana aparece uma vez só."
            raise ValueError(msg)
        return sorted(days, key=lambda day: day.dia_semana)


class CampusSettingsRead(BaseModel):
    horarios: list[DayHoursRead] = Field(description="Dias ausentes: campus fechado")
    duracao_max_minutos: int
    antecedencia_max_dias: int
    limite_ativas_aluno: int
    limite_ativas_professor: int
    checkin_tolerancia_min: int
    checkin_antecedencia_min: int
    origem: SettingsSource = Field(
        description="`AMBIENTE` enquanto ninguém salvou; `ADMINISTRACAO` depois do primeiro ajuste"
    )
    atualizado_em: datetime | None
    atualizado_por: str | None = Field(description="Nome de quem salvou por último")
