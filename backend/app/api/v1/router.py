from fastapi import APIRouter

from app.api.v1.endpoints import admin_users, auth, health

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(admin_users.router)
