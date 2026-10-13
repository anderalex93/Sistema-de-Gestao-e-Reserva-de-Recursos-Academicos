"""Models ORM. Todo model novo é importado aqui para o Alembic enxergar a metadata."""

from app.db.base import Base
from app.models.user import User

__all__ = ["Base", "User"]
