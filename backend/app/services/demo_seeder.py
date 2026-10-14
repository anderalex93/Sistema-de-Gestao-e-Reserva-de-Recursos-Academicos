import secrets
from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime
from random import Random

from app.core.campus_schedule import CampusSchedule
from app.core.clock import Clock
from app.core.enums import ReservationStatus, UserRole
from app.core.reservation_rules import ReservationRules
from app.core.security import PasswordHasher
from app.db import demo_seed_data as data
from app.db.catalog_seed_data import ResourceSeed
from app.db.unit_of_work import UnitOfWork
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import ResourceFilters
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository
from app.services.demo_agenda import DEMO_CODE_PREFIX, DemoAgenda, DemoCast, DemoPlan


@dataclass(frozen=True, slots=True)
class DemoSeedResult:
    contas_criadas: int
    contas_redefinidas: int
    pessoas_criadas: int
    reservas_removidas: int
    reservas_por_status: Mapping[ReservationStatus, int]

    @property
    def reservas(self) -> int:
        return sum(self.reservas_por_status.values())


class DemoSeeder:
    """Dados de demonstração da apresentação (#38), relativos a "hoje" no fuso do campus.

    Garante as contas usadas ao vivo (senha redefinida e conta reativada a cada execução, para
    o dia da apresentação ser previsível) e as pessoas fictícias, apaga as reservas de
    demonstração anteriores (só as de código `EDU-D0...`, nunca as reais) e recria o cenário
    montado pela `DemoAgenda`. Pode rodar quantas vezes quiser.
    """

    def __init__(
        self,
        *,
        resources: ResourceRepository,
        users: UserRepository,
        reservations: ReservationRepository,
        uow: UnitOfWork,
        hasher: PasswordHasher,
        schedule: CampusSchedule,
        rules: ReservationRules,
        clock: Clock,
        rng: Random,
    ) -> None:
        self._resources = resources
        self._users = users
        self._reservations = reservations
        self._uow = uow
        self._hasher = hasher
        self._schedule = schedule
        self._rules = rules
        self._clock = clock
        self._rng = rng

    def run(
        self, senha: str, catalog: Iterable[ResourceSeed], plan: DemoPlan | None = None
    ) -> DemoSeedResult:
        now = self._clock.now()
        accounts, created, reset = self._accounts(senha, now)
        people, people_created = self._people(now)
        removed = self._reservations.delete_by_code_prefix(DEMO_CODE_PREFIX)

        resources = self._catalog_resources(catalog)
        agenda = DemoAgenda(
            schedule=self._schedule,
            rules=self._rules,
            rng=self._rng,
            now=now,
            plan=plan or DemoPlan(),
            resources=resources,
            cast=DemoCast(
                lucas=accounts[data.LUCAS.email],
                marina=accounts[data.MARINA.email],
                students=[user for user in people if user.perfil is UserRole.ALUNO],
                teachers=[user for user in people if user.perfil is UserRole.PROFESSOR],
            ),
        )
        window = agenda.window
        agenda.block(
            self._reservations.confirmed_for_resources(
                [resource.id for resource in resources], window.inicio, window.fim
            )
        )
        reservations = agenda.build()
        self._reservations.add_all(reservations)
        self._uow.commit()
        return DemoSeedResult(
            contas_criadas=created,
            contas_redefinidas=reset,
            pessoas_criadas=people_created,
            reservas_removidas=removed,
            reservas_por_status=Counter(reservation.status for reservation in reservations),
        )

    def _accounts(self, senha: str, now: datetime) -> tuple[dict[str, User], int, int]:
        password_hash = self._hasher.hash(senha)
        accounts: dict[str, User] = {}
        created = reset = 0
        for person in data.ACCOUNTS:
            user = self._users.get_by_email(person.email)
            if user is None:
                user = self._users.add(self._new_user(person, password_hash, now))
                created += 1
            else:
                user.nome = person.nome
                user.perfil = person.perfil
                user.senha_hash = password_hash
                user.ativo = True
                user.aceite_termos_em = user.aceite_termos_em or now
                reset += 1
            accounts[person.email] = user
        return accounts, created, reset

    def _people(self, now: datetime) -> tuple[list[User], int]:
        """Donas das reservas. Senha inutilizável: hash de um segredo aleatório descartado."""
        people: list[User] = []
        missing: list[data.DemoPerson] = []
        for person in data.PEOPLE:
            user = self._users.get_by_email(person.email)
            if user is None:
                missing.append(person)
            else:
                people.append(user)
        if missing:
            unusable = self._hasher.hash(secrets.token_urlsafe(32))
            created = [self._new_user(person, unusable, now) for person in missing]
            self._users.add_all(created)
            people.extend(created)
        return people, len(missing)

    @staticmethod
    def _new_user(person: data.DemoPerson, password_hash: str, now: datetime) -> User:
        return User(
            nome=person.nome,
            email=person.email,
            senha_hash=password_hash,
            perfil=person.perfil,
            aceite_termos_em=now,
        )

    def _catalog_resources(self, catalog: Iterable[ResourceSeed]) -> list[Resource]:
        """Recursos reserváveis do catálogo do seed; os cadastrados à parte ficam de fora."""
        keys = {(seed.bloco, seed.nome) for seed in catalog}
        return [
            resource
            for resource in self._resources.list_matching(ResourceFilters())
            if (resource.bloco.nome, resource.nome) in keys
        ]
