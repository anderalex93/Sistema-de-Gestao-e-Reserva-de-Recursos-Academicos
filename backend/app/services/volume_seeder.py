from dataclasses import dataclass
from datetime import date, datetime, timedelta
from random import Random

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.building_repository import BuildingRepository
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import ResourceFilters
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository

EMAIL_TEMPLATE = "carga{:04d}@umj.edu.br"
CODE_TEMPLATE = "EDU-V{:05d}"
FALLBACK_BUILDING = "Bloco Carga"
CANCELLED_SHARE = 0.1
BATCH_SIZE = 2_000
SLOT = timedelta(minutes=30)


@dataclass(frozen=True, slots=True)
class VolumePlan:
    """Tamanho do seed. O padrão é o da issue #33: ~100 recursos e ~20.000 reservas em 60 dias."""

    recursos: int = 100
    usuarios: int = 200
    dias: int = 60
    reservas_por_dia: tuple[int, int] = (3, 6)


@dataclass(frozen=True, slots=True)
class VolumeSeedResult:
    recursos: int
    usuarios: int
    reservas: int


class VolumeSeeder:
    """Massa de dados para medir o RNF02 (consultas em até 2 s).

    Contas sintéticas `cargaNNNN@umj.edu.br`, recursos "Sala de carga NNN" e reservas sem
    sobreposição, metade antes e metade depois de hoje, ~10% canceladas. Roda uma vez: se a
    primeira conta sintética já existe, não faz nada. Só para ambientes de medição.
    """

    def __init__(
        self,
        *,
        buildings: BuildingRepository,
        resources: ResourceRepository,
        users: UserRepository,
        reservations: ReservationRepository,
        uow: UnitOfWork,
        schedule: CampusSchedule,
        clock: Clock,
        rng: Random,
    ) -> None:
        self._buildings = buildings
        self._resources = resources
        self._users = users
        self._reservations = reservations
        self._uow = uow
        self._schedule = schedule
        self._clock = clock
        self._rng = rng

    def run(self, plan: VolumePlan, password_hash: str) -> VolumeSeedResult:
        if self._users.email_exists(EMAIL_TEMPLATE.format(1)):
            return VolumeSeedResult(recursos=0, usuarios=0, reservas=0)
        resources, created = self._fill_resources(plan.recursos)
        people = self._create_users(plan.usuarios, password_hash)
        reservations = self._create_reservations(resources, people, plan)
        self._uow.commit()
        return VolumeSeedResult(
            recursos=created,
            usuarios=len(people),
            reservas=reservations,
        )

    def _fill_resources(self, target: int) -> tuple[list[Resource], int]:
        """Completa até `target` recursos reserváveis, distribuídos pelos blocos ativos."""
        existing = list(self._resources.list_matching(ResourceFilters()))
        buildings = list(self._buildings.list_active())
        if not buildings:
            buildings = [self._buildings.add(Building(nome=FALLBACK_BUILDING))]
        created = [
            Resource(
                bloco=buildings[number % len(buildings)],
                nome=f"Sala de carga {number:03d}",
                tipo=ResourceType.SALA_ESTUDO,
                capacidade=self._rng.choice((4, 6, 8, 12)),
            )
            for number in range(1, max(0, target - len(existing)) + 1)
        ]
        self._resources.add_all(created)
        return existing + created, len(created)

    def _create_users(self, count: int, password_hash: str) -> list[User]:
        now = self._clock.now()
        people = [
            User(
                nome=f"Aluno Carga {number:04d}",
                email=EMAIL_TEMPLATE.format(number),
                senha_hash=password_hash,
                perfil=UserRole.ALUNO,
                aceite_termos_em=now,
            )
            for number in range(1, count + 1)
        ]
        self._users.add_all(people)
        return people

    def _create_reservations(
        self, resources: list[Resource], people: list[User], plan: VolumePlan
    ) -> int:
        today = self._schedule.local_date(self._clock.now())
        first_day = today - timedelta(days=plan.dias // 2)
        batch: list[Reservation] = []
        total = 0
        for offset in range(plan.dias):
            day = first_day + timedelta(days=offset)
            for resource in resources:
                for start, end in self._day_intervals(day, plan.reservas_por_dia):
                    total += 1
                    batch.append(
                        self._reservation(total, resource, self._rng.choice(people), start, end)
                    )
            if len(batch) >= BATCH_SIZE:
                self._reservations.add_all(batch)
                batch = []
        self._reservations.add_all(batch)
        return total

    def _day_intervals(
        self, day: date, per_day: tuple[int, int]
    ) -> list[tuple[datetime, datetime]]:
        """Intervalos alinhados à grade, em sequência e sem sobreposição, dentro do horário."""
        hours = self._schedule.hours_on(day)
        if hours is None:
            return []
        cursor = self._schedule.at(day, hours.opening)
        closing = self._schedule.at(day, hours.closing)
        intervals: list[tuple[datetime, datetime]] = []
        for _ in range(self._rng.randint(*per_day)):
            start = cursor + SLOT * self._rng.randint(0, 4)
            end = start + SLOT * self._rng.randint(1, 4)
            if end > closing:
                break
            intervals.append((start, end))
            cursor = end
        return intervals

    def _reservation(
        self, number: int, resource: Resource, user: User, start: datetime, end: datetime
    ) -> Reservation:
        cancelled = self._rng.random() < CANCELLED_SHARE
        return Reservation(
            codigo=CODE_TEMPLATE.format(number),
            recurso=resource,
            usuario_id=user.id,
            inicio=start,
            fim=end,
            status=ReservationStatus.CANCELADA if cancelled else ReservationStatus.CONFIRMADA,
            cancelada_em=start - timedelta(days=1) if cancelled else None,
            cancelada_por_id=user.id if cancelled else None,
            qtd_participantes=self._rng.randint(1, 4),
        )
