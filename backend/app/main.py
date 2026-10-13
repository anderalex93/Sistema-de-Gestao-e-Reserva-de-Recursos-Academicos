from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import register_error_handlers
from app.api.process_time import ProcessTimeMiddleware
from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.core.rate_limit import limiter
from app.core.security import PasswordHasher
from app.db.session import build_engine, build_session_factory


def create_app(
    settings: Settings | None = None, password_hasher: PasswordHasher | None = None
) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = build_engine(settings.database_url)
        app.state.session_factory = build_session_factory(engine)
        yield
        engine.dispose()

    app = FastAPI(
        title="EduSpace API",
        description="Reserva de salas, laboratórios e equipamentos do campus da UMJ.",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.password_hasher = password_hasher or PasswordHasher()
    app.state.limiter = limiter
    limiter.enabled = settings.rate_limit_enabled

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time"],
    )
    # Adicionado por último: fica por fora e mede também o CORS e os handlers de erro.
    app.add_middleware(ProcessTimeMiddleware, slow_ms=settings.slow_request_ms)
    register_error_handlers(app)
    app.include_router(api_router)
    return app
