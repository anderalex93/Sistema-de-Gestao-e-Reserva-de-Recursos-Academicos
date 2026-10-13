from fastapi import APIRouter

from app.api.dependencies import CurrentUserDep, ReservationServiceDep
from app.models.reservation import Reservation
from app.schemas.errors import ErrorResponse
from app.schemas.reservation import ReservationCreate, ReservationRead

router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"],
    responses={401: {"model": ErrorResponse, "description": "Sem sessão válida"}},
)


@router.post(
    "",
    status_code=201,
    summary="Reserva um recurso num intervalo livre",
    response_model=ReservationRead,
    responses={
        404: {"model": ErrorResponse, "description": "Recurso inexistente ou inativo"},
        409: {"model": ErrorResponse, "description": "Horário ocupado (RESERVA_CONFLITO)"},
        422: {"model": ErrorResponse, "description": "Horário ou participantes fora das regras"},
    },
)
def create_reservation(
    data: ReservationCreate, user: CurrentUserDep, service: ReservationServiceDep
) -> Reservation:
    return service.create(data, user)


@router.get(
    "/{reservation_id}",
    summary="Detalhe de uma reserva (dono ou administrador)",
    response_model=ReservationRead,
    responses={
        404: {"model": ErrorResponse, "description": "Reserva inexistente ou de outra pessoa"}
    },
)
def get_reservation(
    reservation_id: int, user: CurrentUserDep, service: ReservationServiceDep
) -> Reservation:
    return service.get_for(reservation_id, user)
