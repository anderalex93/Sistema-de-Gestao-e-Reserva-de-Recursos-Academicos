#!/bin/sh
# Inicialização da API no deploy (#19): migrações, seed opcional e servidor.
set -e

alembic upgrade head

# Catálogo e admin inicial (idempotente). No plano gratuito do Render não há shell nem
# pre-deploy: o seed roda aqui quando SEED_ON_START=true (exige SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA).
if [ "${SEED_ON_START:-false}" = "true" ]; then
  python -m app.seed
fi

# --proxy-headers: atrás do proxy do Render, o IP real vem do X-Forwarded-For. Sem isso o
# limite de tentativas de login trataria todo mundo como o mesmo IP.
exec uvicorn app.main:create_app --factory \
  --host 0.0.0.0 --port "${PORT:-8000}" \
  --proxy-headers --forwarded-allow-ips="*" \
  --no-access-log
