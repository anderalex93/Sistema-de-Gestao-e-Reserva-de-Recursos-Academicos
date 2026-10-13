from datetime import date, datetime
from typing import Annotated, Self

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

from app.core.enums import ReservationScope, ReservationStatus, ResourceType
from app.schemas.catalog import ResourceRead
from app.schemas.pagination import PageParams

Purpose = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class ReservationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recurso_id: int = Field(ge=1)
    inicio: AwareDatetime
    fim: AwareDatetime
    finalidade: Purpose | None = None
    qtd_participantes: int | None = Field(default=None, ge=1, le=1000)

    @model_validator(mode="after")
    def _check_interval(self) -> Self:
        if self.fim <= self.inicio:
            msg = "O fim precisa ser depois do início."
            raise ValueError(msg)
        return self


class ReservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    status: ReservationStatus
    inicio: datetime
    fim: datetime
    finalidade: str | None
    qtd_participantes: int | None
    recurso: ResourceRead
    usuario_id: int
    criado_em: datetime
    cancelada_em: datetime | None
    motivo_cancelamento: str | None = Field(
        description="Preenchido quando a administração cancela a reserva"
    )


class MyReservationRead(ReservationRead):
    pode_cancelar: bool = Field(
        description="Confirmada e com pelo menos 30 minutos até o início (RF04)"
    )


class MyReservationsParams(PageParams):
    escopo: ReservationScope = ReservationScope.PROXIMAS


class ReceiptBuildingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str


class ReceiptResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str
    tipo: ResourceType
    andar: str | None
    bloco: ReceiptBuildingRead


class ReceiptRead(BaseModel):
    """Comprovante público: só o necessário para conferir na entrada (LGPD, minimização)."""

    codigo: str
    status: ReservationStatus
    inicio: datetime
    fim: datetime
    recurso: ReceiptResourceRead
    responsavel: str = Field(description="Só o primeiro nome de quem reservou")
    cancelada_em: datetime | None


Reason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=300)]


class AdminCancellation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    motivo: Reason = Field(description="Aparece para o dono da reserva no histórico")


class ReservationHolderRead(BaseModel):
    """Quem reservou, para a administração poder avisar a pessoa."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str


class AdminReservationRead(ReservationRead):
    usuario: ReservationHolderRead


class AdminAgendaParams(PageParams):
    data: date | None = Field(default=None, description="Dia no fuso do campus; padrão: hoje")
    bloco_id: int | None = Field(default=None, ge=1)
    recurso_id: int | None = Field(default=None, ge=1)
    status: ReservationStatus | None = None
