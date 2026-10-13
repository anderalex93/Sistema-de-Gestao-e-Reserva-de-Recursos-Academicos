"""Fonte de "agora" injetável, para as regras de horário serem testáveis."""

from datetime import UTC, datetime
from typing import Protocol


class Clock(Protocol):
    def now(self) -> datetime:
        """Instante atual com fuso UTC."""
        ...


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)
