from dataclasses import dataclass

from app.core.enums import ReservationStatus


@dataclass(frozen=True, slots=True)
class AgendaFilters:
    """Filtros da agenda da administração. Todos opcionais e combinados com E."""

    bloco_id: int | None = None
    recurso_id: int | None = None
    status: ReservationStatus | None = None
