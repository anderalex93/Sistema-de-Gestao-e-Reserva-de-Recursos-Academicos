from sqlalchemy import text
from sqlalchemy.orm import Session


class HealthRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def ping(self) -> None:
        """Executa `SELECT 1`. Propaga o erro do driver se o banco não responder."""
        self._session.execute(text("SELECT 1"))
