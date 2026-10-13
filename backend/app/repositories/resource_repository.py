from sqlalchemy import case, select
from sqlalchemy.orm import contains_eager

from app.core.enums import ResourceType
from app.core.exceptions import NotFoundError
from app.models.building import Building
from app.models.resource import Resource
from app.repositories.base import BaseRepository, PageResult

# Espaços primeiro, equipamentos por último: a ordem de declaração do enum.
TYPE_ORDER = case({tipo: index for index, tipo in enumerate(ResourceType)}, value=Resource.tipo)


class ResourceRepository(BaseRepository[Resource]):
    model = Resource
    not_found_message = "Recurso não encontrado."

    def list_active(self, page: int, per_page: int) -> PageResult[Resource]:
        """Recursos reserváveis: ativos e em bloco ativo, agrupados por bloco."""
        statement = (
            select(Resource)
            .join(Resource.bloco)
            .options(contains_eager(Resource.bloco))
            .where(Resource.ativo, Building.ativo)
            .order_by(Building.nome, TYPE_ORDER, Resource.nome, Resource.id)
        )
        return self.paginate(statement, page, per_page)

    def get_active_or_raise(self, resource_id: int) -> Resource:
        resource = self.get(resource_id)
        if resource is None or not resource.ativo or not resource.bloco.ativo:
            raise NotFoundError(self.not_found_message)
        return resource

    def get_by_name(self, bloco_id: int, nome: str) -> Resource | None:
        return self._session.scalar(
            select(Resource).where(Resource.bloco_id == bloco_id, Resource.nome == nome)
        )
