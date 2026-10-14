"""Painel de ocupação (#44): horas disponíveis e reservadas recortadas ao período e ao
funcionamento, contagens por status, mapa de calor por dia da semana e hora, filtro por bloco
e validação do período, com relógio fixo e um cenário conhecido.

Campus padrão: seg-sex 08:00-21:00 (13 h), sáb 08:00-12:00 (4 h), domingo fechado. Semana do
cenário: segunda 21/10/2030 a domingo 27/10/2030, 69 h por recurso.
"""

from collections.abc import Callable
from datetime import UTC, date, datetime, time, timedelta
from itertools import count

import pytest
from sqlalchemy.orm import Session

from app.core.campus_schedule import CampusSchedule
from app.core.enums import ReservationStatus, ResourceType, UserRole
from app.core.opening_hours import parse_weekly_hours
from app.models.building import Building
from app.models.reservation import Reservation
from app.models.resource import Resource
from app.models.user import User
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.occupancy import OccupancyParams, OccupancyRead
from app.services.occupancy_csv_writer import OccupancyCsvWriter
from app.services.occupancy_service import InvalidPeriodError, OccupancyService
from tests.conftest import FixedClock
from tests.services.test_reservation_service import MACEIO, SCHEDULE

MONDAY = date(2030, 10, 21)
SUNDAY = MONDAY + timedelta(days=6)
WEEK = OccupancyParams(inicio=MONDAY, fim=SUNDAY)
# Sábado 08:55: o fim de semana do cenário ainda está por vir.
NOW = datetime(2030, 10, 26, 8, 55, tzinfo=MACEIO)


def at(weekday: int, hour: int, minute: int = 0) -> datetime:
    """`weekday` ISO (1 = segunda) dentro da semana do cenário, no fuso do campus."""
    day = MONDAY + timedelta(days=weekday - 1)
    return datetime.combine(day, time(hour, minute), tzinfo=MACEIO)


def build(
    db_session: Session, now: datetime = NOW, schedule: CampusSchedule = SCHEDULE
) -> OccupancyService:
    return OccupancyService(
        resources=ResourceRepository(db_session),
        reservations=ReservationRepository(db_session),
        schedule=schedule,
        clock=FixedClock(now.astimezone(UTC)),
        csv_writer=OccupancyCsvWriter(),
    )


@pytest.fixture
def campus(db_session: Session) -> dict[str, Resource]:
    bloco_a, bloco_b = Building(nome="Bloco A"), Building(nome="Bloco B")
    inactive = Building(nome="Bloco Fechado", ativo=False)
    resources = {
        "sala": Resource(bloco=bloco_a, nome="Sala 1", tipo=ResourceType.SALA_ESTUDO, capacidade=4),
        "lab": Resource(bloco=bloco_a, nome="Lab 1", tipo=ResourceType.LABORATORIO, capacidade=20),
        "sala_b": Resource(
            bloco=bloco_b, nome="Sala B", tipo=ResourceType.SALA_ESTUDO, capacidade=6
        ),
        "inativa": Resource(
            bloco=bloco_a,
            nome="Sala Inativa",
            tipo=ResourceType.SALA_ESTUDO,
            capacidade=4,
            ativo=False,
        ),
        "bloco_fechado": Resource(
            bloco=inactive, nome="Sala X", tipo=ResourceType.SALA_ESTUDO, capacidade=4
        ),
    }
    db_session.add_all(resources.values())
    db_session.flush()
    return resources


@pytest.fixture
def lucas(make_user: Callable[..., User]) -> User:
    return make_user(email="lucas@umj.edu.br", perfil=UserRole.ALUNO)


@pytest.fixture
def add(db_session: Session, lucas: User) -> Callable[..., Reservation]:
    codes = count(1)

    def factory(
        resource: Resource,
        start: datetime,
        end: datetime,
        *,
        status: ReservationStatus = ReservationStatus.CONFIRMADA,
        checkin_em: datetime | None = None,
        liberada_em: datetime | None = None,
    ) -> Reservation:
        reservation = Reservation(
            codigo=f"EDU-O{next(codes):05d}",
            recurso=resource,
            usuario_id=lucas.id,
            inicio=start,
            fim=end,
            status=status,
            checkin_em=checkin_em,
            cancelada_em=start - timedelta(days=1)
            if status is ReservationStatus.CANCELADA
            else None,
            liberada_em=liberada_em,
        )
        db_session.add(reservation)
        db_session.flush()
        return reservation

    return factory


