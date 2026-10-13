from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ResourceType
from app.schemas.catalog import BuildingRead


class BoardResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipo: ResourceType
    capacidade: int | None
    bloco: BuildingRead


class OccupationRead(BaseModel):
    inicio: datetime
    fim: datetime
    propria: bool = Field(description="Reservada por quem consulta")
    reservado_por: str | None = Field(description="Só para administradores (LGPD)")


class BoardRowRead(BaseModel):
    recurso: BoardResourceRead
    ocupacoes: list[OccupationRead]


class BoardRead(BaseModel):
    data: date
    abertura: time | None = Field(description="Nulo quando o campus não abre no dia")
    fechamento: time | None
    linhas: list[BoardRowRead]


class BoardParams(BaseModel):
    data: date = Field(description="Dia, AAAA-MM-DD, no fuso do campus")
    bloco_id: int | None = Field(default=None, ge=1)
    tipo: ResourceType | None = None
