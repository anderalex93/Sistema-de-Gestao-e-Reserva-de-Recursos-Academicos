"""Configuração da aplicação lida de variáveis de ambiente e do arquivo `.env`."""

from functools import lru_cache
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

from app.core.opening_hours import DEFAULT_OPENING_HOURS, WeeklyHours, parse_weekly_hours

CommaSeparated = Annotated[list[str], NoDecode]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        validate_by_name=True,
        validate_by_alias=True,
    )

    app_env: Literal["local", "test", "production"] = "local"
    log_level: str = "INFO"

    database_url: str
    test_database_url: str | None = None

    jwt_secret: SecretStr = Field(min_length=32)  # HS256 exige chave de 32+ bytes (RFC 7518)
    jwt_expires_minutes: int = Field(default=480, gt=0)
    rate_limit_enabled: bool = True

    # Vazio = cadastro aberto a qualquer e-mail. Preencha para restringir (ex.: "umj.edu.br").
    allowed_email_domains: CommaSeparated = Field(default_factory=list)
    cors_origins: CommaSeparated = Field(default_factory=list)

    seed_admin_name: str = Field(
        default="Administrador EduSpace", validation_alias="SEED_ADMIN_NOME"
    )
    seed_admin_email: str | None = Field(default=None, validation_alias="SEED_ADMIN_EMAIL")
    seed_admin_password: SecretStr | None = Field(default=None, validation_alias="SEED_ADMIN_SENHA")

    display_timezone: str = Field(default="America/Maceio", validation_alias="TZ_EXIBICAO")
    # Formato em app/core/opening_hours.py. Dia ausente = fechado (padrão: domingo).
    opening_hours: str = Field(
        default=DEFAULT_OPENING_HOURS, validation_alias="HORARIO_FUNCIONAMENTO"
    )

    @field_validator("allowed_email_domains", "cors_origins", mode="before")
    @classmethod
    def _split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("allowed_email_domains")
    @classmethod
    def _normalize_domains(cls, domains: list[str]) -> list[str]:
        return [domain.lower().removeprefix("@") for domain in domains]

    @field_validator("display_timezone")
    @classmethod
    def _validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            msg = f"Fuso horário desconhecido: {value}"
            raise ValueError(msg) from exc
        return value

    @field_validator("opening_hours")
    @classmethod
    def _validate_opening_hours(cls, value: str) -> str:
        try:
            parse_weekly_hours(value)
        except ValueError as exc:
            msg = f"HORARIO_FUNCIONAMENTO inválido: {exc}"
            raise ValueError(msg) from exc
        return value

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.display_timezone)

    @property
    def weekly_hours(self) -> WeeklyHours:
        return parse_weekly_hours(self.opening_hours)


@lru_cache
def get_settings() -> Settings:
    return Settings()
