from collections import Counter, defaultdict
from collections.abc import Iterable, Iterator
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import ReservationStatus
from app.core.exceptions import BusinessRuleError
from app.core.opening_hours import DayHours
from app.repositories.occupancy_rows import ReservationSpan, ResourceRow
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import TimeRange
from app.repositories.resource_repository import ResourceRepository
from app.schemas.occupancy import (
    HeatmapCellRead,
    OccupancyParams,
    OccupancyPeriodRead,
    OccupancyRead,
    OccupancySummaryRead,
    ResourceOccupancyRead,
)
from app.services.occupancy_csv_writer import CsvFile, OccupancyCsvWriter

DEFAULT_DAYS = 30
MAX_DAYS = 92
DAY = timedelta(days=1)
HOUR = timedelta(hours=1)
NOTHING = timedelta(0)
RATE_DIGITS = 3

type HourKey = tuple[int, int]


class InvalidPeriodError(BusinessRuleError):
    code = "PERIODO_INVALIDO"
    default_detail = "Período inválido."


@dataclass(frozen=True, slots=True)
class _Period:
    first: date
    last: date
    window: TimeRange
    # Só os dias em que o campus abre, com abertura e fechamento em UTC.
    opening: dict[date, TimeRange]

    @property
    def available_per_resource(self) -> timedelta:
        return sum((hours.fim - hours.inicio for hours in self.opening.values()), NOTHING)


@dataclass(slots=True)
class _Tally:
    """O que um recurso (ou o campus todo) acumulou no período."""

    reserved: timedelta = field(default_factory=timedelta)
    returned: timedelta = field(default_factory=timedelta)
    reservas: int = 0
    cancelamentos: int = 0
    checkins: int = 0
    nao_comparecimentos: int = 0

    @classmethod
    def total(cls, tallies: Iterable["_Tally"]) -> "_Tally":
        result = cls()
        for tally in tallies:
            result.reserved += tally.reserved
            result.returned += tally.returned
            result.reservas += tally.reservas
            result.cancelamentos += tally.cancelamentos
            result.checkins += tally.checkins
            result.nao_comparecimentos += tally.nao_comparecimentos
        return result


