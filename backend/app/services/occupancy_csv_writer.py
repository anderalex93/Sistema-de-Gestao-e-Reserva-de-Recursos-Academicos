import csv
import io
from dataclasses import dataclass

from app.core.enums import ResourceType
from app.schemas.occupancy import OccupancyRead, ResourceOccupancyRead

HEADER = (
    "Recurso",
    "Bloco",
    "Tipo",
    "Horas disponíveis",
    "Horas reservadas",
    "Ocupação (%)",
    "Reservas",
    "Cancelamentos",
    "Não comparecimentos",
    "Horas devolvidas",
)
TYPE_LABELS = {
    ResourceType.SALA_ESTUDO: "Sala de estudo",
    ResourceType.LABORATORIO: "Laboratório",
    ResourceType.AUDITORIO: "Auditório",
    ResourceType.EQUIPAMENTO: "Equipamento",
}
# Texto que começa assim vira fórmula no Excel (CSV injection): vai com apóstrofo na frente.
FORMULA_STARTS = ("=", "+", "-", "@", "\t", "\r")


@dataclass(frozen=True, slots=True)
class CsvFile:
    filename: str
    content: bytes


class OccupancyCsvWriter:
    """Planilha do painel de ocupação (#44), uma linha por recurso, no formato que o Excel em
    pt-BR abre direto: `;` entre colunas, vírgula decimal e UTF-8 com BOM. Só recursos e números,
    nenhum dado pessoal."""

    def render(self, report: OccupancyRead) -> CsvFile:
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";", lineterminator="\r\n")
        writer.writerow(HEADER)
        writer.writerows(self._row(resource) for resource in report.recursos)
        period = report.periodo
        return CsvFile(
            filename=f"ocupacao-{period.inicio.isoformat()}-a-{period.fim.isoformat()}.csv",
            content=buffer.getvalue().encode("utf-8-sig"),
        )

    @staticmethod
    def _row(resource: ResourceOccupancyRead) -> list[str]:
        return [
            _text(resource.nome),
            _text(resource.bloco),
            TYPE_LABELS[resource.tipo],
            _decimal(resource.horas_disponiveis),
            _decimal(resource.horas_reservadas),
            _decimal(resource.taxa_ocupacao * 100),
            str(resource.reservas),
            str(resource.cancelamentos),
            str(resource.nao_comparecimentos),
            _decimal(resource.horas_devolvidas),
        ]


def _decimal(value: float) -> str:
    return f"{value:.1f}".replace(".", ",")


def _text(value: str) -> str:
    return f"'{value}" if value.startswith(FORMULA_STARTS) else value
