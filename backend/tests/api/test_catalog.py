from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import ResourceType
from app.models.building import Building
from app.models.feature import Feature
from app.models.resource import Resource
from app.models.user import User
from tests.conftest import login

RESOURCES = "/api/v1/recursos"


@pytest.fixture
def headers(client: TestClient, make_user: Callable[..., User]) -> dict[str, str]:
    make_user(email="lucas@umj.edu.br")
    return login(client, "lucas@umj.edu.br")


@pytest.fixture
def campus(db_session: Session) -> dict[str, Resource]:
    """Dois blocos (um desativado), duas características e quatro recursos."""
    bloco_a = Building(nome="Bloco A", descricao="Entrada principal")
    bloco_z = Building(nome="Bloco Z", ativo=False)
    projetor = Feature(nome="Projetor")
    ar = Feature(nome="Ar-condicionado")
    resources = {
        "sala": Resource(
            bloco=bloco_a,
            nome="Sala 101",
            tipo=ResourceType.SALA_ESTUDO,
            capacidade=6,
            andar="Térreo",
            caracteristicas=[projetor, ar],
        ),
        "projetor": Resource(
            bloco=bloco_a,
            nome="Projetor 01",
            tipo=ResourceType.EQUIPAMENTO,
            caracteristicas=[projetor],
        ),
        "inativo": Resource(
            bloco=bloco_a,
            nome="Sala em reforma",
            tipo=ResourceType.SALA_ESTUDO,
            capacidade=4,
            ativo=False,
        ),
        "bloco_inativo": Resource(
            bloco=bloco_z, nome="Sala Z1", tipo=ResourceType.SALA_ESTUDO, capacidade=4
        ),
    }
    db_session.add_all(resources.values())
    db_session.flush()
    # Como numa requisição nova: relações recarregadas do banco, com a ordenação do model.
    db_session.expire_all()
    return resources


def test_lists_only_active_resources_with_building_and_features(
    client: TestClient, headers: dict[str, str], campus: dict[str, Resource]
) -> None:
    page = client.get(RESOURCES, headers=headers).json()

    assert [item["nome"] for item in page["items"]] == ["Sala 101", "Projetor 01"]
    assert page["total"] == 2
    sala = page["items"][0]
    assert sala["bloco"] == {
        "id": campus["sala"].bloco_id,
        "nome": "Bloco A",
        "descricao": "Entrada principal",
    }
    assert [feature["nome"] for feature in sala["caracteristicas"]] == [
        "Ar-condicionado",
        "Projetor",
    ]
    assert (sala["tipo"], sala["capacidade"], sala["andar"]) == ("SALA_ESTUDO", 6, "Térreo")
    assert page["items"][1]["capacidade"] is None


def test_list_is_paginated(
    client: TestClient, headers: dict[str, str], campus: dict[str, Resource]
) -> None:
    page = client.get(RESOURCES, headers=headers, params={"per_page": 1, "page": 2}).json()

    assert [item["id"] for item in page["items"]] == [campus["projetor"].id]
    assert (page["total"], page["total_pages"]) == (2, 2)


def test_detail_returns_resource(
    client: TestClient, headers: dict[str, str], campus: dict[str, Resource]
) -> None:
    response = client.get(f"{RESOURCES}/{campus['sala'].id}", headers=headers)

    assert response.status_code == 200
    assert response.json()["nome"] == "Sala 101"


@pytest.mark.parametrize("key", ["inativo", "bloco_inativo"])
def test_detail_hides_inactive_resources(
    client: TestClient, headers: dict[str, str], campus: dict[str, Resource], key: str
) -> None:
    response = client.get(f"{RESOURCES}/{campus[key].id}", headers=headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Recurso não encontrado.", "code": "NAO_ENCONTRADO"}


def test_detail_of_unknown_resource_is_404(client: TestClient, headers: dict[str, str]) -> None:
    assert client.get(f"{RESOURCES}/999999", headers=headers).status_code == 404


def test_lists_active_buildings_and_all_features(
    client: TestClient, headers: dict[str, str], campus: dict[str, Resource]
) -> None:
    buildings = client.get("/api/v1/blocos", headers=headers).json()
    features = client.get("/api/v1/caracteristicas", headers=headers).json()

    assert [building["nome"] for building in buildings] == ["Bloco A"]
    assert [feature["nome"] for feature in features] == ["Ar-condicionado", "Projetor"]
    assert set(features[0]) == {"id", "nome"}
    assert campus


@pytest.mark.parametrize(
    "path", [RESOURCES, f"{RESOURCES}/1", "/api/v1/blocos", "/api/v1/caracteristicas"]
)
def test_catalog_requires_login(client: TestClient, path: str) -> None:
    assert client.get(path).status_code == 401
