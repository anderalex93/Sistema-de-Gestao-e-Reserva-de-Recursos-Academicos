import re
from collections.abc import Callable, Iterator, Sequence
from datetime import UTC, date, datetime, time
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy.orm import Session

from app.core.campus_schedule import CampusSchedule
from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.core.exceptions import DomainError, NotFoundError
from app.core.opening_hours import DEFAULT_OPENING_HOURS, parse_weekly_hours
from app.core.reservation_codes import ALPHABET, CodeGenerator, RandomCodeGenerator
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.reservation import ReservationCreate
from app.services.reservation_service import ReservationConflictError, ReservationService
from tests.conftest import FixedClock

MACEIO = ZoneInfo("America/Maceio")
SCHEDULE = CampusSchedule(MACEIO, parse_weekly_hours(DEFAULT_OPENING_HOURS))
WEDNESDAY = date(2030, 10, 23)
NOW = datetime(2030, 10, 22, 12, 0, tzinfo=UTC)


def at(hour: int, minute: int = 0, day: date = WEDNESDAY) -> datetime:
    return datetime.combine(day, time(hour, minute), tzinfo=MACEIO)


class SequenceCodes:
    """Gerador previsível para testar colisões de código."""

    def __init__(self, codes: Sequence[str]) -> None:
        self._codes: Iterator[str] = iter(codes)

    def new(self) -> str:
        return next(self._codes)


@pytest.fixture
def campus(db_session: Session) -> dict[str, Resource]:
    bloco = Building(nome="Bloco A")
    resources = {
        "sala": Resource(bloco=bloco, nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4),
        "projetor": Resource(bloco=bloco, nome="Projetor 1", tipo=ResourceType.EQUIPAMENTO),
    }
    db_session.add_all(resources.values())
    db_session.flush()
    return resources


