import string
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from enum import Enum, auto
from random import Random
from types import MappingProxyType

from app.core.campus_schedule import SLOT, CampusSchedule
from app.core.enums import ReservationStatus, ResourceType
from app.core.reservation_rules import ReservationRules
from app.db import demo_seed_data as data
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.resource_filters import TimeRange

# `EDU-D0` + 4 de [A-Z0-9]: 10 caracteres, como os reais. Os códigos reais (`EDU-` + 6 do
# alfabeto sem 0, O, 1, I e L) nunca têm `0` nessa posição, então o prefixo só pega a demo.
DEMO_CODE_PREFIX = "EDU-D0"
CODE_CHARS = string.ascii_uppercase + string.digits
CODE_RANDOM_LENGTH = 4

DAY = timedelta(days=1)
# Duração em blocos de 30 minutos: 1h é a mais comum, até 2h.
LENGTHS = (2, 2, 3, 4)
MIN_LENGTH = 2
CANCELLED_SHARE = 0.07
NO_SHOW_SHARE = 0.08
CHECKIN_JITTER_MINUTES = 10
LUCAS_FUTURE_MAX = 2

# Chance de uma reserva começar numa meia hora livre, pela hora local (dia útil típico).
# Picos das 14h às 17h e das 19h às 21h; manhã e almoço mais calmos.
HOURLY_DEMAND: Mapping[int, float] = MappingProxyType(
    {
        8: 0.06,
        9: 0.10,
        10: 0.12,
        11: 0.10,
        12: 0.05,
        13: 0.12,
        14: 0.32,
        15: 0.36,
        16: 0.34,
        17: 0.22,
        18: 0.18,
        19: 0.40,
        20: 0.45,
    }
)
# Segunda a domingo: sexta mais vazia, sábado fraco.
WEEKDAY_FACTOR = (1.0, 1.05, 1.1, 1.05, 0.8, 0.35, 0.0)
# Manhã, tarde e noite: laboratórios cheios à tarde, salas de estudo à noite.
TYPE_FACTOR: Mapping[ResourceType, tuple[float, float, float]] = MappingProxyType(
    {
        ResourceType.SALA_ESTUDO: (0.8, 0.9, 1.6),
        ResourceType.LABORATORIO: (0.8, 1.6, 0.5),
        ResourceType.AUDITORIO: (0.5, 0.5, 0.4),
        ResourceType.EQUIPAMENTO: (0.7, 0.6, 0.4),
    }
)
# Quem costuma reservar cada tipo: professores dominam laboratórios, auditório e equipamentos.
TEACHER_SHARE: Mapping[ResourceType, float] = MappingProxyType(
    {
        ResourceType.SALA_ESTUDO: 0.1,
        ResourceType.LABORATORIO: 0.7,
        ResourceType.AUDITORIO: 0.8,
        ResourceType.EQUIPAMENTO: 0.75,
    }
)
HISTORY_FACTOR = 1.0
TODAY_FACTOR = 1.2
FUTURE_FACTOR = 0.25
AFTERNOON_FROM = 12
NIGHT_FROM = 18


class DemoOutcome(Enum):
    ATTENDED = auto()
    NO_SHOW = auto()
    CANCELLED = auto()
    # Confirmada e sem check-in: ainda vai começar (ou é a do Laboratório Maker de hoje).
    BOOKED = auto()


# (posição entre os dias de funcionamento do histórico, do mais recente para o mais antigo).
LUCAS_HISTORY: tuple[tuple[int, DemoOutcome], ...] = (
    (0, DemoOutcome.ATTENDED),
    (1, DemoOutcome.CANCELLED),
    (3, DemoOutcome.NO_SHOW),
    (5, DemoOutcome.ATTENDED),
    (9, DemoOutcome.ATTENDED),
    (14, DemoOutcome.ATTENDED),
)
MARINA_HISTORY: tuple[tuple[int, DemoOutcome], ...] = (
    (0, DemoOutcome.ATTENDED),
    (2, DemoOutcome.ATTENDED),
    (4, DemoOutcome.CANCELLED),
    (7, DemoOutcome.ATTENDED),
    (11, DemoOutcome.ATTENDED),
)


@dataclass(frozen=True, slots=True)
class DemoPlan:
    """Alcance do cenário em torno de hoje."""

    semanas_historico: int = 4
    dias_futuros: int = 7


@dataclass(frozen=True, slots=True)
class DemoCast:
    lucas: User
    marina: User
    students: Sequence[User]
    teachers: Sequence[User]


