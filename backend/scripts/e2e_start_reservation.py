"""Põe uma reserva do banco do E2E em andamento, para testar o encerramento antecipado.

A API não aceita reservas no passado, e o E2E não controla o relógio do servidor. Este script
move a reserva para começar no bloco de 30 minutos atual (fuso do campus) e terminar 1h30
depois, mantendo o check-in já feito.

Uso: DATABASE_URL=...eduspace_e2e uv run python -m scripts.e2e_start_reservation EDU-XXXXXX
Recusa qualquer banco que não termine em `_e2e`.
"""

import sys

from sqlalchemy import create_engine, make_url, text

from app.core.config import get_settings
from scripts.reset_e2e_database import REQUIRED_SUFFIX

# `date_bin` alinha às marcas de 30 minutos a partir de uma meia-noite de Maceió (UTC-3 fixo).
START_NOW = text(
    "UPDATE reserva SET "
    "inicio = date_bin('30 minutes', now(), TIMESTAMPTZ '2000-01-01 00:00-03'), "
    "fim = date_bin('30 minutes', now(), TIMESTAMPTZ '2000-01-01 00:00-03') "
    "+ interval '90 minutes' "
    "WHERE codigo = :codigo AND status = 'CONFIRMADA' RETURNING id"
)


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("Uso: python -m scripts.e2e_start_reservation CODIGO", file=sys.stderr)  # noqa: T201
        return 2
    url = get_settings().database_url
    if not (make_url(url).database or "").endswith(REQUIRED_SUFFIX):
        print(  # noqa: T201 - script de linha de comando
            f"DATABASE_URL precisa apontar para um banco terminado em {REQUIRED_SUFFIX}.",
            file=sys.stderr,
        )
        return 1
    engine = create_engine(url)
    try:
        with engine.begin() as connection:
            moved = connection.scalar(START_NOW, {"codigo": argv[0].strip().upper()})
    finally:
        engine.dispose()
    if moved is None:
        print(f"Reserva confirmada {argv[0]} não encontrada.", file=sys.stderr)  # noqa: T201
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
