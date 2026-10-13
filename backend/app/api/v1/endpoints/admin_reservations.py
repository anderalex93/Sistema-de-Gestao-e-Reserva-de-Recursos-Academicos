from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import AdminDep, ReservationServiceDep, require_admin
from app.models.reservation import Reservation
from app.schemas.errors import ErrorResponse
from app.schemas.pagination import Page
from app.schemas.reservation import AdminAgendaParams, AdminCancellation, AdminReservationRead

router = APIRouter(
    prefix="/admin/reservas",
    tags=["Administração"],
    dependencies=[Depends(require_admin)],
    responses={
        401: {"model": ErrorResponse, "description": "Sem sessão válida"},
        403: {"model": ErrorResponse, "description": "Apenas administradores"},
    },
)


@router.get(
    "",
    summary="Agenda do dia: todas as reservas, com quem reservou",
    description=(
        "Reservas que tocam o dia no fuso do campus, de qualquer status, ordenadas por bloco, "
        "recurso e horário. Sem `data`, usa o dia de hoje."
    ),
    response_model=Page[AdminReservationRead],
)
def list_agenda(
    service: ReservationServiceDep, params: Annotated[AdminAgendaParams, Query()]
) -> Page[AdminReservationRead]:
    return Page[AdminReservationRead].model_validate(service.agenda(params))


@router.post(
    "/{reservation_id}/cancelar",
    summary="Cancela qualquer reserva que ainda não terminou, com motivo",
    description="Sem o prazo de 30 minutos. O motivo aparece no histórico de quem reservou.",
    response_model=AdminReservationRead,
    responses={
        404: {"model": ErrorResponse, "description": "Reserva inexistente"},
        409: {"model": ErrorResponse, "description": "Reserva já cancelada"},
        422: {"model": ErrorResponse, "description": "Reserva já terminou ou motivo inválido"},
    },
)
def cancel_reservation(
    reservation_id: int, data: AdminCancellation, admin: AdminDep, service: ReservationServiceDep
) -> Reservation:
    return service.cancel_by_admin(reservation_id, admin, data.motivo)
