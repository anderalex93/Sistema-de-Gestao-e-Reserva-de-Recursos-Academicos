"""Models ORM. Todo model novo é importado aqui para o Alembic enxergar a metadata."""

from app.db.base import Base
from app.models.building import Building
from app.models.feature import Feature
from app.models.reservation import Reservation
from app.models.resource import Resource, resource_feature
from app.models.user import User

__all__ = ["Base", "Building", "Feature", "Reservation", "Resource", "User", "resource_feature"]
