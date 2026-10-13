from sqlalchemy import exists, or_, select

from app.models.user import User
from app.repositories.base import BaseRepository, PageResult


class UserRepository(BaseRepository[User]):
    model = User
    not_found_message = "Usuário não encontrado."

    def get_by_email(self, email: str) -> User | None:
        return self._session.scalar(select(User).where(User.email == email.lower()))

    def email_exists(self, email: str) -> bool:
        return bool(self._session.scalar(select(exists().where(User.email == email.lower()))))

    def registration_exists(self, matricula: str) -> bool:
        return bool(self._session.scalar(select(exists().where(User.matricula == matricula))))

    def search(self, term: str | None, page: int, per_page: int) -> PageResult[User]:
        statement = select(User).order_by(User.nome, User.id)
        if term and term.strip():
            text = term.strip()
            statement = statement.where(
                or_(
                    User.nome.icontains(text, autoescape=True),
                    User.email.icontains(text, autoescape=True),
                    User.matricula.icontains(text, autoescape=True),
                )
            )
        return self.paginate(statement, page, per_page)