class OccupancyService:
    """Painel de ocupação da administração (#44): quanto do horário de funcionamento os
    recursos ficaram reservados, quando, e quanto se perdeu com cancelamentos e não
    comparecimentos. Horas devolvidas somam as liberadas por não comparecimento e as de quem
    encerrou o uso mais cedo.

    Agrega em Python a partir de duas consultas enxutas (recursos e reservas que tocam o
    período). O período vai no máximo a 92 dias: algumas dezenas de milhares de linhas.
    Só `CONFIRMADA` ocupa; `CANCELADA` e `NAO_COMPARECEU` contam à parte. As horas são
    recortadas ao período e ao funcionamento, no fuso do campus.
    """

    def __init__(
        self,
        *,
        resources: ResourceRepository,
        reservations: ReservationRepository,
        schedule: CampusSchedule,
        clock: Clock,
        csv_writer: OccupancyCsvWriter,
    ) -> None:
        self._resources = resources
        self._reservations = reservations
        self._schedule = schedule
        self._clock = clock
        self._csv_writer = csv_writer

    def report(self, params: OccupancyParams) -> OccupancyRead:
        period = self._period(params)
        resources = self._resources.reservable_rows(params.bloco_id)
        spans = self._reservations.spans_touching([r.id for r in resources], period.window)

        now = self._clock.now()
        tallies = {resource.id: _Tally() for resource in resources}
        reserved_by_hour: defaultdict[HourKey, timedelta] = defaultdict(timedelta)
        for span in spans:
            tally = tallies[span.recurso_id]
            self._count(span, tally, period.window, now)
            if span.status is ReservationStatus.CONFIRMADA:
                for piece in self._open_pieces(span, period):
                    tally.reserved += piece.fim - piece.inicio
                    self._spread_by_hour(piece, reserved_by_hour)

        available = period.available_per_resource
        return OccupancyRead(
            periodo=OccupancyPeriodRead(inicio=period.first, fim=period.last),
            resumo=self._summary(_Tally.total(tallies.values()), available * len(resources)),
            mapa_calor=self._heatmap(period, len(resources), reserved_by_hour),
            recursos=self._by_resource(resources, tallies, available),
        )

    def export_csv(self, params: OccupancyParams) -> CsvFile:
        return self._csv_writer.render(self.report(params))

    def _period(self, params: OccupancyParams) -> _Period:
        """Sem datas, os últimos 30 dias até hoje (fuso do campus). Sem `inicio`, os 30 dias
        que terminam em `fim`; sem `fim`, até hoje."""
        last = params.fim or self._schedule.local_date(self._clock.now())
        first = params.inicio or last - (DEFAULT_DAYS - 1) * DAY
        if last < first:
            msg = (
                "A data inicial precisa ser igual ou anterior à final (sem data final, vale hoje)."
            )
            raise InvalidPeriodError(msg)
        days = (last - first).days + 1
        if days > MAX_DAYS:
            msg = f"Escolha um período de até {MAX_DAYS} dias (cerca de três meses)."
            raise InvalidPeriodError(msg)
        opening: dict[date, TimeRange] = {}
        for offset in range(days):
            day = first + offset * DAY
            hours = self._schedule.hours_on(day)
            if hours is not None:
                opening[day] = TimeRange(
                    self._schedule.at(day, hours.opening), self._schedule.at(day, hours.closing)
                )
        window = TimeRange(
            self._schedule.at(first, time.min), self._schedule.at(last + DAY, time.min)
        )
        return _Period(first, last, window, opening)

    @staticmethod
    def _count(span: ReservationSpan, tally: _Tally, window: TimeRange, now: datetime) -> None:
        if window.inicio <= span.inicio < window.fim:
            match span.status:
                case ReservationStatus.CANCELADA:
                    tally.cancelamentos += 1
                case ReservationStatus.NAO_COMPARECEU:
                    tally.reservas += 1
                    tally.nao_comparecimentos += 1
                case ReservationStatus.CONFIRMADA:
                    tally.reservas += 1
                    # A janela de check-in abre antes do início: só conta o que já começou.
                    if span.checkin_em is not None and span.inicio <= now:
                        tally.checkins += 1
        if span.status is ReservationStatus.NAO_COMPARECEU and span.liberada_em is not None:
            # Liberação preguiçosa: se foi liberada depois do fim, não devolveu nada.
            tally.returned += _overlap(TimeRange(span.liberada_em, span.fim), window)
        if span.status is ReservationStatus.CONFIRMADA and span.fim_previsto is not None:
            # Uso encerrado mais cedo: do novo fim ao fim original o horário voltou a ficar livre.
            tally.returned += _overlap(TimeRange(span.fim, span.fim_previsto), window)

    def _open_pieces(self, span: ReservationSpan, period: _Period) -> Iterator[TimeRange]:
        """Partes da reserva dentro do funcionamento de cada dia do período."""
        day = self._schedule.local_date(span.inicio)
        last = self._schedule.local_date(span.fim)
        while day <= last:
            hours = period.opening.get(day)
            if hours is not None:
                start, end = max(span.inicio, hours.inicio), min(span.fim, hours.fim)
                if start < end:
                    yield TimeRange(start, end)
            day += DAY

    def _spread_by_hour(self, piece: TimeRange, acc: defaultdict[HourKey, timedelta]) -> None:
        """Distribui o intervalo pelas horas cheias locais que ele atravessa."""
        cursor = piece.inicio.astimezone(self._schedule.timezone)
        end = piece.fim.astimezone(self._schedule.timezone)
        while cursor < end:
            step = min(cursor.replace(minute=0, second=0, microsecond=0) + HOUR, end)
            acc[cursor.isoweekday(), cursor.hour] += step - cursor
            cursor = step

    @staticmethod
    def _summary(total: _Tally, available: timedelta) -> OccupancySummaryRead:
        attendance = total.checkins + total.nao_comparecimentos
        return OccupancySummaryRead(
            horas_disponiveis=_hours(available),
            horas_reservadas=_hours(total.reserved),
            taxa_ocupacao=_ratio(total.reserved, available),
            reservas=total.reservas,
            cancelamentos=total.cancelamentos,
            taxa_cancelamento=_share(total.cancelamentos, total.reservas + total.cancelamentos),
            checkins=total.checkins,
            nao_comparecimentos=total.nao_comparecimentos,
            taxa_comparecimento=_share(total.checkins, attendance) if attendance else None,
            horas_devolvidas=_hours(total.returned),
        )

    def _heatmap(
        self, period: _Period, resources: int, reserved: defaultdict[HourKey, timedelta]
    ) -> list[HeatmapCellRead]:
        """Uma célula por hora em que o campus abre, para cada dia da semana do período."""
        occurrences = Counter(day.isoweekday() for day in period.opening)
        cells: list[HeatmapCellRead] = []
        for weekday in sorted(occurrences):
            hours = self._schedule.weekly_hours[weekday - 1]
            for hour in range(24):
                open_minutes = _open_within_hour(hours, hour)
                if open_minutes:
                    available = open_minutes * occurrences[weekday] * resources
                    taxa = _ratio(reserved[weekday, hour], available)
                    cells.append(HeatmapCellRead(dia_semana=weekday, hora=hour, taxa=taxa))
        return cells

    @staticmethod
    def _by_resource(
        resources: list[ResourceRow], tallies: dict[int, _Tally], available: timedelta
    ) -> list[ResourceOccupancyRead]:
        rows = [_resource_read(resource, tallies[resource.id], available) for resource in resources]
        return sorted(rows, key=lambda row: (-row.taxa_ocupacao, row.nome.casefold(), row.id))


def _resource_read(
    resource: ResourceRow, tally: _Tally, available: timedelta
) -> ResourceOccupancyRead:
    return ResourceOccupancyRead(
        id=resource.id,
        nome=resource.nome,
        tipo=resource.tipo,
        bloco=resource.bloco,
        horas_disponiveis=_hours(available),
        horas_reservadas=_hours(tally.reserved),
        taxa_ocupacao=_ratio(tally.reserved, available),
        reservas=tally.reservas,
        cancelamentos=tally.cancelamentos,
        nao_comparecimentos=tally.nao_comparecimentos,
        horas_devolvidas=_hours(tally.returned),
    )


def _overlap(interval: TimeRange, window: TimeRange) -> timedelta:
    return max(min(interval.fim, window.fim) - max(interval.inicio, window.inicio), NOTHING)


def _open_within_hour(hours: DayHours, hour: int) -> timedelta:
    opening = timedelta(hours=hours.opening.hour, minutes=hours.opening.minute)
    closing = timedelta(hours=hours.closing.hour, minutes=hours.closing.minute)
    return max(min(closing, (hour + 1) * HOUR) - max(opening, hour * HOUR), NOTHING)


def _hours(duration: timedelta) -> float:
    return round(duration / HOUR, 1)


def _ratio(part: timedelta, whole: timedelta) -> float:
    return round(part / whole, RATE_DIGITS) if whole else 0.0


def _share(part: int, whole: int) -> float:
    return round(part / whole, RATE_DIGITS) if whole else 0.0
