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
    # Requisições acima disso vão para o log como lentas (RNF02: consultas em até 2 s).
    slow_request_ms: float = Field(default=500, gt=0, validation_alias="REQUISICAO_LENTA_MS")

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
    # Senha das contas sintéticas do seed de volume (#33). Sem ela, o seed de volume não roda.
    seed_volume_password: SecretStr | None = Field(
        default=None, validation_alias="SEED_VOLUME_SENHA"
    )

    display_timezone: str = Field(default="America/Maceio", validation_alias="TZ_EXIBICAO")
    # Formato em app/core/opening_hours.py. Dia ausente = fechado (padrão: domingo).
    opening_hours: str = Field(
        default=DEFAULT_OPENING_HOURS, validation_alias="HORARIO_FUNCIONAMENTO"
    )

    # Regras de uso (#28). Duração em múltiplos de 30 minutos.
    reservation_max_minutes: int = Field(
        default=240, ge=30, le=900, multiple_of=30, validation_alias="RESERVA_DURACAO_MAX_MIN"
    )
    reservation_max_days_ahead: int = Field(
        default=14, ge=1, le=365, validation_alias="RESERVA_ANTECEDENCIA_MAX_DIAS"
    )
    active_limit_student: int = Field(
        default=3, ge=1, le=100, validation_alias="RESERVAS_ATIVAS_MAX_ALUNO"
    )
    active_limit_teacher: int = Field(
        default=10, ge=1, le=100, validation_alias="RESERVAS_ATIVAS_MAX_PROFESSOR"
    )
    # Check-in por QR Code (#43). Tolerância 0 desliga o check-in obrigatório e a liberação.
    checkin_tolerance_minutes: int = Field(
        default=15, ge=0, le=120, validation_alias="CHECKIN_TOLERANCIA_MIN"
    )
    # A janela de check-in abre este tanto antes do início da reserva.
    checkin_lead_minutes: int = Field(
        default=15, ge=0, le=120, validation_alias="CHECKIN_ANTECEDENCIA_MIN"
    )

    @field_validator("database_url", "test_database_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str | None) -> str | None:
        """Neon e Render entregam `postgresql://`; o SQLAlchemy precisa do driver explícito."""
        if value is None:
            return None
        for scheme in ("postgresql://", "postgres://"):
            if value.startswith(scheme):
                return f"postgresql+psycopg://{value.removeprefix(scheme)}"
        return value

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
