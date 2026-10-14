"""Os valores dos enums são contrato: aparecem nas constraints CHECK do banco e na API."""

from app.core.enums import CheckinSituation, ReservationStatus, ResourceType, UserRole


def test_user_roles() -> None:
    assert [role.value for role in UserRole] == ["ALUNO", "PROFESSOR", "ADMIN"]


def test_resource_types() -> None:
    assert [kind.value for kind in ResourceType] == [
        "SALA_ESTUDO",
        "LABORATORIO",
        "AUDITORIO",
        "EQUIPAMENTO",
    ]


def test_reservation_statuses() -> None:
    assert [status.value for status in ReservationStatus] == [
        "CONFIRMADA",
        "CANCELADA",
        "NAO_COMPARECEU",
    ]
    assert ReservationStatus.CONFIRMADA == "CONFIRMADA"


def test_checkin_situations() -> None:
    assert [situation.value for situation in CheckinSituation] == [
        "DISPONIVEL",
        "FEITO",
        "CEDO",
        "LIBERADA",
        "SEM_RESERVA",
    ]
