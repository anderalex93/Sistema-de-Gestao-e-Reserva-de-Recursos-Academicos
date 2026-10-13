"""Repositório genérico. Cada entidade herda e acrescenta suas consultas específicas."""

from collections.abc import Sequence
from dataclasses import dataclass
from math import ceil
from typing import ClassVar

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.db.base import Base


@dataclass(frozen=True, slots=True)
class PageResult[ModelT: Base]:
    items: Sequence[ModelT]
    total: int
    page: int
    per_page: int

    @property
    def total_pages(self) -> int:
        return ceil(self.total / self.per_page) if self.total else 0


class BaseRepository[ModelT: Base]:
    model: type[ModelT]
    not_found_message: ClassVar[str] = "Registro não encontrado."

    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, entity_id: int) -> ModelT | None:
        return self._session.get(self.model, entity_id)

    def get_or_raise(self, entity_id: int) -> ModelT:
        entity = self.get(entity_id)
        if entity is None:
            raise NotFoundError(self.not_found_message)
        return entity

    def add(self, entity: ModelT) -> ModelT:
        """Persiste e faz flush, para que violações de constraint apareçam dentro da requisição."""
        self._session.add(entity)
        self._session.flush()
        return entity

    def add_all(self, entities: Sequence[ModelT]) -> None:
        self._session.add_all(entities)
        self._session.flush()

    def paginate(self, statement: Select[ModelT], page: int, per_page: int) -> PageResult[ModelT]:
        count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        total = self._session.scalar(count_statement) or 0
        items = self._session.scalars(statement.limit(per_page).offset((page - 1) * per_page)).all()
        return PageResult(items=items, total=total, page=page, per_page=per_page)
