"""Horário de funcionamento do campus e a grade de 30 minutos que ele define."""

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Self
from zoneinfo import ZoneInfo

from app.core.config import Settings
from app.core.opening_hours import DayHours, WeeklyHours

SLOT = timedelta(minutes=30)


@dataclass(frozen=True, slots=True)
class CampusSchedule:
    """Converte dias e horários locais (America/Maceio) em instantes UTC, dia a dia da semana."""

    timezone: ZoneInfo
    weekly_hours: WeeklyHours

    @classmethod
    def from_settings(cls, settings: Settings) -> Self:
        return cls(settings.timezone, settings.weekly_hours)

    def hours_on(self, day: date) -> DayHours | None:
        """Abertura e fechamento do dia, ou `None` quando o campus não abre."""
        return self.weekly_hours.get(day.weekday())

    def at(self, day: date, moment: time) -> datetime:
        return datetime.combine(day, moment, tzinfo=self.timezone).astimezone(UTC)

    def slots(self, day: date) -> list[tuple[datetime, datetime]]:
        """Intervalos `[inicio, fim)` de 30 minutos do dia; vazio quando fechado."""
        hours = self.hours_on(day)
        if hours is None:
            return []
        start, end = self.at(day, hours.opening), self.at(day, hours.closing)
        result: list[tuple[datetime, datetime]] = []
        while start + SLOT <= end:
            result.append((start, start + SLOT))
            start += SLOT
        return result

    def local_date(self, instant: datetime) -> date:
        return instant.astimezone(self.timezone).date()

    def is_aligned(self, instant: datetime) -> bool:
        """Cai exatamente numa marca de 30 minutos (no fuso do campus)."""
        local = instant.astimezone(self.timezone)
        return local.minute in {0, 30} and local.second == 0 and local.microsecond == 0

    def next_mark(self, instant: datetime) -> datetime:
        """A primeira marca de 30 minutos (no fuso do campus) igual ou depois do instante."""
        local = instant.astimezone(self.timezone)
        mark = local.replace(minute=local.minute - local.minute % 30, second=0, microsecond=0)
        if mark < local:
            mark += SLOT
        return mark.astimezone(UTC)

    def within_opening_hours(self, inicio: datetime, fim: datetime) -> bool:
        """Começa e termina no mesmo dia de funcionamento, entre a abertura e o fechamento."""
        day = self.local_date(inicio)
        hours = self.hours_on(day)
        if hours is None:
            return False
        return self.at(day, hours.opening) <= inicio and fim <= self.at(day, hours.closing)
