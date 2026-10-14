from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request

from app.api.dependencies import CurrentUserDep, ReservationServiceDep, release_no_shows
from app.core.rate_limit import RECEIPT_LIMIT, limiter
from app.models.reservation import Reservation
from app.schemas.errors import TOO_MANY_ATTEMPTS, UNAUTHORIZED, ErrorResponse
from app.schemas.pagination import Page
from app.schemas.reservation import (
    MyReservationRead,
    MyReservationsParams,
    ReceiptRead,
    ReservationCreate,
    ReservationRead,
)

# Toda rota de reservas enxerga a ocupação já sem as reservas vencidas sem check-in (#43).
router = APIRouter(prefix="/reservas", tags=["Reservas"], dependencies=[Depends(release_no_shows)])


@router.post(
    "",
    status_code=201,
    summary="Reserva um recurso num intervalo livre",
    description=(
        "Regras, com os valores atuais em `GET /api/v1/config/regras`:\n\n"
        "- `inicio` e `fim` com fuso, em blocos de 30 minutos alinhados (horas cheias ou meias "
        "horas), dentro do horário de funcionamento do campus e sem ter começado;\n"
        "- duração máxima por reserva (padrão 4 horas);\n"
        "- antecedência máxima em dias (padrão 14);\n"
        "- limite de reservas ativas (confirmadas e não terminadas) por perfil: padrão 3 para "
        "aluno e 10 para professor; administrador não tem limite;\n"
        "- `qtd_participantes`, se informada, não passa da capacidade do espaço.\n\n"
        "O banco impede duas reservas confirmadas sobrepostas no mesmo recurso: quem chega "
        "depois recebe `409 RESERVA_CONFLITO`. A resposta traz o `codigo` do comprovante."
    ),
    response_model=ReservationRead,
    responses={
        **UNAUTHORIZED,
        404: {"model": ErrorResponse, "description": "Recurso inexistente ou inativo"},
        409: {
            "model": ErrorResponse,
            "description": "Horário já ocupado por outra reserva (`RESERVA_CONFLITO`)",
        },
        422: {
            "model": ErrorResponse,
            "description": (
                "Fora das regras: `INTERVALO_NO_PASSADO`, `HORARIO_FORA_DA_GRADE`, "
                "`FORA_DO_FUNCIONAMENTO`, `CAPACIDADE_EXCEDIDA`, `DURACAO_EXCEDIDA`, "
                "`ANTECEDENCIA_EXCEDIDA` ou `LIMITE_RESERVAS_ATIVAS`. Campos inválidos, como "
                "fim antes do início, voltam no formato de validação do FastAPI"
            ),
        },
    },
)
def create_reservation(
    data: ReservationCreate, user: CurrentUserDep, service: ReservationServiceDep
) -> Reservation:
    return service.create(data, user)


@router.get(
    "/minhas",
    summary="Minhas reservas: próximas ou histórico",
    description=(
        "`escopo=proximas` (padrão): confirmadas que ainda não terminaram, da mais cedo para a "
        "mais tarde. `escopo=historico`: canceladas, liberadas por não comparecimento "
        "(`NAO_COMPARECEU`) ou já terminadas, da mais recente para a mais antiga. Cada item diz "
        "se ainda pode ser cancelado (`pode_cancelar`)."
    ),
    response_model=Page[MyReservationRead],
    responses=UNAUTHORIZED,
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
    description=(
        "Para conferir a reserva na entrada do espaço, pelo código ou QR Code do comprovante. "
        "Mostra recurso, horário e situação, e de quem reservou só o primeiro nome (LGPD, "
        "minimização). Limite de 60 consultas por minuto por IP, contra varredura de códigos."
    ),
    response_model=ReceiptRead,
    responses={
        404: {
            "model": ErrorResponse,
            "description": "Código inexistente (`COMPROVANTE_NAO_ENCONTRADO`)",
        },
        **TOO_MANY_ATTEMPTS,
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
    description=("Para qualquer outra pessoa a reserva responde 404, sem revelar que existe."),
    response_model=ReservationRead,
    responses={
        **UNAUTHORIZED,
        404: {"model": ErrorResponse, "description": "Reserva inexistente ou de outra pessoa"},
    },
)
def get_reservation(
    reservation_id: int, user: CurrentUserDep, service: ReservationServiceDep
) -> Reservation:
    return service.get_for(reservation_id, user)


@router.post(
    "/{reservation_id}/cancelar",
    summary="Cancela uma reserva (até 30 minutos antes do início)",
    description=(
        "Nada é apagado: a reserva fica `CANCELADA` e o horário volta a ficar livre. Quem "
        "reservou cancela até 30 minutos antes do início, pelo relógio do servidor; o "
        "administrador cancela as próprias a qualquer momento. Reserva de outra pessoa a "
        "administração cancela por `POST /api/v1/admin/reservas/{id}/cancelar`, com motivo."
    ),
    response_model=MyReservationRead,
    responses={
        **UNAUTHORIZED,
        403: {
            "model": ErrorResponse,
            "description": "A reserva é de outra pessoa (`ACESSO_NEGADO`)",
        },
        404: {"model": ErrorResponse, "description": "Reserva inexistente"},
        409: {
            "model": ErrorResponse,
            "description": (
                "Reserva já cancelada (`RESERVA_JA_CANCELADA`) ou liberada por não "
                "comparecimento (`RESERVA_LIBERADA`)"
            ),
        },
        422: {
            "model": ErrorResponse,
            "description": "Fora do prazo de cancelamento (`PRAZO_CANCELAMENTO_EXPIRADO`)",
        },
    },
)
def cancel_reservation(
    reservation_id: int, user: CurrentUserDep, service: ReservationServiceDep
) -> MyReservationRead:
    return service.with_permissions(service.cancel(reservation_id, user))
