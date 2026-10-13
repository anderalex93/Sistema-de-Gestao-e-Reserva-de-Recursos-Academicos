from datetime import datetime
from typing import Annotated, Self

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

from app.core.enums import ReservationStatus
from app.schemas.catalog import ResourceRead

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
