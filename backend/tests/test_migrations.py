from alembic.config import Config
from sqlalchemy import Engine, text

from alembic import command


def _has_btree_gist(engine: Engine) -> bool:
    with engine.connect() as connection:
        found = connection.scalar(text("SELECT 1 FROM pg_extension WHERE extname = 'btree_gist'"))
    return found is not None


def test_head_enables_btree_gist(engine: Engine) -> None:
    assert _has_btree_gist(engine)


def test_migrations_are_reversible(engine: Engine, alembic_config: Config) -> None:
    command.downgrade(alembic_config, "base")
    assert not _has_btree_gist(engine)

    command.upgrade(alembic_config, "head")
    assert _has_btree_gist(engine)
