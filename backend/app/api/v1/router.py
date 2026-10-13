from fastapi import APIRouter

from app.api.v1.endpoints import admin_users, auth, board, catalog, config, health, reservations

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(config.router)
api_router.include_router(catalog.router)
api_router.include_router(reservations.router)
api_router.include_router(board.router)
api_router.include_router(admin_users.router)
