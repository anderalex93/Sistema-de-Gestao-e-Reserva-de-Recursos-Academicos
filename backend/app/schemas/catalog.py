from typing import Self

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

from app.core.enums import ResourceType
from app.schemas.pagination import PageParams


class BuildingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str | None


class FeatureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipo: ResourceType
    capacidade: int | None
    andar: str | None
    descricao: str | None
    bloco: BuildingRead
    caracteristicas: list[FeatureRead]


class ResourceSearchParams(PageParams):
    """Filtros da busca de recursos. Todos são opcionais e se combinam com E."""

    bloco_id: int | None = Field(default=None, ge=1)
    tipo: ResourceType | None = None
    caracteristicas: list[int] = Field(
        default_factory=list,
        max_length=20,
        description="IDs de características; o recurso precisa ter todas",
    )
    capacidade_min: int | None = Field(default=None, ge=1, le=1000)
    busca: str | None = Field(default=None, max_length=80, description="Trecho do nome")
    inicio: AwareDatetime | None = Field(
        default=None, description="Com `fim`: só recursos livres no intervalo"
    )
    fim: AwareDatetime | None = None

    @model_validator(mode="after")
    def _check_interval(self) -> Self:
        if (self.inicio is None) != (self.fim is None):
            msg = "Informe início e fim juntos."
            raise ValueError(msg)
        if self.inicio is not None and self.fim is not None and self.fim <= self.inicio:
            msg = "O fim precisa ser depois do início."
            raise ValueError(msg)
        return self