class DemoAgenda:
    """Monta as reservas de demonstração em torno de "hoje" no fuso do campus, sem tocar no banco.

    Ordem: reservas reais e espaços que a demo usa ao vivo ficam tomados primeiro; depois entram
    as reservas com papel no roteiro (Lucas, Marina, o não comparecimento do Maker e a ocupação
    da noite) e por fim o preenchimento aleatório com o padrão de uso do campus. Nada se
    sobrepõe no mesmo recurso, e nada que já passou do prazo fica confirmado sem check-in,
    exceto a reserva do Laboratório Maker de hoje.
    """

    def __init__(
        self,
        *,
        schedule: CampusSchedule,
        rules: ReservationRules,
        rng: Random,
        now: datetime,
        plan: DemoPlan,
        resources: Sequence[Resource],
        cast: DemoCast,
    ) -> None:
        self._schedule = schedule
        self._rules = rules
        self._rng = rng
        self._now = now
        self._plan = plan
        self._resources = resources
        self._by_key = {(resource.bloco.nome, resource.nome): resource for resource in resources}
        self._cast = cast
        self._today = schedule.local_date(now)
        self._taken: dict[tuple[int, date], list[tuple[datetime, datetime]]] = {}
        self._codes: set[str] = set()
        self._result: list[Reservation] = []

    @property
    def window(self) -> TimeRange:
        """Do início do histórico ao fim do último dia futuro."""
        first = self._today - DAY * 7 * self._plan.semanas_historico
        last = self._today + DAY * (self._plan.dias_futuros + 1)
        return TimeRange(self._schedule.at(first, time()), self._schedule.at(last, time()))

    def block(self, reservations: Iterable[Reservation]) -> None:
        """Horários já ocupados por reservas reais, que o cenário precisa contornar."""
        for reservation in reservations:
            self._take(reservation.recurso_id, reservation.inicio, reservation.fim)

    def build(self) -> list[Reservation]:
        self._keep_live_rooms_free()
        self._today_scenario()
        self._lucas_and_marina()
        for day in self._history_days():
            self._fill(day, HISTORY_FACTOR)
        self._fill(self._today, TODAY_FACTOR)
        for day in self._future_days():
            self._fill(day, FUTURE_FACTOR)
        return self._result

    # Dias

    def _history_days(self) -> list[date]:
        """Dias de funcionamento das semanas anteriores a hoje, do mais antigo ao mais recente."""
        span = 7 * self._plan.semanas_historico
        days = (self._today - DAY * offset for offset in range(span, 0, -1))
        return [day for day in days if self._schedule.hours_on(day) is not None]

    def _future_days(self) -> list[date]:
        days = (self._today + DAY * offset for offset in range(1, self._plan.dias_futuros + 1))
        return [day for day in days if self._schedule.hours_on(day) is not None]

    def _exact(self, day: date, start: time, end: time) -> tuple[datetime, datetime] | None:
        """O horário pedido, se cabe inteiro no funcionamento do dia."""
        hours = self._schedule.hours_on(day)
        if hours is None or start < hours.opening or end > hours.closing:
            return None
        return self._schedule.at(day, start), self._schedule.at(day, end)

    def _fitted(self, day: date, preferred: time, length: int) -> tuple[datetime, datetime] | None:
        """Começa no horário preferido ou o mais perto dele que ainda caiba no dia."""
        hours = self._schedule.hours_on(day)
        if hours is None:
            return None
        opening = self._schedule.at(day, hours.opening)
        closing = self._schedule.at(day, hours.closing)
        start = min(max(opening, self._schedule.at(day, preferred)), closing - SLOT * length)
        return (start, start + SLOT * length) if start >= opening else None

    def _floor_to_slot(self, instant: datetime) -> datetime:
        local = instant.astimezone(self._schedule.timezone)
        floored = local.replace(minute=local.minute // 30 * 30, second=0, microsecond=0)
        return self._schedule.at(local.date(), floored.time())

    # Cenário do roteiro

    def _keep_live_rooms_free(self) -> None:
        hours = self._schedule.hours_on(self._today)
        if hours is None:
            return
        room = self._by_key.get((data.LIVE_ROOM_FREE.bloco, data.LIVE_ROOM_FREE.nome))
        start = max(data.LIVE_ROOM_FREE.inicio, hours.opening)
        end = min(data.LIVE_ROOM_FREE.fim, hours.closing)
        if room is not None and start < end:
            self._take(
                room.id, self._schedule.at(self._today, start), self._schedule.at(self._today, end)
            )
        whole_day = self._by_key.get(data.FREE_ALL_DAY)
        if whole_day is not None:
            self._take(
                whole_day.id,
                self._schedule.at(self._today, hours.opening),
                self._schedule.at(self._today, hours.closing),
            )

    def _today_scenario(self) -> None:
        self._overdue_without_checkin()
        for slot in data.TODAY_BUSY:
            resource = self._by_key.get((slot.bloco, slot.nome))
            span = self._exact(self._today, slot.inicio, slot.fim)
            if resource is not None and span is not None:
                start, end = span
                # Precisa aparecer ocupada: quem reservou compareceu (ou ainda vai chegar).
                outcome = DemoOutcome.BOOKED if start > self._now else DemoOutcome.ATTENDED
                self._place(resource, self._pick(self._cast.students), start, end, outcome)

    def _overdue_without_checkin(self) -> None:
        """Começou há mais que a tolerância e ninguém fez check-in: a primeira leitura libera."""
        resource = self._by_key.get(data.NO_SHOW_ROOM)
        hours = self._schedule.hours_on(self._today)
        if resource is None or hours is None:
            return
        opening = self._schedule.at(self._today, hours.opening)
        closing = self._schedule.at(self._today, hours.closing)
        if not opening <= self._now < closing:
            return
        start = self._floor_to_slot(
            self._now - self._rules.checkin_tolerance - timedelta(minutes=1)
        )
        if start < opening:
            return
        end = min(start + SLOT * 4, closing)
        self._place(resource, self._pick(self._cast.teachers), start, end, DemoOutcome.BOOKED)

    def _lucas_and_marina(self) -> None:
        recent_first = self._history_days()[::-1]
        for index, outcome in LUCAS_HISTORY:
            if index < len(recent_first):
                self._place_first_free(
                    data.STUDY_ROOMS,
                    self._cast.lucas,
                    recent_first[index],
                    start=time(19),
                    length=3,
                    outcome=outcome,
                )
        for index, outcome in MARINA_HISTORY:
            if index < len(recent_first):
                self._place_first_free(
                    data.LABS,
                    self._cast.marina,
                    recent_first[index],
                    start=time(14),
                    length=4,
                    outcome=outcome,
                )

        future = self._future_days()
        limit = self._rules.active_limit_for(self._cast.lucas.perfil)
        # Lucas é aluno: sobra ao menos uma vaga no limite para reservar ao vivo.
        lucas_future = LUCAS_FUTURE_MAX if limit is None else min(LUCAS_FUTURE_MAX, limit - 1)
        # "Sua próxima reserva" no início: o próximo dia de funcionamento.
        for day in (future[0:1] + future[2:3])[:lucas_future]:
            self._place_first_free(
                data.STUDY_ROOMS,
                self._cast.lucas,
                day,
                start=time(14),
                length=3,
                outcome=DemoOutcome.BOOKED,
            )
        if future:
            day = future[1] if len(future) > 1 else future[0]
            self._place_first_free(
                data.LABS,
                self._cast.marina,
                day,
                start=time(10),
                length=4,
                outcome=DemoOutcome.BOOKED,
            )

    def _place_first_free(
        self,
        keys: Sequence[tuple[str, str]],
        owner: User,
        day: date,
        *,
        start: time,
        length: int,
        outcome: DemoOutcome,
    ) -> None:
        span = self._fitted(day, start, length)
        if span is None:
            return
        for key in keys:
            resource = self._by_key.get(key)
            if resource is not None and self._place(resource, owner, *span, outcome):
                return

    # Preenchimento com o padrão de uso

    def _fill(self, day: date, factor: float) -> None:
        hours = self._schedule.hours_on(day)
        if hours is None:
            return
        weekday = WEEKDAY_FACTOR[day.weekday()]
        starts = [start for start, _ in self._schedule.slots(day)]
        for resource in self._resources:
            index = 0
            while index < len(starts):
                start = starts[index]
                chance = self._demand(resource.tipo, start) * weekday * factor
                if self._rng.random() < chance:
                    # Perto do fechamento, encurta até ele (mas nunca abaixo de 1h).
                    length = min(self._rng.choice(LENGTHS), len(starts) - index)
                    end = start + SLOT * length
                    owner = self._owner_for(resource.tipo)
                    if length >= MIN_LENGTH and self._place(resource, owner, start, end):
                        index += length
                        continue
                index += 1

    def _demand(self, tipo: ResourceType, start: datetime) -> float:
        hour = start.astimezone(self._schedule.timezone).hour
        period = 0 if hour < AFTERNOON_FROM else 1 if hour < NIGHT_FROM else 2
        return HOURLY_DEMAND.get(hour, 0.0) * TYPE_FACTOR[tipo][period]

    def _owner_for(self, tipo: ResourceType) -> User:
        teacher = self._rng.random() < TEACHER_SHARE[tipo]
        return self._pick(self._cast.teachers if teacher else self._cast.students)

    def _pick(self, people: Sequence[User]) -> User:
        return self._rng.choice(people)

    def _outcome_for(self, start: datetime) -> DemoOutcome:
        """Futuras ficam sem check-in; as que já começaram tiveram presença (ou não)."""
        if start > self._now:
            return DemoOutcome.BOOKED
        if start + self._rules.checkin_tolerance > self._now:
            # Ainda dentro da tolerância: sem check-in viraria "não compareceu" durante a demo.
            return DemoOutcome.ATTENDED
        roll = self._rng.random()
        if roll < CANCELLED_SHARE:
            return DemoOutcome.CANCELLED
        if roll < CANCELLED_SHARE + NO_SHOW_SHARE:
            return DemoOutcome.NO_SHOW
        return DemoOutcome.ATTENDED

    # Registro

    def _take(self, resource_id: int, start: datetime, end: datetime) -> None:
        key = (resource_id, self._schedule.local_date(start))
        self._taken.setdefault(key, []).append((start, end))

    def _is_free(self, resource_id: int, start: datetime, end: datetime) -> bool:
        taken = self._taken.get((resource_id, self._schedule.local_date(start)), [])
        return all(end <= other_start or other_end <= start for other_start, other_end in taken)

    def _place(
        self,
        resource: Resource,
        owner: User,
        start: datetime,
        end: datetime,
        outcome: DemoOutcome | None = None,
    ) -> bool:
        if not self._is_free(resource.id, start, end):
            return False
        self._take(resource.id, start, end)
        self._result.append(
            self._reservation(resource, owner, start, end, outcome or self._outcome_for(start))
        )
        return True

    def _reservation(
        self, resource: Resource, owner: User, start: datetime, end: datetime, outcome: DemoOutcome
    ) -> Reservation:
        reservation = Reservation(
            codigo=self._new_code(),
            recurso=resource,
            usuario_id=owner.id,
            inicio=start,
            fim=end,
            status=ReservationStatus.CONFIRMADA,
            finalidade=self._purpose(resource.tipo),
            qtd_participantes=self._participants(resource.capacidade),
        )
        if outcome is DemoOutcome.ATTENDED:
            reservation.checkin_em = self._checkin_time(start)
        elif outcome is DemoOutcome.NO_SHOW:
            reservation.status = ReservationStatus.NAO_COMPARECEU
            reservation.liberada_em = start + self._rules.checkin_tolerance
        elif outcome is DemoOutcome.CANCELLED:
            reservation.status = ReservationStatus.CANCELADA
            reservation.cancelada_em = start - DAY
            reservation.cancelada_por_id = owner.id
        return reservation

    def _checkin_time(self, start: datetime) -> datetime:
        """Alguns minutos antes ou depois do início, dentro da janela e nunca no futuro."""
        jitter = timedelta(
            minutes=self._rng.randint(-CHECKIN_JITTER_MINUTES, CHECKIN_JITTER_MINUTES)
        )
        earliest = start - self._rules.checkin_lead
        latest = min(start + self._rules.checkin_tolerance, self._now)
        return min(max(start + jitter, earliest), latest)

    def _purpose(self, tipo: ResourceType) -> str:
        if tipo is ResourceType.SALA_ESTUDO:
            return self._rng.choice(data.PURPOSES_STUDY)
        if tipo is ResourceType.LABORATORIO:
            return self._rng.choice(data.PURPOSES_LAB)
        return self._rng.choice(data.PURPOSES_EVENT)

    def _participants(self, capacity: int | None) -> int | None:
        if capacity is None:
            return None
        return self._rng.randint(max(1, capacity // 4), capacity)

    def _new_code(self) -> str:
        while True:
            suffix = "".join(self._rng.choice(CODE_CHARS) for _ in range(CODE_RANDOM_LENGTH))
            code = DEMO_CODE_PREFIX + suffix
            if code not in self._codes:
                self._codes.add(code)
                return code
