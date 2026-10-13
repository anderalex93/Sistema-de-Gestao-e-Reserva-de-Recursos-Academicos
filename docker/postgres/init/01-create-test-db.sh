#!/bin/sh
# Cria o banco usado pela suíte de testes do backend na primeira subida do volume.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE DATABASE "$POSTGRES_TEST_DB" OWNER "$POSTGRES_USER";
EOSQL
