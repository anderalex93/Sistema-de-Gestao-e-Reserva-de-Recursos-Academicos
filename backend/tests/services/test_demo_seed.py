import logging
import re
from collections import Counter
from collections.abc import Callable, Iterable, Sequence
from datetime import UTC, date, datetime, time, timedelta
from itertools import pairwise
from random import Random

import pytest
from pydantic import SecretStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.db import catalog_seed_data as catalog_data
from app.db import demo_seed_data as demo_data
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.repositories.user_repository import UserRepository
from app.seed import seed_demo
from app.services.catalog_seeder import CatalogSeeder
from app.services.demo_agenda import DemoPlan
from app.services.demo_seeder import DemoSeeder, DemoSeedResult
from tests.conftest import FAST_HASHER, FixedClock
from tests.services.test_reservation_service import MACEIO, RULES, SCHEDULE

SENHA = "Demo2026"
TUESDAY = date(2030, 10, 22)
TUESDAY_15H = datetime.combine(TUESDAY, time(15), tzinfo=MACEIO).astimezone(UTC)
TUESDAY_22H = datetime.combine(TUESDAY, time(22), tzinfo=MACEIO).astimezone(UTC)
SATURDAY_10H = datetime(2030, 10, 26, 10, tzinfo=MACEIO).astimezone(UTC)
SUNDAY_10H = datetime(2030, 10, 27, 10, tzinfo=MACEIO).astimezone(UTC)
SHORT = DemoPlan(semanas_historico=1)
FULL = DemoPlan()
TOLERANCE = timedelta(minutes=15)
DEMO_CODE = re.compile(r"^EDU-D0[A-Z0-9]{4}$")


@pytest.fixture
def catalog(db_session: Session) -> None:
    CatalogSeeder(
        BuildingRepository(db_session),
        FeatureRepository(db_session),
        ResourceRepository(db_session),
        UnitOfWork(db_session),
    ).run(catalog_data.FEATURES, catalog_data.BUILDINGS, catalog_data.RESOURCES)


def run(db_session: Session, now: datetime = TUESDAY_15H, plan: DemoPlan = SHORT) -> DemoSeedResult:
    return DemoSeeder(
        resources=ResourceRepository(db_session),
        users=UserRepository(db_session),
        reservations=ReservationRepository(db_session),
        uow=UnitOfWork(db_session),
        hasher=FAST_HASHER,
        schedule=SCHEDULE,
        rules=RULES,
        clock=FixedClock(now),
        rng=Random(38),  # noqa: S311 - cenário reprodutível
    ).run(SENHA, catalog_data.RESOURCES, plan)


def all_reservations(db_session: Session) -> Sequence[Reservation]:
    return db_session.scalars(select(Reservation).order_by(Reservation.inicio)).all()


def count(db_session: Session, model: type[Reservation | User]) -> int:
    return db_session.scalar(select(func.count()).select_from(model)) or 0


def resource(db_session: Session, bloco: str, nome: str) -> Resource:
    found = db_session.scalar(
        select(Resource).join(Resource.bloco).where(Building.nome == bloco, Resource.nome == nome)
    )
    assert found is not None
    return found


def user(db_session: Session, email: str) -> User:
    found = UserRepository(db_session).get_by_email(email)
    assert found is not None
    return found


def local_day(instant: datetime) -> date:
    return SCHEDULE.local_date(instant)


def overdue_without_checkin(db_session: Session, now: datetime) -> list[Reservation]:
    """O que a liberação por não comparecimento transformaria na próxima leitura."""
    return [
        r
        for r in all_reservations(db_session)
        if r.status is ReservationStatus.CONFIRMADA
        and r.checkin_em is None
        and r.inicio + TOLERANCE <= now
    ]


@pytest.mark.usefixtures("catalog")
def test_creates_live_accounts_and_fictitious_people(db_session: Session) -> None:
    result = run(db_session)

    assert (result.contas_criadas, result.contas_redefinidas, result.pessoas_criadas) == (3, 0, 12)
    for person in demo_data.ACCOUNTS:
        account = user(db_session, person.email)
        assert (account.nome, account.perfil, account.ativo) == (person.nome, person.perfil, True)
        assert account.aceite_termos_em is not None
        assert FAST_HASHER.verify(SENHA, account.senha_hash)
    for person in demo_data.PEOPLE:
        someone = user(db_session, person.email)
        assert someone.perfil in {UserRole.ALUNO, UserRole.PROFESSOR}
        assert someone.aceite_termos_em is not None
        assert not FAST_HASHER.verify(SENHA, someone.senha_hash)


