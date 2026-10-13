from datetime import time
from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings

REQUIRED: dict[str, Any] = {
    "database_url": "postgresql+psycopg://user:pass@localhost:5433/eduspace",
    "jwt_secret": "segredo-de-teste",
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
    assert (settings.opening_time, settings.closing_time) == (time(7, 0), time(22, 0))
    assert settings.jwt_expires_minutes == 480


def test_reads_portuguese_environment_names(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TZ_EXIBICAO", "America/Recife")
    monkeypatch.setenv("HORARIO_ABERTURA", "08:00")

    settings = build()

    assert settings.display_timezone == "America/Recife"
    assert settings.opening_time == time(8, 0)


def test_rejects_unknown_timezone() -> None:
    with pytest.raises(ValidationError, match="Fuso horário desconhecido"):
        build(display_timezone="Marte/Base")


def test_rejects_closing_before_opening() -> None:
    with pytest.raises(ValidationError, match="HORARIO_FECHAMENTO"):
        build(opening_time=time(22, 0), closing_time=time(7, 0))


def test_requires_at_least_one_email_domain() -> None:
    with pytest.raises(ValidationError):
        build(allowed_email_domains="")


def test_secret_is_not_exposed_in_repr() -> None:
    assert "segredo-de-teste" not in repr(build())


def test_get_settings_reads_environment_once(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", REQUIRED["database_url"])
    monkeypatch.setenv("JWT_SECRET", REQUIRED["jwt_secret"])
    monkeypatch.setenv("ALLOWED_EMAIL_DOMAINS", "umj.edu.br")
    get_settings.cache_clear()
    try:
        assert get_settings() is get_settings()
    finally:
        get_settings.cache_clear()
