from sqlalchemy.orm import Session


class UnitOfWork:
    """Fronteira de transação usada pelos services: eles decidem quando confirmar."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()