@pytest.fixture
def week(campus: dict[str, Resource], add: Callable[..., Reservation]) -> None:
    sala, lab, sala_b = campus["sala"], campus["lab"], campus["sala_b"]
    # Quarta 14:00-15:30 com check-in: atravessa a hora (60 min às 14h, 30 min às 15h).
    add(sala, at(3, 14), at(3, 15, 30), checkin_em=at(3, 13, 55))
    # Segunda 20:30-21:00, na última meia hora do funcionamento.
    add(sala, at(1, 20, 30), at(1, 21))
    # Domingo anterior 23:00 até segunda 09:00 (fora da grade): só 08:00-09:00 de segunda conta,
    # e não começa no período, então não entra em `reservas`.
    add(sala, at(1, 23) - timedelta(days=1), at(1, 9))
    # Segunda seguinte: fora do período.
    add(sala, at(1, 10) + timedelta(days=7), at(1, 11) + timedelta(days=7))
    # Domingo (fechado): conta como reserva, mas não ocupa hora de funcionamento.
    add(sala, at(7, 10), at(7, 11))
    # Cancelada: só conta em `cancelamentos`.
    add(sala, at(3, 16), at(3, 17), status=ReservationStatus.CANCELADA)
    # Não compareceu: liberada 15 min depois do início, devolve 1h45.
    add(
        sala,
        at(4, 10),
        at(4, 12),
        status=ReservationStatus.NAO_COMPARECEU,
        liberada_em=at(4, 10, 15),
    )
    # Sábado 09:00, com check-in às 08:50, mas ainda não começou (agora é 08:55).
    add(sala, at(6, 9), at(6, 10), checkin_em=at(6, 8, 50))
    add(lab, at(3, 14), at(3, 15))
    add(sala_b, at(1, 8), at(1, 12), checkin_em=at(1, 8))
    # Recursos fora do painel: inativo e em bloco desativado.
    add(campus["inativa"], at(3, 8), at(3, 21))
    add(campus["bloco_fechado"], at(3, 8), at(3, 21))


def cell(report: OccupancyRead, weekday: int, hour: int) -> float | None:
    return next(
        (c.taxa for c in report.mapa_calor if (c.dia_semana, c.hora) == (weekday, hour)), None
    )


@pytest.mark.usefixtures("week")
def test_summary_counts_only_confirmed_hours_inside_period_and_opening(
    db_session: Session,
) -> None:
    report = build(db_session).report(WEEK)

    assert (report.periodo.inicio, report.periodo.fim) == (MONDAY, SUNDAY)
    summary = report.resumo
    # 3 recursos ativos x 69 h. Reservadas: sala 4 h, lab 1 h, sala B 4 h.
    assert summary.horas_disponiveis == 207.0
    assert summary.horas_reservadas == 9.0
    assert summary.taxa_ocupacao == 0.043
    assert (summary.reservas, summary.cancelamentos) == (7, 1)
    assert summary.taxa_cancelamento == 0.125
    assert (summary.checkins, summary.nao_comparecimentos) == (2, 1)
    assert summary.taxa_comparecimento == 0.667
    assert summary.horas_devolvidas == 1.8


@pytest.mark.usefixtures("week")
def test_resources_are_ordered_by_occupancy_then_name(
    db_session: Session, campus: dict[str, Resource]
) -> None:
    rows = build(db_session).report(WEEK).recursos

    assert [(r.nome, r.taxa_ocupacao) for r in rows] == [
        ("Sala 1", 0.058),
        ("Sala B", 0.058),
        ("Lab 1", 0.014),
    ]
    sala = rows[0]
    assert sala.id == campus["sala"].id
    assert (sala.tipo, sala.bloco) == (ResourceType.SALA_ESTUDO, "Bloco A")
    assert (sala.horas_disponiveis, sala.horas_reservadas) == (69.0, 4.0)
    assert (sala.reservas, sala.cancelamentos, sala.nao_comparecimentos) == (5, 1, 1)
    assert sala.horas_devolvidas == 1.8


