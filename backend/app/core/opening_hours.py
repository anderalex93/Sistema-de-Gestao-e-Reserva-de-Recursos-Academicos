"""Horário de funcionamento por dia da semana, lido de `HORARIO_FUNCIONAMENTO`.

Formato: grupos separados por `;`, cada um com dias e faixa. Dias aceitam intervalo (`seg-sex`)
e lista (`seg,qua`). Dia que não aparece fica fechado. Exemplo (o padrão da UMJ):

    seg-sex 08:00-21:00; sab 08:00-12:00
"""

import re
from dataclasses import dataclass
from datetime import time
from types import MappingProxyType

# Índices de `date.weekday()`: segunda = 0.
WEEKDAYS = ("seg", "ter", "qua", "qui", "sex", "sab", "dom")
DEFAULT_OPENING_HOURS = "seg-sex 08:00-21:00; sab 08:00-12:00"

_GROUP = re.compile(r"^(?P<days>[a-z,\-]+)\s+(?P<open>\d{2}:\d{2})-(?P<close>\d{2}:\d{2})$")


@dataclass(frozen=True, slots=True)
class DayHours:
    opening: time
    closing: time


type WeeklyHours = MappingProxyType[int, DayHours]


def _parse_time(text: str) -> time:
    try:
        moment = time.fromisoformat(text)
    except ValueError as exc:
        msg = f"Horário inválido: {text}"
        raise ValueError(msg) from exc
    if moment.minute not in {0, 30}:
        msg = f"Os horários precisam cair em :00 ou :30 ({text})"
        raise ValueError(msg)
    return moment


def _parse_days(text: str) -> list[int]:
    days: list[int] = []
    for part in text.split(","):
        first, _, last = part.partition("-")
        if first not in WEEKDAYS or (last and last not in WEEKDAYS):
            msg = f"Dia desconhecido em '{part}'. Use {', '.join(WEEKDAYS)}"
            raise ValueError(msg)
        start = WEEKDAYS.index(first)
        end = WEEKDAYS.index(last) if last else start
        if end < start:
            msg = f"Intervalo de dias invertido: '{part}'"
            raise ValueError(msg)
        days.extend(range(start, end + 1))
    return days


def parse_weekly_hours(text: str) -> WeeklyHours:
    hours: dict[int, DayHours] = {}
    for group in filter(None, (item.strip().lower() for item in text.split(";"))):
        match = _GROUP.match(re.sub(r"\s+", " ", group))
        if match is None:
            msg = f"Grupo inválido: '{group}'. Exemplo: seg-sex 08:00-21:00"
            raise ValueError(msg)
        day_hours = DayHours(_parse_time(match["open"]), _parse_time(match["close"]))
        if day_hours.closing <= day_hours.opening:
            msg = f"O fechamento precisa ser depois da abertura em '{group}'"
            raise ValueError(msg)
        for day in _parse_days(match["days"]):
            if day in hours:
                msg = f"O dia {WEEKDAYS[day]} aparece mais de uma vez"
                raise ValueError(msg)
            hours[day] = day_hours
    if not hours:
        msg = "Informe ao menos um dia de funcionamento"
        raise ValueError(msg)
    return MappingProxyType(dict(sorted(hours.items())))
