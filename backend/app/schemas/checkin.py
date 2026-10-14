"""DTOs do check-in por QR Code (#43)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import CheckinSituation, ResourceType
from app.schemas.catalog import BuildingRead
from app.schemas.reservation import ReservationRead


class CheckinResourceRead(BaseModel):
    """O espaço do QR Code, para a pessoa conferir que está no lugar certo."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipo: ResourceType
    andar: str | None
    bloco: BuildingRead


class CheckinStatusRead(BaseModel):
    recurso: CheckinResourceRead
    situacao: CheckinSituation = Field(
        description=(
            "`DISPONIVEL`: dá para fazer check-in agora. `FEITO`: check-in já feito numa reserva "
            "que não terminou. `CEDO`: há reserva confirmada mais tarde hoje; a janela abre em "
            "`abre_em`. `LIBERADA`: a reserva de agora virou `NAO_COMPARECEU`. `SEM_RESERVA`: "
            "nenhuma reserva de quem leu neste espaço para hoje"
        )
    )
    reserva: ReservationRead | None = Field(
        description="A reserva de quem leu neste espaço hoje a que a situação se refere"
    )
    abre_em: datetime | None = Field(
        description="Quando a janela de check-in abre; só na situação `CEDO`"
    )