@pytest.mark.usefixtures("week")
def test_heatmap_splits_reservations_by_local_hour_and_skips_closed_hours(
    db_session: Session,
) -> None:
    report = build(db_session).report(WEEK)

    # Seg-sex 08h-20h (13 células) e sábado 08h-11h (4): domingo e 21h não aparecem.
    assert len(report.mapa_calor) == 5 * 13 + 4
    assert {c.dia_semana for c in report.mapa_calor} == {1, 2, 3, 4, 5, 6}
    assert {c.hora for c in report.mapa_calor} == set(range(8, 21))
    assert cell(report, 7, 10) is None
    assert cell(report, 1, 21) is None
    # Quarta 14h: sala e lab (120 min) de 3 recursos x 60 min.
    assert cell(report, 3, 14) == 0.667
    assert cell(report, 3, 15) == 0.167
    # Segunda 08h: a parte recortada da madrugada e a sala B.
    assert cell(report, 1, 8) == 0.667
    assert cell(report, 1, 20) == 0.167
    # Cancelada e não comparecimento não ocupam.
    assert cell(report, 3, 16) == 0.0
    assert cell(report, 4, 10) == 0.0
    assert cell(report, 6, 9) == 0.333


def test_heatmap_counts_only_open_minutes_of_a_partial_hour(
    db_session: Session, campus: dict[str, Resource], add: Callable[..., Reservation]
) -> None:
    schedule = CampusSchedule(MACEIO, parse_weekly_hours("seg 08:30-10:00"))
    add(campus["sala"], at(1, 8, 30), at(1, 9))

    report = build(db_session, schedule=schedule).report(
        OccupancyParams(inicio=MONDAY, fim=MONDAY, bloco_id=campus["sala"].bloco_id)
    )

    # Bloco A: sala e lab. Às 8h o campus abre só 30 min.
    assert [(c.dia_semana, c.hora, c.taxa) for c in report.mapa_calor] == [
        (1, 8, 0.5),
        (1, 9, 0.0),
    ]
    assert report.resumo.horas_disponiveis == 3.0


@pytest.mark.usefixtures("week")
def test_building_filter_keeps_only_its_resources(
    db_session: Session, campus: dict[str, Resource]
) -> None:
    report = build(db_session).report(
        OccupancyParams(inicio=MONDAY, fim=SUNDAY, bloco_id=campus["sala_b"].bloco_id)
    )

    assert [r.nome for r in report.recursos] == ["Sala B"]
    assert (report.resumo.horas_disponiveis, report.resumo.horas_reservadas) == (69.0, 4.0)
    assert (report.resumo.reservas, report.resumo.checkins) == (1, 1)
    assert report.resumo.taxa_comparecimento == 1.0
    assert cell(report, 1, 8) == 1.0


def test_returned_hours_are_clipped_to_the_period(
    db_session: Session, campus: dict[str, Resource], add: Callable[..., Reservation]
) -> None:
    # Fora da grade, para atravessar a meia-noite do último dia: 23:15 até 01:00 = 1h45,
    # das quais 45 min dentro do período.
    add(
        campus["sala"],
        at(7, 23),
        at(7, 23) + timedelta(hours=2),
        status=ReservationStatus.NAO_COMPARECEU,
        liberada_em=at(7, 23, 15),
    )
    # Liberada depois de terminar (ninguém consultou a tempo): não devolveu nada.
    add(
        campus["lab"],
        at(5, 10),
        at(5, 11),
        status=ReservationStatus.NAO_COMPARECEU,
        liberada_em=at(5, 11, 30),
    )

    summary = build(db_session).report(WEEK).resumo

    assert summary.horas_devolvidas == 0.8  # 45 min
    assert summary.horas_reservadas == 0.0
    assert (summary.reservas, summary.nao_comparecimentos, summary.checkins) == (2, 2, 0)
    assert summary.taxa_comparecimento == 0.0


