from collections.abc import Sequence
from datetime import date, datetime

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import SlotStatus, UserRole
from app.models.reservation import Reservation
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.availability import AvailabilityRead, SlotRead


class AvailabilityService:
    """Grade de 30 minutos de um recurso num dia do campus."""

    def __init__(
        self,
        resources: ResourceRepository,
        reservations: ReservationRepository,
        schedule: CampusSchedule,
        clock: Clock,
    ) -> None:
        self._resources = resources
        self._reservations = reservations
        self._schedule = schedule
        self._clock = clock

    def for_day(self, resource_id: int, day: date, viewer: User) -> AvailabilityRead:
        resource = self._resources.get_active_or_raise(resource_id)
        slots = self._schedule.slots(day)
        reservations: Sequence[Reservation] = (
            self._reservations.confirmed_overlapping(resource.id, slots[0][0], slots[-1][1])
            if slots
            else ()
        )
        now = self._clock.now()
        return AvailabilityRead(
            recurso_id=resource.id,
            data=day,
            slots=[self._slot(inicio, fim, now, reservations, viewer) for inicio, fim in slots],
        )

    @staticmethod
    def _slot(
        inicio: datetime,
        fim: datetime,
        now: datetime,
        reservations: Sequence[Reservation],
        viewer: User,
    ) -> SlotRead:
        holder = next((r for r in reservations if r.inicio < fim and r.fim > inicio), None)
        if inicio < now:
            status = SlotStatus.PASSADO
        elif holder is not None:
            status = SlotStatus.OCUPADO
        else:
            status = SlotStatus.LIVRE
        # LGPD: quem reservou só é identificado para o administrador.
        show_name = holder is not None and viewer.perfil is UserRole.ADMIN
        return SlotRead(
            inicio=inicio,
            fim=fim,
            status=status,
            propria=holder is not None and holder.usuario_id == viewer.id,
            reservado_por=holder.usuario.nome if show_name and holder else None,
        )
