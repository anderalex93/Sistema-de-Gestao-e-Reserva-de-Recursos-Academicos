from sqlalchemy.exc import IntegrityError

from app.core.enums import RemovalOutcome
from app.core.exceptions import ConflictError
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.user import User
from app.repositories.building_repository import BuildingRepository
from app.repositories.resource_repository import ResourceRepository
from app.schemas.catalog_admin import (
    BuildingAdminRead,
    BuildingCreate,
    BuildingUpdate,
    RemovalRead,
)
from app.services.future_reservation_canceller import FutureReservationCanceller

DEACTIVATION_REASON = "Bloco desativado pela administração."


class BuildingNameTakenError(ConflictError):
    code = "BLOCO_JA_EXISTE"
    default_detail = "Já existe um bloco com este nome."


class BuildingAdminService:
    """Manutenção de blocos (#27). Bloco com recursos nunca é apagado: é desativado."""

    def __init__(
        self,
        buildings: BuildingRepository,
        resources: ResourceRepository,
        canceller: FutureReservationCanceller,
        uow: UnitOfWork,
    ) -> None:
        self._buildings = buildings
        self._resources = resources
        self._canceller = canceller
        self._uow = uow

    def list_all(self) -> list[BuildingAdminRead]:
        return [
            self._read(building, total)
            for building, total in self._buildings.list_with_resource_counts()
        ]

    def create(self, data: BuildingCreate) -> BuildingAdminRead:
        if self._buildings.name_taken(data.nome):
            raise BuildingNameTakenError
        building = Building(nome=data.nome, descricao=data.descricao)
        self._save(building)
        return self._read(building, 0)

    def update(self, building_id: int, data: BuildingUpdate) -> BuildingAdminRead:
        building = self._buildings.get_or_raise(building_id)
        if self._buildings.name_taken(data.nome, except_id=building.id):
            raise BuildingNameTakenError
        building.nome = data.nome
        building.descricao = data.descricao
        self._save(building)
        return self._read(building, len(self._resources.ids_in_building(building.id)))

    def remove(self, building_id: int, admin: User, *, force: bool) -> RemovalRead:
        """Sem recursos: apaga. Com recursos: desativa o bloco, o que tira todos da busca
        (cada recurso mantém o próprio `ativo`, para voltar como estava ao reativar)."""
        building = self._buildings.get_or_raise(building_id)
        resource_ids = self._resources.ids_in_building(building.id)
        if not resource_ids:
            self._buildings.delete(building)
            self._uow.commit()
            return RemovalRead(resultado=RemovalOutcome.EXCLUIDO, reservas_canceladas=0)
        cancelled = self._canceller.release(
            resource_ids, admin, force=force, reason=DEACTIVATION_REASON
        )
        building.ativo = False
        self._uow.commit()
        return RemovalRead(resultado=RemovalOutcome.DESATIVADO, reservas_canceladas=cancelled)

    def reactivate(self, building_id: int) -> BuildingAdminRead:
        building = self._buildings.get_or_raise(building_id)
        building.ativo = True
        self._uow.commit()
        return self._read(building, len(self._resources.ids_in_building(building.id)))

    def _save(self, building: Building) -> None:
        try:
            with self._uow.savepoint():
                self._buildings.add(building)
        except IntegrityError as exc:
            # Dois admins salvando o mesmo nome ao mesmo tempo: a constraint única decide.
            raise BuildingNameTakenError from exc
        self._uow.commit()

    @staticmethod
    def _read(building: Building, total: int) -> BuildingAdminRead:
        return BuildingAdminRead(
            id=building.id,
            nome=building.nome,
            descricao=building.descricao,
            ativo=building.ativo,
            total_recursos=total,
        )
