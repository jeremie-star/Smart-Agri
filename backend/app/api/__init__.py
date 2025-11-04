from fastapi import APIRouter
from app.api.endpoints import auth, farmers, farms, irrigation, weather, notifications, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["farmers"])
api_router.include_router(farms.router, prefix="/farms", tags=["farms"])
api_router.include_router(irrigation.router, prefix="/irrigation", tags=["irrigation"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