@pytest.mark.usefixtures("catalog")
def test_resets_password_and_reactivates_existing_account(
    db_session: Session, make_user: Callable[..., User]
) -> None:
    existing = make_user(
        email="aluno.demo@umj.edu.br", senha="Antiga123", nome="Outro Nome", ativo=False
    )

    result = run(db_session)

    assert (result.contas_criadas, result.contas_redefinidas) == (2, 1)
    assert (existing.nome, existing.ativo) == ("Lucas Andrade", True)
    assert existing.aceite_termos_em is not None
    assert FAST_HASHER.verify(SENHA, existing.senha_hash)


@pytest.mark.usefixtures("catalog")
def test_running_twice_recreates_the_same_scenario(db_session: Session) -> None:
    first = run(db_session)
    users, reservations = count(db_session, User), count(db_session, Reservation)

    second = run(db_session)

    assert first.reservas == reservations > 0
    assert (second.contas_criadas, second.contas_redefinidas, second.pessoas_criadas) == (0, 3, 0)
    assert second.reservas_removidas == first.reservas
    assert second.reservas_por_status == first.reservas_por_status
    assert (count(db_session, User), count(db_session, Reservation)) == (users, reservations)
    assert all(DEMO_CODE.match(r.codigo) for r in all_reservations(db_session))


@pytest.mark.usefixtures("catalog")
def test_never_deletes_real_reservations(
    db_session: Session, make_user: Callable[..., User]
) -> None:
    owner = make_user(email="real@umj.edu.br")
    sala = resource(db_session, "Bloco A", "Sala de estudo 101")
    tomorrow = TUESDAY + timedelta(days=1)
    real = [
        # Começa com EDU-D, mas é um código real (o alfabeto real não tem 0).
        Reservation(
            codigo="EDU-D23456",
            recurso=sala,
            usuario_id=owner.id,
            inicio=SCHEDULE.at(TUESDAY, time(14)),
            fim=SCHEDULE.at(TUESDAY, time(16)),
            checkin_em=SCHEDULE.at(TUESDAY, time(14)),
        ),
        Reservation(
            codigo="EDU-ABCDEF",
            recurso=sala,
            usuario_id=owner.id,
            inicio=SCHEDULE.at(tomorrow, time(14)),
            fim=SCHEDULE.at(tomorrow, time(16)),
        ),
    ]
    db_session.add_all(real)
    db_session.flush()

    run(db_session)
    run(db_session)

    codes = {r.codigo for r in all_reservations(db_session)}
    assert {"EDU-D23456", "EDU-ABCDEF"} <= codes
    # Lucas não ganhou a 101 amanhã às 14h, que já era de outra pessoa: foi para a sala seguinte.
    lucas = user(db_session, demo_data.LUCAS.email)
    lucas_tomorrow = [
        r
        for r in all_reservations(db_session)
        if r.usuario_id == lucas.id and local_day(r.inicio) == tomorrow
    ]
    assert [r.recurso.nome for r in lucas_tomorrow] == ["Sala de estudo 202"]


@pytest.mark.usefixtures("catalog")
def test_confirmed_reservations_never_overlap_and_fit_the_schedule(db_session: Session) -> None:
    result = run(db_session, plan=FULL)

    reservations = all_reservations(db_session)
    assert len(reservations) == result.reservas > 1000
    by_resource: dict[int, list[Reservation]] = {}
    for r in reservations:
        assert SCHEDULE.within_opening_hours(r.inicio, r.fim)
        assert SCHEDULE.is_aligned(r.inicio)
        assert SCHEDULE.is_aligned(r.fim)
        assert r.fim - r.inicio <= timedelta(hours=2)
        if r.status is ReservationStatus.CONFIRMADA:
            by_resource.setdefault(r.recurso_id, []).append(r)
    for confirmed in by_resource.values():
        for before, after in pairwise(confirmed):
            assert before.fim <= after.inicio
    days = {local_day(r.inicio) for r in reservations}
    assert min(days) >= TUESDAY - timedelta(weeks=4)
    assert max(days) <= TUESDAY + timedelta(days=7)
    # Só recursos do catálogo do seed; o domingo fechado nunca aparece.
    assert all(day.weekday() != 6 for day in days)


