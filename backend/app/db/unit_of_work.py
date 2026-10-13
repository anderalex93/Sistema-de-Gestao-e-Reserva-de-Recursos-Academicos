from sqlalchemy.orm import Session, SessionTransaction


class UnitOfWork:
    """Fronteira de transação usada pelos services: eles decidem quando confirmar."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()

    def savepoint(self) -> SessionTransaction:
        """Bloco que desfaz só a si mesmo se falhar: `with uow.savepoint(): ...`."""
        return self._session.begin_nested()
