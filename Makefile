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

setup: backend/.env backend/.venv frontend/node_modules  ## Dependências, banco, migrações e catálogo (pode rodar várias vezes)
	$(BACK) db-up migrate seed
	$(if $(DEMO),$(BACK) seed-demo)

# Só no primeiro uso: um .env local pronto, com segredo JWT aleatório e as senhas locais do
# docker-compose.yml. Um .env existente nunca é sobrescrito.
backend/.env:
	@sed -e "s|^JWT_SECRET=.*|JWT_SECRET=$$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')|" \
		-e "s|^SEED_ADMIN_SENHA=$$|SEED_ADMIN_SENHA=Eduspace2026|" \
		-e "s|^SEED_DEMO_SENHA=$$|SEED_DEMO_SENHA=Demo2026|" \
		backend/.env.example > $@
	@echo "Criado backend/.env com os valores locais (admin@umj.edu.br / Eduspace2026)."

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
