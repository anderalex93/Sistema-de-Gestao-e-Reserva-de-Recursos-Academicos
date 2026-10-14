"""Linhas enxutas do painel de ocupação (#44): só as colunas que a agregação usa."""

from dataclasses import dataclass
from datetime import datetime

from app.core.enums import ReservationStatus, ResourceType


@dataclass(frozen=True, slots=True)
class ResourceRow:
    id: int
    nome: str
    tipo: ResourceType
    bloco: str


@dataclass(frozen=True, slots=True)
class ReservationSpan:
    recurso_id: int
    inicio: datetime
    fim: datetime
    status: ReservationStatus
    checkin_em: datetime | None
    liberada_em: datetime | None
    fim_previsto: datetime | None = None
