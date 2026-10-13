import pytest
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Connection, String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.exceptions import NotFoundError
from app.db.base import Base, IdMixin, TimestampMixin
from app.repositories.base import BaseRepository
from app.schemas.pagination import Page


class Gadget(IdMixin, TimestampMixin, Base):
    """Model existente só nos testes, criado e desfeito dentro da transação de cada teste."""

    __tablename__ = "test_gadget"

    nome: Mapped[str] = mapped_column(String(50))


class GadgetRepository(BaseRepository[Gadget]):
    model = Gadget
    not_found_message = "Gadget não encontrado."


class GadgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


@pytest.fixture
def repository(connection: Connection, db_session: Session) -> GadgetRepository:
    Base.metadata.tables[Gadget.__tablename__].create(connection)
    return GadgetRepository(db_session)


def test_add_persists_and_assigns_identity_and_timestamps(repository: GadgetRepository) -> None:
    gadget = repository.add(Gadget(nome="Projetor"))

    assert gadget.id is not None
    assert gadget.criado_em.tzinfo is not None
    assert gadget.atualizado_em.tzinfo is not None


def test_get_returns_entity_or_none(repository: GadgetRepository) -> None:
    gadget = repository.add(Gadget(nome="Projetor"))

    assert repository.get(gadget.id) is gadget
    assert repository.get(999_999) is None


def test_get_or_raise_returns_existing_entity(repository: GadgetRepository) -> None:
    gadget = repository.add(Gadget(nome="Projetor"))

    assert repository.get_or_raise(gadget.id) is gadget


def test_get_or_raise_uses_repository_message(repository: GadgetRepository) -> None:
    with pytest.raises(NotFoundError) as exc_info:
        repository.get_or_raise(999_999)

    assert exc_info.value.detail == "Gadget não encontrado."
    assert exc_info.value.code == "NAO_ENCONTRADO"


def test_paginate_slices_and_counts(repository: GadgetRepository) -> None:
    for number in range(25):
        repository.add(Gadget(nome=f"Item {number:02d}"))
    statement = select(Gadget).order_by(Gadget.id)

    second = repository.paginate(statement, page=2, per_page=10)
    last = repository.paginate(statement, page=3, per_page=10)

    assert [item.nome for item in second.items] == [f"Item {n:02d}" for n in range(10, 20)]
    assert (second.total, second.page, second.per_page, second.total_pages) == (25, 2, 10, 3)
    assert len(last.items) == 5


def test_paginate_respects_filters_in_total(repository: GadgetRepository) -> None:
    for nome in ("Projetor A", "Projetor B", "Notebook"):
        repository.add(Gadget(nome=nome))
    statement = select(Gadget).where(Gadget.nome.startswith("Projetor")).order_by(Gadget.nome)

    result = repository.paginate(statement, page=1, per_page=20)

    assert result.total == 2
    assert [item.nome for item in result.items] == ["Projetor A", "Projetor B"]


def test_empty_page_has_zero_pages(repository: GadgetRepository) -> None:
    result = repository.paginate(select(Gadget), page=1, per_page=20)

    assert (result.total, result.total_pages, list(result.items)) == (0, 0, [])


def test_page_schema_validates_from_page_result(repository: GadgetRepository) -> None:
    repository.add(Gadget(nome="Projetor"))

    page = Page[GadgetRead].model_validate(repository.paginate(select(Gadget), page=1, per_page=20))

    assert page.model_dump(exclude={"items"}) == {
        "total": 1,
        "page": 1,
        "per_page": 20,
        "total_pages": 1,
    }
    assert page.items[0].nome == "Projetor"
