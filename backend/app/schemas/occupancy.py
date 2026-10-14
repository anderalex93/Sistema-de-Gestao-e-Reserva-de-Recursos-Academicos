from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ResourceType

HOURS = "Horas com uma casa decimal"
RATE = "De 0 a 1"


class OccupancyParams(BaseModel):
    inicio: date | None = Field(
        default=None,
        description="Primeiro dia (AAAA-MM-DD, fuso do campus); padrão: 29 dias antes do fim",
    )
    fim: date | None = Field(
        default=None, description="Último dia, inclusive (AAAA-MM-DD); padrão: hoje"
    )
    bloco_id: int | None = Field(default=None, ge=1, description="Só os recursos deste bloco")


class OccupancyPeriodRead(BaseModel):
    inicio: date
    fim: date = Field(description="Inclusive")


class OccupancySummaryRead(BaseModel):
    horas_disponiveis: float = Field(
        description="Horas de funcionamento do período somadas por recurso ativo"
    )
    horas_reservadas: float = Field(
        description="Horas de reservas `CONFIRMADA` dentro do período e do funcionamento"
    )
    taxa_ocupacao: float = Field(description=f"Reservadas / disponíveis. {RATE}")
    reservas: int = Field(
        description="`CONFIRMADA` ou `NAO_COMPARECEU` que começam no período (sem canceladas)"
    )
    cancelamentos: int = Field(description="`CANCELADA` que começariam no período")
    taxa_cancelamento: float = Field(
        description=f"Cancelamentos / (reservas + cancelamentos). {RATE}; 0 sem reservas"
    )
    checkins: int = Field(description="Reservas do período que já começaram e tiveram check-in")
    nao_comparecimentos: int = Field(
        description="`NAO_COMPARECEU`: sem check-in a tempo, horário liberado"
    )
    taxa_comparecimento: float | None = Field(
        description=(
            f"Check-ins / (check-ins + não comparecimentos). {RATE}; nulo quando não há nenhum"
        )
    )
    horas_devolvidas: float = Field(
        description="Horas liberadas por não comparecimento (da liberação ao fim da reserva)"
    )


class HeatmapCellRead(BaseModel):
    dia_semana: int = Field(ge=1, le=7, description="ISO 8601: 1 = segunda, 7 = domingo")
    hora: int = Field(ge=0, le=23, description="Início da hora no fuso do campus")
    taxa: float = Field(
        description=(
            "Minutos reservados naquela hora daquele dia da semana / minutos disponíveis "
            f"(recursos x dias x minutos de funcionamento na hora). {RATE}"
        )
    )


class ResourceOccupancyRead(BaseModel):
    id: int
    nome: str
    tipo: ResourceType
    bloco: str = Field(description="Nome do bloco")
    horas_disponiveis: float = Field(description=HOURS)
    horas_reservadas: float = Field(description=HOURS)
    taxa_ocupacao: float = Field(description=RATE)
    reservas: int
    cancelamentos: int
    nao_comparecimentos: int
    horas_devolvidas: float = Field(description=HOURS)


class OccupancyRead(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "periodo": {"inicio": "2026-10-01", "fim": "2026-10-30"},
                    "resumo": {
                        "horas_disponiveis": 3380.0,
                        "horas_reservadas": 1622.5,
                        "taxa_ocupacao": 0.48,
                        "reservas": 812,
                        "cancelamentos": 64,
                        "taxa_cancelamento": 0.073,
                        "checkins": 690,
                        "nao_comparecimentos": 41,
                        "taxa_comparecimento": 0.944,
                        "horas_devolvidas": 52.5,
                    },
                    "mapa_calor": [{"dia_semana": 1, "hora": 8, "taxa": 0.35}],
                    "recursos": [
                        {
                            "id": 3,
                            "nome": "Laboratório de Informática 1",
                            "tipo": "LABORATORIO",
                            "bloco": "Bloco B",
                            "horas_disponiveis": 338.0,
                            "horas_reservadas": 250.0,
                            "taxa_ocupacao": 0.74,
                            "reservas": 96,
                            "cancelamentos": 5,
                            "nao_comparecimentos": 3,
                            "horas_devolvidas": 4.5,
                        }
                    ],
                }
            ]
        }
    )

    periodo: OccupancyPeriodRead
    resumo: OccupancySummaryRead
    mapa_calor: list[HeatmapCellRead] = Field(
        description="Só horas em que o campus abre naquele dia da semana, por dia e hora"
    )
    recursos: list[ResourceOccupancyRead] = Field(
        description="Recursos ativos do filtro, da maior para a menor ocupação, depois por nome"
    )
