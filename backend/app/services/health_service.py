import logging

from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import ServiceUnavailableError
from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthRead

logger = logging.getLogger(__name__)


class DatabaseUnavailableError(ServiceUnavailableError):
    code = "BANCO_INDISPONIVEL"
    default_detail = "O banco de dados não respondeu. Tente novamente em instantes."


class HealthService:
    def __init__(self, repository: HealthRepository) -> None:
        self._repository = repository

    def check(self) -> HealthRead:
        try:
            self._repository.ping()
        except SQLAlchemyError as exc:
            logger.warning("Health check failed: %s", type(exc).__name__)
            raise DatabaseUnavailableError from exc
        return HealthRead(status="ok", db="ok")
