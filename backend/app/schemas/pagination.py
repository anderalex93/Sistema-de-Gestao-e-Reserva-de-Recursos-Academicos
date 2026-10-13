"""Envelope de paginação usado por toda listagem da API."""

from pydantic import BaseModel, ConfigDict, Field


class PageParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class Page[ItemT](BaseModel):
    """Construído com `Page[XRead].model_validate(page_result)` a partir de um `PageResult`."""

    model_config = ConfigDict(from_attributes=True)

    items: list[ItemT]
    total: int
    page: int
    per_page: int
    total_pages: int
