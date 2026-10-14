# Imagem da API para o deploy (#19). Duas etapas: a primeira instala as dependências com o uv,
# a segunda leva só o ambiente pronto e o código, rodando como usuário sem privilégios.
FROM python:3.13-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.12.17 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

FROM python:3.13-slim
RUN useradd --create-home --uid 10001 eduspace
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY scripts/start.sh ./scripts/start.sh
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 APP_ENV=production
USER eduspace
EXPOSE 8000
CMD ["sh", "scripts/start.sh"]
