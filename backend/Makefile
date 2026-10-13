UV ?= uv
COMPOSE ?= docker compose -f ../docker-compose.yml

.PHONY: install db-up db-down dev migrate seed revision lint format typecheck test migrations-check ci openapi

install:  ## Instala dependências (inclui as de desenvolvimento)
	$(UV) sync

db-up:  ## Sobe o PostgreSQL local (porta 5433)
	$(COMPOSE) up -d --wait db

db-down:  ## Para o PostgreSQL local (mantém os dados)
	$(COMPOSE) stop db

dev:  ## API com hot reload em http://localhost:8000
	$(UV) run uvicorn app.main:create_app --factory --reload --port 8000

migrate:  ## Aplica as migrações pendentes
	$(UV) run alembic upgrade head

seed:  ## Catálogo inicial do campus e admin (SEED_ADMIN_* no .env); pode rodar várias vezes
	$(UV) run python -m app.seed

revision:  ## Gera migração a partir dos models: make revision m="create reserva"
	$(UV) run alembic revision --autogenerate -m "$(m)"

lint:
	$(UV) run ruff check .
	$(UV) run ruff format --check .

format:
	$(UV) run ruff check --fix .
	$(UV) run ruff format .

typecheck:
	$(UV) run mypy

test:
	$(UV) run pytest -n auto --maxprocesses=4 --cov --cov-report=term-missing

migrations-check:  ## Falha se algum model mudou sem migração
	$(UV) run alembic upgrade head
	$(UV) run alembic check

ci: lint typecheck test migrations-check  ## Gate completo: ruff, mypy --strict, pytest e migrações em dia

openapi:  ## Exporta o OpenAPI para ../frontend/openapi.json (usado por npm run gen:api)
	$(UV) run python -m scripts.export_openapi ../frontend/openapi.json
