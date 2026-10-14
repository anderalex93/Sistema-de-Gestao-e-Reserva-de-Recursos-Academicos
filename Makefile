# Atalhos do projeto inteiro. Os comandos de cada lado ficam em backend/Makefile e frontend/package.json.

# O uv instalado com `pip install --user` no Windows não entra no PATH do Git Bash: procura lá também.
UV ?= $(or $(shell command -v uv 2>/dev/null),$(firstword $(wildcard $(subst \,/,$(APPDATA))/Python/Python3*/Scripts/uv.exe)),uv)
BACK := $(MAKE) --no-print-directory -C backend UV="$(UV)"

.PHONY: help run setup api web stop ci

help:  ## Lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | sed 's/:.*## /\t/'

run: setup  ## Sobe banco, API (:8000) e front (:5173) com recarga automática; DEMO=1 refaz as contas da demo
	@echo "API em http://localhost:8000/docs, front em http://localhost:5173. Ctrl+C para parar."
	@$(MAKE) --no-print-directory -j2 api web

setup: backend/.venv frontend/node_modules  ## Dependências, banco, migrações e catálogo (pode rodar várias vezes)
	$(BACK) db-up migrate seed
	$(if $(DEMO),$(BACK) seed-demo)

backend/.venv: backend/uv.lock
	$(BACK) install
	@touch $@

frontend/node_modules: frontend/package-lock.json
	cd frontend && npm install
	@touch $@

api:
	$(BACK) dev

web:
	cd frontend && npm run dev

stop:  ## Para o PostgreSQL local (mantém os dados)
	$(BACK) db-down

ci:  ## Gates do back e do front em paralelo
	@$(MAKE) --no-print-directory -j2 ci-back ci-front

.PHONY: ci-back ci-front
ci-back:
	$(BACK) ci

ci-front:
	cd frontend && npm run ci