@pytest.mark.usefixtures("campus")
def test_attendance_rate_is_null_without_checkins_or_no_shows(db_session: Session) -> None:
    summary = build(db_session).report(WEEK).resumo

    assert summary.horas_disponiveis == 207.0
    assert (summary.horas_reservadas, summary.taxa_ocupacao) == (0.0, 0.0)
    assert (summary.reservas, summary.cancelamentos, summary.taxa_cancelamento) == (0, 0, 0.0)
    assert summary.taxa_comparecimento is None


def test_empty_campus_has_zero_rates(db_session: Session) -> None:
    report = build(db_session).report(WEEK)

    assert report.recursos == []
    assert report.resumo.horas_disponiveis == 0.0
    assert report.resumo.taxa_ocupacao == 0.0
    assert {c.taxa for c in report.mapa_calor} == {0.0}


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        pytest.param(OccupancyParams(), (date(2030, 9, 27), date(2030, 10, 26)), id="padrão"),
        pytest.param(
            OccupancyParams(fim=date(2030, 10, 10)),
            (date(2030, 9, 11), date(2030, 10, 10)),
            id="só fim",
        ),
        pytest.param(
            OccupancyParams(inicio=date(2030, 10, 20)),
            (date(2030, 10, 20), date(2030, 10, 26)),
            id="só início",
        ),
        pytest.param(
            OccupancyParams(inicio=date(2030, 8, 1), fim=date(2030, 10, 31)),
            (date(2030, 8, 1), date(2030, 10, 31)),
            id="92 dias",
        ),
        pytest.param(OccupancyParams(inicio=MONDAY, fim=MONDAY), (MONDAY, MONDAY), id="um dia"),
    ],
)
def test_default_period_is_the_last_30_days_until_today(
    db_session: Session, params: OccupancyParams, expected: tuple[date, date]
) -> None:
    period = build(db_session).report(params).periodo

    assert (period.inicio, period.fim) == expected


@pytest.mark.parametrize(
    ("params", "message"),
    [
        pytest.param(
            OccupancyParams(inicio=date(2030, 10, 22), fim=date(2030, 10, 21)),
            "anterior à final",
            id="fim antes do início",
        ),
        pytest.param(
            OccupancyParams(inicio=date(2030, 10, 27)), "anterior à final", id="início no futuro"
        ),
        pytest.param(
            OccupancyParams(inicio=date(2030, 8, 1), fim=date(2030, 11, 1)),
            "até 92 dias",
            id="93 dias",
        ),
    ],
)
def test_invalid_period_is_rejected(
    db_session: Session, params: OccupancyParams, message: str
) -> None:
    with pytest.raises(InvalidPeriodError, match=message) as error:
        build(db_session).report(params)

    assert error.value.code == "PERIODO_INVALIDO"
    assert error.value.status_code == 422


def test_early_end_returns_the_rest_of_the_original_slot(
    db_session: Session, campus: dict[str, Resource], add: Callable[..., Reservation]
) -> None:
    # Terça 10:00-12:00, encerrada às 10:10: ocupou até 10:30 e devolveu 1h30.
    ended = add(campus["sala"], at(2, 10), at(2, 12), checkin_em=at(2, 10))
    ended.fim, ended.fim_previsto, ended.encerrada_em = at(2, 10, 30), at(2, 12), at(2, 10, 10)
    # Começou na véspera do período; só os 30 min devolvidos depois da meia-noite contam.
    before = add(campus["lab"], at(1, 0) - timedelta(hours=1), at(1, 0) + timedelta(minutes=30))
    before.fim, before.fim_previsto = at(1, 0) - timedelta(minutes=30), before.fim
    before.encerrada_em = before.inicio
    db_session.flush()

    report = build(db_session).report(WEEK)

    summary = report.resumo
    assert summary.horas_reservadas == 0.5
    assert summary.horas_devolvidas == 2.0
    assert (summary.reservas, summary.checkins) == (1, 1)
    sala = next(r for r in report.recursos if r.id == campus["sala"].id)
    assert (sala.horas_reservadas, sala.horas_devolvidas) == (0.5, 1.5)
