"""DTOs da manutenção do catálogo pela administração (#27)."""

from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from app.core.enums import RemovalOutcome, ResourceType
from app.schemas.catalog import BuildingRead, FeatureRead, ResourceRead
from app.schemas.pagination import PageParams

BuildingName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
FeatureName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=60)]
ResourceName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
Floor = Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]


def _blank_to_none(value: str | None) -> str | None:
    return value or None


class BuildingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome: BuildingName
    descricao: Description | None = None

    @model_validator(mode="after")
    def _normalize(self) -> Self:
        self.descricao = _blank_to_none(self.descricao)
        return self


class BuildingUpdate(BuildingCreate):
    """PUT substitui todos os campos editáveis. Ativar e desativar têm endpoints próprios."""


class BuildingStatusRead(BuildingRead):
    ativo: bool


class BuildingAdminRead(BuildingStatusRead):
    total_recursos: int = Field(description="Recursos cadastrados no bloco, ativos ou não")


class FeatureCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome: FeatureName


class FeatureUpdate(FeatureCreate):
    pass


class FeatureAdminRead(FeatureRead):
    total_recursos: int = Field(description="Recursos que têm esta característica")


class ResourceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bloco_id: int = Field(ge=1)
    tipo: ResourceType
    nome: ResourceName
    capacidade: int | None = Field(default=None, ge=1, le=1000)
    andar: Floor | None = None
    descricao: Description | None = None
    caracteristica_ids: list[int] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def _check(self) -> Self:
        if self.tipo is not ResourceType.EQUIPAMENTO and self.capacidade is None:
            msg = "Informe a capacidade: só equipamentos podem ficar sem lotação."
            raise ValueError(msg)
        self.andar = _blank_to_none(self.andar)
        self.descricao = _blank_to_none(self.descricao)
        self.caracteristica_ids = sorted(set(self.caracteristica_ids))
        return self


class ResourceUpdate(ResourceCreate):
    """PUT substitui todos os campos editáveis, inclusive a lista de características."""


class ResourceAdminRead(ResourceRead):
    bloco: BuildingStatusRead
    ativo: bool


class ResourceAdminSearchParams(PageParams):
    busca: str | None = Field(default=None, max_length=80, description="Trecho do nome")
    bloco_id: int | None = Field(default=None, ge=1)
    tipo: ResourceType | None = None
    ativo: bool | None = Field(default=None, description="Sem o filtro, lista ativos e inativos")


class RemovalRead(BaseModel):
    """Resultado de `DELETE`: exclusão física só acontece quando não há histórico."""

    resultado: RemovalOutcome
    reservas_canceladas: int = Field(description="Reservas futuras canceladas com `forcar=true`")