@pytest.mark.usefixtures("catalog")
def test_keeps_live_demo_rooms_free_today(db_session: Session) -> None:
    run(db_session)

    today = [r for r in all_reservations(db_session) if local_day(r.inicio) == TUESDAY]
    room_204 = resource(db_session, "Bloco A", "Sala de estudo 204")
    room_203 = resource(db_session, "Bloco B", "Sala de estudo 203")
    evening = (SCHEDULE.at(TUESDAY, time(19)), SCHEDULE.at(TUESDAY, time(21)))

    assert not [r for r in today if r.recurso_id == room_203.id]
    in_204 = [r for r in today if r.recurso_id == room_204.id]
    assert not [r for r in in_204 if r.inicio < evening[1] and r.fim > evening[0]]
    neighbour = [r for r in in_204 if r.inicio == SCHEDULE.at(TUESDAY, time(18))]
    assert len(neighbour) == 1
    assert neighbour[0].fim == evening[0]
    assert neighbour[0].status is ReservationStatus.CONFIRMADA
    demo_accounts = {user(db_session, p.email).id for p in demo_data.ACCOUNTS}
    assert neighbour[0].usuario_id not in demo_accounts
    # As outras salas com projetor estão ocupadas à noite: a busca só devolve a 203 do Bloco B.
    for nome in ("Sala de estudo 201", "Sala de estudo 202"):
        room = resource(db_session, "Bloco B", nome)
        assert any(
            r.recurso_id == room.id
            and r.status is ReservationStatus.CONFIRMADA
            and r.inicio < evening[1]
            and r.fim > evening[0]
            for r in today
        )
    # Ocupação em vários recursos agora, para a grade e o quadro mostrarem "Ocupado".
    now_busy = {
        r.recurso_id
        for r in today
        if r.status is ReservationStatus.CONFIRMADA
        and r.checkin_em is not None
        and r.inicio <= TUESDAY_15H < r.fim
    }
    assert len(now_busy) >= 5


@pytest.mark.parametrize("now", [TUESDAY_15H, SATURDAY_10H], ids=["terca", "sabado"])
@pytest.mark.usefixtures("catalog")
def test_only_the_maker_reservation_is_overdue_without_checkin(
    db_session: Session, now: datetime
) -> None:
    run(db_session, now=now)

    overdue = overdue_without_checkin(db_session, now)

    assert len(overdue) == 1
    maker = overdue[0]
    assert maker.recurso.nome == "Laboratório Maker"
    assert maker.fim > now
    assert maker.inicio + TOLERANCE < now
    demo_accounts = {user(db_session, p.email).id for p in demo_data.ACCOUNTS}
    assert maker.usuario_id not in demo_accounts


@pytest.mark.parametrize("now", [SUNDAY_10H, TUESDAY_22H], ids=["domingo", "terca-noite"])
@pytest.mark.usefixtures("catalog")
def test_nothing_is_overdue_when_the_campus_is_closed(db_session: Session, now: datetime) -> None:
    result = run(db_session, now=now)

    assert result.reservas > 0
    assert overdue_without_checkin(db_session, now) == []


@pytest.mark.parametrize(
    ("now", "next_day"),
    [(TUESDAY_15H, date(2030, 10, 23)), (SATURDAY_10H, date(2030, 10, 28))],
    ids=["terca", "sabado"],
)
@pytest.mark.usefixtures("catalog")
def test_lucas_has_a_next_reservation_and_room_to_book_live(
    db_session: Session, now: datetime, next_day: date
) -> None:
    run(db_session, now=now)

    lucas = user(db_session, demo_data.LUCAS.email)
    marina = user(db_session, demo_data.MARINA.email)
    reservations = ReservationRepository(db_session)
    future = [
        r
        for r in all_reservations(db_session)
        if r.usuario_id == lucas.id and r.status is ReservationStatus.CONFIRMADA and r.fim > now
    ]
    assert 1 <= len(future) <= 2
    assert reservations.count_active_for_user(lucas.id, now) == len(future)
    assert local_day(future[0].inicio) == next_day
    assert all(r.checkin_em is None for r in future)
    assert reservations.count_active_for_user(marina.id, now) >= 1


