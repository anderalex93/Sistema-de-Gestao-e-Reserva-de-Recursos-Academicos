from sqlalchemy.exc import IntegrityError

from app.core.checkin_tokens import new_checkin_token
from app.core.enums import RemovalOutcome
from app.core.exceptions import BusinessRuleError, ConflictError
from app.db.unit_of_work import UnitOfWork
from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.models.user import User
from app.repositories.base import PageResult
from app.repositories.building_repository import BuildingRepository
from app.repositories.feature_repository import FeatureRepository
from app.repositories.reservation_repository import ReservationRepository
from app.repositories.resource_filters import ResourceFilters
from app.repositories.resource_repository import ResourceRepository
from app.schemas.catalog_admin import (
    RemovalRead,
    ResourceAdminSearchParams,
    ResourceCreate,
    ResourceUpdate,
)
from app.services.future_reservation_canceller import FutureReservationCanceller

DEACTIVATION_REASON = "Recurso desativado pela administração."


class ResourceNameTakenError(ConflictError):
    code = "RECURSO_JA_EXISTE"
    default_detail = "Já existe um recurso com este nome neste bloco."


class InvalidBuildingError(BusinessRuleError):
    code = "BLOCO_INVALIDO"
    default_detail = "Escolha um bloco ativo."


class InvalidFeatureError(BusinessRuleError):
    code = "CARACTERISTICA_INVALIDA"
    default_detail = "Uma das características escolhidas não existe mais. Recarregue a página."


class ResourceAdminService:
    """Manutenção de recursos (#27). Recurso com reservas no histórico nunca é apagado."""

    def __init__(
        self,
        *,
        resources: ResourceRepository,
        buildings: BuildingRepository,
        features: FeatureRepository,
        reservations: ReservationRepository,
        canceller: FutureReservationCanceller,
        uow: UnitOfWork,
    ) -> None:
        self._resources = resources
        self._buildings = buildings
        self._features = features
        self._reservations = reservations
        self._canceller = canceller
        self._uow = uow

    def search(self, params: ResourceAdminSearchParams) -> PageResult[Resource]:
        busca = params.busca.strip() if params.busca else None
        filters = ResourceFilters(bloco_id=params.bloco_id, tipo=params.tipo, busca=busca or None)
        return self._resources.search_all(filters, params.ativo, params.page, params.per_page)

    def get(self, resource_id: int) -> Resource:
        return self._resources.get_or_raise(resource_id)

    def create(self, data: ResourceCreate) -> Resource:
        building = self._target_building(data.bloco_id, current=None)
        if self._resources.name_taken(building.id, data.nome):
            raise ResourceNameTakenError
        resource = Resource(
            bloco=building,
            tipo=data.tipo,
            nome=data.nome,
            capacidade=data.capacidade,
            andar=data.andar,
            descricao=data.descricao,
            caracteristicas=self._chosen_features(data.caracteristica_ids),
        )
        self._save(resource)
        return resource

    def update(self, resource_id: int, data: ResourceUpdate) -> Resource:
        resource = self._resources.get_or_raise(resource_id)
        building = self._target_building(data.bloco_id, current=resource.bloco)
        if self._resources.name_taken(building.id, data.nome, except_id=resource.id):
            raise ResourceNameTakenError
        resource.bloco = building
        resource.tipo = data.tipo
        resource.nome = data.nome
        resource.capacidade = data.capacidade
        resource.andar = data.andar
        resource.descricao = data.descricao
        resource.caracteristicas = self._chosen_features(data.caracteristica_ids)
        self._save(resource)
        return resource

    def remove(self, resource_id: int, admin: User, *, force: bool) -> RemovalRead:
        """Sem nenhuma reserva: apaga de vez. Com histórico: desativa, e o recurso some da
        busca, mas as reservas antigas e os comprovantes continuam apontando para ele."""
        resource = self._resources.get_or_raise(resource_id)
        if not self._reservations.exists_for_resources([resource.id]):
            self._resources.delete(resource)
            self._uow.commit()
            return RemovalRead(resultado=RemovalOutcome.EXCLUIDO, reservas_canceladas=0)
        cancelled = self._canceller.release(
            [resource.id], admin, force=force, reason=DEACTIVATION_REASON
        )
        resource.ativo = False
        self._uow.commit()
        return RemovalRead(resultado=RemovalOutcome.DESATIVADO, reservas_canceladas=cancelled)

    def reactivate(self, resource_id: int) -> Resource:
        resource = self._resources.get_or_raise(resource_id)
        resource.ativo = True
        self._uow.commit()
        return resource

    def renew_checkin_token(self, resource_id: int) -> Resource:
        """#43. Token novo para o QR Code de check-in: os QR Codes já impressos param de valer."""
        resource = self._resources.get_or_raise(resource_id)
        resource.checkin_token = new_checkin_token()
        self._uow.commit()
        return resource

    def _target_building(self, building_id: int, current: Building | None) -> Building:
        """Mover ou criar só em bloco ativo; quem já está num bloco desativado pode ser editado."""
        if current is not None and current.id == building_id:
            return current
        building = self._buildings.get(building_id)
        if building is None or not building.ativo:
            raise InvalidBuildingError
        return building

    def _chosen_features(self, feature_ids: list[int]) -> list[Feature]:
        features = self._features.get_many(feature_ids)
        if len(features) != len(feature_ids):
            raise InvalidFeatureError
        return list(features)

    def _save(self, resource: Resource) -> None:
        try:
            with self._uow.savepoint():
                self._resources.add(resource)
        except IntegrityError as exc:
            raise ResourceNameTakenError from exc
        self._uow.commit()
