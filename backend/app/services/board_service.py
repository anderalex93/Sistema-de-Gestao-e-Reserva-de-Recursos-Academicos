from collections import defaultdict
from datetime import date

from app.core.campus_schedule import CampusSchedule
from app.core.enums import UserRole
from app.models.reservation import Reservation
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import ResourceFilters
from app.repositories.resource_repository import ResourceRepository
from app.schemas.board import (
    BoardParams,
    BoardRead,
    BoardResourceRead,
    BoardRowRead,
    OccupationRead,
)


class BoardService:
    """Quadro do dia: o que está ocupado em cada recurso, visível para todo usuário logado."""

    def __init__(
        self,
        resources: ResourceRepository,
        reservations: ReservationRepository,
        schedule: CampusSchedule,
    ) -> None:
        self._resources = resources
        self._reservations = reservations
        self._schedule = schedule

    def for_day(self, params: BoardParams, viewer: User) -> BoardRead:
        hours = self._schedule.hours_on(params.data)
        if hours is None:
            return BoardRead(data=params.data, abertura=None, fechamento=None, linhas=[])
        resources = self._resources.list_matching(
            ResourceFilters(bloco_id=params.bloco_id, tipo=params.tipo)
        )
        by_resource = self._occupations(params.data, [r.id for r in resources], viewer)
        return BoardRead(
            data=params.data,
            abertura=hours.opening,
            fechamento=hours.closing,
            linhas=[
                BoardRowRead(
                    recurso=BoardResourceRead.model_validate(resource),
                    ocupacoes=by_resource.get(resource.id, []),
                )
                for resource in resources
            ],
        )

    def _occupations(
        self, day: date, resource_ids: list[int], viewer: User
    ) -> dict[int, list[OccupationRead]]:
        slots = self._schedule.slots(day)
        start, end = slots[0][0], slots[-1][1]
        grouped: dict[int, list[OccupationRead]] = defaultdict(list)
        for reservation in self._reservations.confirmed_for_resources(resource_ids, start, end):
            grouped[reservation.recurso_id].append(self._occupation(reservation, viewer))
        return grouped

    @staticmethod
    def _occupation(reservation: Reservation, viewer: User) -> OccupationRead:
        # LGPD: quem reservou só é identificado para o administrador.
        is_admin = viewer.perfil is UserRole.ADMIN
        return OccupationRead(
            inicio=reservation.inicio,
            fim=reservation.fim,
            propria=reservation.usuario_id == viewer.id,
            reservado_por=reservation.usuario.nome if is_admin else None,
        )