@pytest.mark.usefixtures("catalog")
def test_history_has_attendance_no_shows_and_cancellations(db_session: Session) -> None:
    run(db_session, plan=FULL)

    start_of_today = SCHEDULE.at(TUESDAY, time())
    history = [r for r in all_reservations(db_session) if r.fim <= start_of_today]
    statuses = Counter(r.status for r in history)
    total = len(history)
    assert statuses[ReservationStatus.CONFIRMADA] / total > 0.75
    assert 0.03 < statuses[ReservationStatus.NAO_COMPARECEU] / total < 0.13
    assert 0.03 < statuses[ReservationStatus.CANCELADA] / total < 0.12
    for r in history:
        if r.status is ReservationStatus.CONFIRMADA:
            assert r.checkin_em is not None
            assert r.inicio - TOLERANCE <= r.checkin_em <= r.inicio + TOLERANCE
        elif r.status is ReservationStatus.NAO_COMPARECEU:
            assert (r.liberada_em, r.checkin_em) == (r.inicio + TOLERANCE, None)
        else:
            assert r.cancelada_em == r.inicio - timedelta(days=1)
            assert r.cancelada_por_id == r.usuario_id

    lucas = user(db_session, demo_data.LUCAS.email)
    lucas_history = {r.status for r in history if r.usuario_id == lucas.id}
    assert lucas_history == set(ReservationStatus)


@pytest.mark.usefixtures("catalog")
def test_history_follows_the_campus_rhythm(db_session: Session) -> None:
    run(db_session, plan=FULL)

    start_of_today = SCHEDULE.at(TUESDAY, time())
    history = [r for r in all_reservations(db_session) if r.fim <= start_of_today]

    # Meias horas ocupadas por tipo, hora local e dia da semana (o que o mapa de calor soma).
    occupied: Counter[tuple[ResourceType, int, int]] = Counter()
    for r in history:
        moment = r.inicio
        while moment < r.fim:
            local = moment.astimezone(MACEIO)
            occupied[r.recurso.tipo, local.weekday(), local.hour] += 1
            moment += timedelta(minutes=30)

    def per_hour(tipos: Iterable[ResourceType], hours: range, weekdays: range = range(5)) -> float:
        total = sum(occupied[t, d, h] for t in tipos for d in weekdays for h in hours)
        return total / len(hours)

    every = list(ResourceType)
    morning, afternoon, night = range(8, 12), range(14, 17), range(19, 21)
    # Picos da tarde e da noite bem acima da manhã.
    assert per_hour(every, afternoon) > 2 * per_hour(every, morning)
    assert per_hour(every, night) > 2 * per_hour(every, morning)
    # Laboratórios mais cheios à tarde, salas de estudo à noite.
    lab, sala = [ResourceType.LABORATORIO], [ResourceType.SALA_ESTUDO]
    assert per_hour(lab, afternoon) > 1.5 * per_hour(lab, night)
    assert per_hour(sala, night) > 1.2 * per_hour(sala, afternoon)
    # Sábado fraco: a manhã de sábado (4 dias) bem abaixo da manhã dos dias úteis (20 dias).
    assert per_hour(every, morning, range(5, 6)) / 4 < per_hour(every, morning) / 20 / 2


@pytest.mark.parametrize("senha", [None, SecretStr("")], ids=["ausente", "vazia"])
def test_demo_script_requires_password(
    settings: Settings, caplog: pytest.LogCaptureFixture, senha: SecretStr | None
) -> None:
    caplog.set_level(logging.ERROR)

    assert seed_demo(settings.model_copy(update={"seed_demo_password": senha})) == 1
    assert "SEED_DEMO_SENHA" in caplog.text
