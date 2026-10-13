from dataclasses import dataclass, field
from datetime import datetime

from app.core.enums import ResourceType


@dataclass(frozen=True, slots=True)
class TimeRange:
    """Intervalo semiaberto `[inicio, fim)`, o mesmo da exclusion constraint da reserva."""

    inicio: datetime
    fim: datetime


@dataclass(frozen=True, slots=True)
class ResourceFilters:
    bloco_id: int | None = None
    tipo: ResourceType | None = None
    caracteristica_ids: frozenset[int] = field(default_factory=frozenset)
    capacidade_min: int | None = None
    busca: str | None = None
    livre_em: TimeRange | None = None
