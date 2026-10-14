from typing import Annotated

from fastapi import APIRouter, Depends, Path

from app.api.dependencies import CheckinServiceDep, CurrentUserDep, get_current_user
from app.models.reservation import Reservation
from app.schemas.checkin import CheckinStatusRead
from app.schemas.errors import UNAUTHORIZED, ErrorResponse, ResponsesDoc
from app.schemas.reservation import ReservationRead

router = APIRouter(
    prefix="/checkin",
    tags=["Check-in"],
    dependencies=[Depends(get_current_user)],
    responses=UNAUTHORIZED,
)

Token = Annotated[str, Path(max_length=64, description="Token do QR Code afixado no espaço")]

INVALID_QR: ResponsesDoc = {
    404: {
        "model": ErrorResponse,
        "description": "Token inexistente ou de recurso desativado (`QR_INVALIDO`)",
    }
}


@router.get(
    "/{token}",
    summary="O que a leitura do QR Code de um espaço encontra para quem leu",
    description=(
        "Não registra nada: mostra o espaço e a situação da reserva de quem leu nele hoje (fuso "
        "do campus). A janela de check-in vai de `checkin_antecedencia_min` antes do início até "
        "`checkin_tolerancia_min` depois (`GET /api/v1/config/regras`). Situações:\n\n"
        "- `DISPONIVEL`: dentro da janela e sem check-in;\n"
        "- `FEITO`: check-in já feito numa reserva que não terminou;\n"
        "- `CEDO`: há reserva confirmada mais tarde hoje; `abre_em` diz quando a janela abre;\n"
        "- `LIBERADA`: a reserva virou `NAO_COMPARECEU` e ainda não terminou;\n"
        "- `SEM_RESERVA`: nenhuma das anteriores (`reserva` nula).\n\n"
        "Antes de responder, libera as reservas vencidas sem check-in."
    ),
    response_model=CheckinStatusRead,
    responses=INVALID_QR,
)
def get_checkin_status(
    token: Token, user: CurrentUserDep, service: CheckinServiceDep
) -> CheckinStatusRead:
    return service.status(token, user)


@router.post(
    "/{token}",
    summary="Faz check-in na reserva de agora neste espaço",
    description=(
        "Registra `checkin_em` na reserva de quem leu o QR Code, se ela está na janela de "
        "check-in. Repetir depois do check-in devolve a mesma reserva, sem mudar nada. Sem "
        "check-in até `checkin_tolerancia_min` depois do início, a reserva vira "
        "`NAO_COMPARECEU` e o horário volta a ficar livre para outras pessoas."
    ),
    response_model=ReservationRead,
    responses={
        404: {
            "model": ErrorResponse,
            "description": (
                "Token inexistente ou de recurso desativado (`QR_INVALIDO`), ou nenhuma reserva "
                "de quem leu neste espaço para agora (`SEM_RESERVA_AGORA`)"
            ),
        },
        409: {
            "model": ErrorResponse,
            "description": (
                "A reserva foi liberada por falta de check-in no prazo (`RESERVA_LIBERADA`)"
            ),
        },
        422: {
            "model": ErrorResponse,
            "description": (
                "A janela de check-in ainda não abriu (`CHECKIN_FORA_DA_JANELA`); a mensagem diz "
                "a hora em que abre"
            ),
        },
    },
)
def check_in(token: Token, user: CurrentUserDep, service: CheckinServiceDep) -> Reservation:
    return service.check_in(token, user)
