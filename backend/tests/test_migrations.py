from collections.abc import Iterator

import pytest
from alembic.config import Config
from sqlalchemy import Connection, Engine, text
from sqlalchemy.exc import IntegrityError

from alembic import command

BEFORE_CHECKIN = "096bf8b78ba4"


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


@pytest.fixture
def before_checkin(engine: Engine, alembic_config: Config) -> Iterator[Connection]:
    """Banco na revisão anterior ao check-in (#43), com dados gravados de verdade (commit).

    Volta para o head e apaga os dados no final, porque os outros testes do worker usam o
    mesmo schema.
    """
    command.downgrade(alembic_config, BEFORE_CHECKIN)
    try:
        with engine.connect() as connection:
            yield connection
    finally:
        command.upgrade(alembic_config, "head")
        with engine.begin() as connection:
            connection.execute(text("DELETE FROM reserva WHERE codigo LIKE 'EDU-MIG%'"))
            connection.execute(text("DELETE FROM recurso WHERE nome LIKE 'Sala migração%'"))
            connection.execute(text("DELETE FROM bloco WHERE nome = 'Bloco migração'"))
            connection.execute(text("DELETE FROM usuario WHERE email = 'migracao@umj.edu.br'"))


def test_checkin_migration_keeps_existing_data_consistent(
    before_checkin: Connection, alembic_config: Config
) -> None:
    connection = before_checkin
    user_id = connection.scalar(
        text(
            "INSERT INTO usuario (nome, email, senha_hash) "
            "VALUES ('Migração', 'migracao@umj.edu.br', 'x') RETURNING id"
        )
    )
    bloco_id = connection.scalar(
        text("INSERT INTO bloco (nome) VALUES ('Bloco migração') RETURNING id")
    )
    for name in ("Sala migração 1", "Sala migração 2"):
        connection.execute(
            text(
                "INSERT INTO recurso (bloco_id, nome, tipo, capacidade) "
                "VALUES (:bloco, :nome, 'SALA_ESTUDO', 4)"
            ),
            {"bloco": bloco_id, "nome": name},
        )
    resource_id = connection.scalar(text("SELECT id FROM recurso WHERE nome = 'Sala migração 1'"))
    insert = text(
        "INSERT INTO reserva (codigo, recurso_id, usuario_id, inicio, fim) "
        "VALUES (:codigo, :recurso, :usuario, now() + CAST(:inicio AS interval),"
        " now() + CAST(:inicio AS interval) + interval '1 hour')"
    )
    for codigo, start in (("EDU-MIG01", "-2 hours"), ("EDU-MIG02", "2 hours")):
        connection.execute(
            insert, {"codigo": codigo, "recurso": resource_id, "usuario": user_id, "inicio": start}
        )
    connection.commit()

    command.upgrade(alembic_config, "head")

    tokens = connection.scalars(
        text("SELECT checkin_token FROM recurso WHERE nome LIKE 'Sala migração%'")
    ).all()
    assert len(tokens) == 2
    assert all(tokens)
    assert len(set(tokens)) == 2
    rows = connection.execute(
        text(
            "SELECT codigo, checkin_em = inicio FROM reserva WHERE codigo LIKE 'EDU-MIG%' "
            "ORDER BY codigo"
        )
    ).all()
    checkins: dict[str, bool | None] = dict(rows)
    # A que já começou conta como presença; a futura ainda espera o check-in.
    assert checkins == {"EDU-MIG01": True, "EDU-MIG02": None}

    connection.execute(
        text(
            "UPDATE reserva SET status = 'NAO_COMPARECEU', liberada_em = now() "
            "WHERE codigo = 'EDU-MIG02'"
        )
    )
    connection.commit()

    command.downgrade(alembic_config, BEFORE_CHECKIN)

    status, motivo, cancelada = connection.execute(
        text(
            "SELECT status, motivo_cancelamento, cancelada_em IS NOT NULL FROM reserva "
            "WHERE codigo = 'EDU-MIG02'"
        )
    ).one()
    connection.commit()
    assert (status, cancelada) == ("CANCELADA", True)
    assert motivo == "Liberada por não comparecimento."


BEFORE_EARLY_END = "165d3a7e5685"


@pytest.fixture
def at_head(engine: Engine) -> Iterator[Connection]:
    """Banco no head com dados gravados de verdade (commit), apagados no final."""
    try:
        with engine.connect() as connection:
            yield connection
    finally:
        with engine.begin() as connection:
            connection.execute(text("DELETE FROM reserva WHERE codigo LIKE 'EDU-MIG%'"))
            connection.execute(text("DELETE FROM recurso WHERE nome LIKE 'Sala migração%'"))
            connection.execute(text("DELETE FROM bloco WHERE nome = 'Bloco migração'"))
            connection.execute(text("DELETE FROM usuario WHERE email = 'migracao@umj.edu.br'"))


def test_early_end_migration_checks_coherence_and_downgrade_keeps_the_short_end(
    at_head: Connection, alembic_config: Config
) -> None:
    connection = at_head
    user_id = connection.scalar(
        text(
            "INSERT INTO usuario (nome, email, senha_hash) "
            "VALUES ('Migração', 'migracao@umj.edu.br', 'x') RETURNING id"
        )
    )
    bloco_id = connection.scalar(
        text("INSERT INTO bloco (nome) VALUES ('Bloco migração') RETURNING id")
    )
    resource_id = connection.scalar(
        text(
            "INSERT INTO recurso (bloco_id, nome, tipo, capacidade, checkin_token) "
            "VALUES (:bloco, 'Sala migração 1', 'SALA_ESTUDO', 4, 'mig-early-end') RETURNING id"
        ),
        {"bloco": bloco_id},
    )
    insert = text(
        "INSERT INTO reserva (codigo, recurso_id, usuario_id, inicio, fim, encerrada_em, "
        "fim_previsto) VALUES (:codigo, :recurso, :usuario, '2030-10-23 14:00-03', "
        "'2030-10-23 14:30-03', :encerrada, '2030-10-23 16:00-03')"
    )
    params = {"recurso": resource_id, "usuario": user_id}
    connection.commit()
    # `fim_previsto` sem `encerrada_em` não faz sentido: o CHECK recusa.
    with pytest.raises(IntegrityError, match="ck_reserva_encerramento_coerente"):
        connection.execute(insert, {**params, "codigo": "EDU-MIG03", "encerrada": None})
    connection.rollback()
    connection.execute(
        insert, {**params, "codigo": "EDU-MIG04", "encerrada": "2030-10-23 14:10-03"}
    )
    connection.commit()

    command.downgrade(alembic_config, BEFORE_EARLY_END)
    try:
        columns = connection.scalars(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'reserva' AND column_name IN ('encerrada_em', 'fim_previsto')"
            )
        ).all()
        end_is_short = connection.scalar(
            text(
                "SELECT fim = TIMESTAMPTZ '2030-10-23 14:30-03' FROM reserva "
                "WHERE codigo = 'EDU-MIG04'"
            )
        )
        connection.commit()
    finally:
        command.upgrade(alembic_config, "head")

    assert columns == []
    assert end_is_short is True