@pytest.fixture
def lucas(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br")


def build_service(
    db_session: Session, codes: CodeGenerator | None = None, now: datetime = NOW
) -> ReservationService:
    return ReservationService(
        resources=ResourceRepository(db_session),
        reservations=ReservationRepository(db_session),
        uow=UnitOfWork(db_session),
        schedule=SCHEDULE,
        clock=FixedClock(now),
        codes=codes or RandomCodeGenerator(),
    )


@pytest.fixture
def service(db_session: Session) -> ReservationService:
    return build_service(db_session)


def request(
    resource: Resource, start: datetime, end: datetime, **extra: object
) -> ReservationCreate:
    return ReservationCreate.model_validate(
        {"recurso_id": resource.id, "inicio": start, "fim": end, **extra}
    )


def test_creates_a_confirmed_reservation_with_a_readable_code(
    service: ReservationService, campus: dict[str, Resource], lucas: User
) -> None:
    reservation = service.create(
        request(
            campus["sala"], at(19), at(21), finalidade=" Estudo de cálculo ", qtd_participantes=4
        ),
        lucas,
    )

    assert reservation.id is not None
    assert reservation.status is ReservationStatus.CONFIRMADA
    assert re.fullmatch(f"EDU-[{ALPHABET}]{{6}}", reservation.codigo)
    assert reservation.finalidade == "Estudo de cálculo"
    assert (reservation.usuario_id, reservation.recurso.nome) == (lucas.id, "Sala 1")


@pytest.mark.parametrize(
    ("interval", "code"),
    [
        pytest.param(
            (at(10, day=date(2030, 10, 21)), at(11, day=date(2030, 10, 21))),
            "INTERVALO_NO_PASSADO",
            id="passado",
        ),
        pytest.param((at(19, 15), at(20)), "HORARIO_FORA_DA_GRADE", id="minuto quebrado"),
        pytest.param((at(19), at(20, 10)), "HORARIO_FORA_DA_GRADE", id="fim quebrado"),
        pytest.param((at(7, 30), at(8, 30)), "FORA_DO_FUNCIONAMENTO", id="antes de abrir"),
        pytest.param((at(20, 30), at(21, 30)), "FORA_DO_FUNCIONAMENTO", id="depois de fechar"),
        pytest.param(
            (at(11, day=date(2030, 10, 26)), at(13, day=date(2030, 10, 26))),
            "FORA_DO_FUNCIONAMENTO",
            id="sábado à tarde",
        ),
        pytest.param(
            (at(9, day=date(2030, 10, 27)), at(10, day=date(2030, 10, 27))),
            "FORA_DO_FUNCIONAMENTO",
            id="domingo",
        ),
    ],
)
def test_rejects_intervals_outside_the_rules(
    service: ReservationService,
    campus: dict[str, Resource],
    lucas: User,
    interval: tuple[datetime, datetime],
    code: str,
) -> None:
    with pytest.raises(DomainError) as error:
        service.create(request(campus["sala"], *interval), lucas)

    assert error.value.code == code


def test_participants_cannot_exceed_capacity_but_equipment_has_none(
    service: ReservationService, campus: dict[str, Resource], lucas: User
) -> None:
    with pytest.raises(DomainError, match="capacidade"):
        service.create(request(campus["sala"], at(9), at(10), qtd_participantes=5), lucas)

    assert service.create(request(campus["projetor"], at(9), at(10), qtd_participantes=50), lucas)


def test_inactive_resource_is_not_found(
    service: ReservationService, campus: dict[str, Resource], lucas: User
) -> None:
    campus["sala"].ativo = False

    with pytest.raises(NotFoundError):
        service.create(request(campus["sala"], at(9), at(10)), lucas)


@pytest.mark.parametrize(
    ("interval", "conflict"),
    [
        pytest.param((at(19, 30), at(20, 30)), True, id="sobreposição parcial"),
        pytest.param((at(18), at(21)), True, id="cobre a existente"),
        pytest.param((at(20), at(21)), False, id="adjacente depois"),
        pytest.param((at(18), at(19)), False, id="adjacente antes"),
    ],
)
def test_overlap_rules(
    service: ReservationService,
    campus: dict[str, Resource],
    lucas: User,
    interval: tuple[datetime, datetime],
    conflict: bool,
) -> None:
    service.create(request(campus["sala"], at(19), at(20)), lucas)

    if conflict:
        with pytest.raises(ReservationConflictError):
            service.create(request(campus["sala"], *interval), lucas)
    else:
        assert service.create(request(campus["sala"], *interval), lucas)


def test_cancelled_reservation_does_not_block(
    service: ReservationService, campus: dict[str, Resource], lucas: User, db_session: Session
) -> None:
    first = service.create(request(campus["sala"], at(19), at(20)), lucas)
    first.status = ReservationStatus.CANCELADA
    first.cancelada_em = NOW
    db_session.flush()

    assert service.create(request(campus["sala"], at(19), at(20)), lucas)


def test_the_database_constraint_wins_a_race(
    db_session: Session,
    campus: dict[str, Resource],
    lucas: User,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Se a consulta prévia não vê a outra reserva (corrida), a constraint barra e vira 409."""
    service = build_service(db_session)
    service.create(request(campus["sala"], at(19), at(20)), lucas)
    monkeypatch.setattr(ReservationRepository, "confirmed_overlapping", lambda *_: [])

    with pytest.raises(ReservationConflictError):
        service.create(request(campus["sala"], at(19, 30), at(20, 30)), lucas)

    # A sessão continua utilizável depois da falha.
    assert service.create(request(campus["sala"], at(20, 30), at(21)), lucas)


def test_retries_when_the_code_already_exists(
    db_session: Session, campus: dict[str, Resource], lucas: User
) -> None:
    service = build_service(db_session, SequenceCodes(["EDU-AAAAAA", "EDU-AAAAAA", "EDU-BBBBBB"]))
    service.create(request(campus["sala"], at(9), at(10)), lucas)

    second = service.create(request(campus["sala"], at(10), at(11)), lucas)

    assert second.codigo == "EDU-BBBBBB"


def test_only_owner_and_admin_see_a_reservation(
    service: ReservationService,
    campus: dict[str, Resource],
    lucas: User,
    make_user: Callable[..., User],
) -> None:
    reservation = service.create(request(campus["sala"], at(9), at(10)), lucas)
    admin = make_user(email="admin@umj.edu.br", perfil=UserRole.ADMIN)
    other = make_user(email="ana@umj.edu.br")

    assert service.get_for(reservation.id, lucas) is reservation
    assert service.get_for(reservation.id, admin) is reservation
    with pytest.raises(NotFoundError):
        service.get_for(reservation.id, other)
    with pytest.raises(NotFoundError):
        service.get_for(999_999, admin)
