from typing import Annotated

from fastapi import APIRouter, Path, Query, Request

from app.api.dependencies import CurrentUserDep, ReservationServiceDep
from app.core.rate_limit import RECEIPT_LIMIT, limiter
from app.models.reservation import Reservation
from app.schemas.errors import ErrorResponse
from app.schemas.pagination import Page
from app.schemas.reservation import (
    MyReservationRead,
    MyReservationsParams,
    ReceiptRead,
    ReservationCreate,
    ReservationRead,
)

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
    "/minhas",
    summary="Minhas reservas: próximas ou histórico",
    response_model=Page[MyReservationRead],
)
def list_my_reservations(
    params: Annotated[MyReservationsParams, Query()],
    user: CurrentUserDep,
    service: ReservationServiceDep,
) -> Page[MyReservationRead]:
    return service.list_mine(user, params.escopo, params.page, params.per_page)


# Antes de `/{reservation_id}`: as rotas são testadas na ordem em que foram declaradas.
@router.get(
    "/comprovante/{codigo}",
    summary="Verificação pública de um comprovante (sem login)",
    response_model=ReceiptRead,
    responses={
        404: {"model": ErrorResponse, "description": "Código inexistente"},
        429: {"model": ErrorResponse, "description": "Muitas consultas seguidas"},
    },
)
@limiter.limit(RECEIPT_LIMIT)
def get_receipt(
    request: Request,  # noqa: ARG001
    codigo: Annotated[str, Path(max_length=20)],
    service: ReservationServiceDep,
) -> ReceiptRead:
    return service.receipt(codigo)


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


@router.post(
    "/{reservation_id}/cancelar",
    summary="Cancela uma reserva (até 30 minutos antes do início)",
    response_model=MyReservationRead,
    responses={
        403: {"model": ErrorResponse, "description": "A reserva é de outra pessoa"},
        404: {"model": ErrorResponse, "description": "Reserva inexistente"},
        409: {"model": ErrorResponse, "description": "Reserva já cancelada"},
        422: {"model": ErrorResponse, "description": "Fora do prazo de cancelamento"},
    },
)
def cancel_reservation(
    reservation_id: int, user: CurrentUserDep, service: ReservationServiceDep
) -> MyReservationRead:
    return service.with_permissions(service.cancel(reservation_id, user))
