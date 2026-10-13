from enum import StrEnum

from sqlalchemy import Enum


def str_enum(enum_class: type[StrEnum], name: str, length: int = 20) -> Enum:
    """Enum gravado como VARCHAR + CHECK (decisão do DER: sem ENUM nativo do PostgreSQL)."""
    return Enum(
        enum_class,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=length,
        validate_strings=True,
        values_callable=lambda members: [member.value for member in members],
    )
