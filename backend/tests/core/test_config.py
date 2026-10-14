from datetime import time, timedelta
from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.opening_hours import DayHours
from app.core.reservation_rules import ReservationRules

REQUIRED: dict[str, Any] = {
    "database_url": "postgresql+psycopg://user:pass@localhost:5433/eduspace",
    "jwt_secret": "segredo-de-teste-com-pelo-menos-32-bytes",
    "allowed_email_domains": "umj.edu.br",
}


def build(**overrides: Any) -> Settings:
    return Settings(_env_file=None, **{**REQUIRED, **overrides})


def test_comma_separated_lists_are_split_and_normalized() -> None:
    settings = build(
        allowed_email_domains=" umj.edu.br, @Aluno.UMJ.edu.br ,",
        cors_origins="http://localhost:5173,https://eduspace.vercel.app",
    )

    assert settings.allowed_email_domains == ["umj.edu.br", "aluno.umj.edu.br"]
    assert settings.cors_origins == ["http://localhost:5173", "https://eduspace.vercel.app"]


def test_defaults_match_campus_rules() -> None:
    settings = build()

    assert settings.display_timezone == "America/Maceio"
    assert settings.timezone.key == "America/Maceio"
    weekday = DayHours(time(8, 0), time(21, 0))
    assert dict(settings.weekly_hours) == {
        **dict.fromkeys(range(5), weekday),
        5: DayHours(time(8, 0), time(12, 0)),
    }
    assert settings.jwt_expires_minutes == 480


def test_reads_portuguese_environment_names(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TZ_EXIBICAO", "America/Recife")
    monkeypatch.setenv("HORARIO_FUNCIONAMENTO", "seg-sex 07:30-22:00")

    settings = build()

    assert settings.display_timezone == "America/Recife"
    assert settings.weekly_hours[0] == DayHours(time(7, 30), time(22, 0))
    assert 5 not in settings.weekly_hours


def test_rejects_unknown_timezone() -> None:
    with pytest.raises(ValidationError, match="Fuso horário desconhecido"):
        build(display_timezone="Marte/Base")


@pytest.mark.parametrize(
    ("value", "reason"),
    [
        ("seg-sex 21:00-08:00", "fechamento precisa ser depois"),
        ("seg-sex 08:15-21:00", ":00 ou :30"),
        ("seg-sex 8h-21h", "Grupo inválido"),
        ("seg-xyz 08:00-21:00", "Dia desconhecido"),
        ("sex-seg 08:00-21:00", "invertido"),
        ("seg-sex 08:00-21:00; sex 08:00-12:00", "mais de uma vez"),
        ("seg 25:00-26:00", "Horário inválido"),
        (" ; ", "ao menos um dia"),
    ],
)
def test_rejects_invalid_opening_hours(value: str, reason: str) -> None:
    with pytest.raises(ValidationError, match=reason):
        build(opening_hours=value)


def test_opening_hours_accept_day_lists() -> None:
    hours = build(opening_hours="SEG,qua  09:00-12:00").weekly_hours

    assert sorted(hours) == [0, 2]


def test_empty_domain_list_means_open_signup() -> None:
    assert build(allowed_email_domains="").allowed_email_domains == []


def test_requires_strong_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        build(jwt_secret="curto")


def test_secret_is_not_exposed_in_repr() -> None:
    assert "segredo-de-teste-com-pelo-menos-32-bytes" not in repr(build())


def test_get_settings_reads_environment_once(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", REQUIRED["database_url"])
    monkeypatch.setenv("JWT_SECRET", REQUIRED["jwt_secret"])
    monkeypatch.setenv("ALLOWED_EMAIL_DOMAINS", "umj.edu.br")
    get_settings.cache_clear()
    try:
        assert get_settings() is get_settings()
    finally:
        get_settings.cache_clear()


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        # Formato que Neon, Render e Heroku entregam: o SQLAlchemy precisa do driver explícito.
        (
            "postgresql://u:p@ep-x.us-east-1.aws.neon.tech/eduspace?sslmode=require",
            "postgresql+psycopg://u:p@ep-x.us-east-1.aws.neon.tech/eduspace?sslmode=require",
        ),
        ("postgres://u:p@db:5432/eduspace", "postgresql+psycopg://u:p@db:5432/eduspace"),
        (
            "postgresql+psycopg://u:p@localhost:5433/eduspace",
            "postgresql+psycopg://u:p@localhost:5433/eduspace",
        ),
    ],
)
def test_database_url_gets_the_psycopg_driver(given: str, expected: str) -> None:
    assert build(database_url=given).database_url == expected


def test_check_in_window_defaults_and_portuguese_names(monkeypatch: pytest.MonkeyPatch) -> None:
    default = ReservationRules.from_settings(build())
    monkeypatch.setenv("CHECKIN_TOLERANCIA_MIN", "0")
    monkeypatch.setenv("CHECKIN_ANTECEDENCIA_MIN", "10")
    disabled = ReservationRules.from_settings(build())

    assert (default.checkin_tolerance, default.checkin_lead) == (
        timedelta(minutes=15),
        timedelta(minutes=15),
    )
    assert default.checkin_required
    assert (disabled.checkin_tolerance, disabled.checkin_lead) == (
        timedelta(0),
        timedelta(minutes=10),
    )
    assert not disabled.checkin_required


@pytest.mark.parametrize("field", ["checkin_tolerance_minutes", "checkin_lead_minutes"])
def test_rejects_negative_check_in_minutes(field: str) -> None:
    with pytest.raises(ValidationError):
        build(**{field: -1})
