from fastapi import APIRouter

from app.api.v1.endpoints import (
    account,
    admin_buildings,
    admin_features,
    admin_occupancy,
    admin_reservations,
    admin_resources,
    admin_settings,
    admin_users,
    auth,
    board,
    catalog,
    checkin,
    config,
    health,
    reservations,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(account.router)
api_router.include_router(config.router)
api_router.include_router(catalog.router)
api_router.include_router(reservations.router)
api_router.include_router(board.router)
api_router.include_router(checkin.router)
api_router.include_router(admin_users.router)
api_router.include_router(admin_buildings.router)
api_router.include_router(admin_resources.router)
api_router.include_router(admin_features.router)
api_router.include_router(admin_reservations.router)
api_router.include_router(admin_occupancy.router)
api_router.include_router(admin_settings.router)
