from pydantic import BaseModel, ConfigDict

from app.core.enums import ResourceType


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
