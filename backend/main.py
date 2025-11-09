from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.core.database import engine
from app.models import Base
from fastapi import APIRouter

# Import individual routers
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.farmers import router as farmers_router 
from app.api.endpoints.farms import router as farms_router
from app.api.endpoints.irrigation import router as irrigation_router
from app.api.endpoints.weather import router as weather_router
from app.api.endpoints.notifications import router as notifications_router
from app.api.endpoints.admin import router as admin_router
from app.utils.middleware import rate_limiter, create_error_response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Smart Irrigation Assistant API...")
    print(f"Environment: {'Development' if settings.debug else 'Production'}")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
    
    yield
    
    # Shutdown
    print("Shutting down Smart Irrigation Assistant API...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered irrigation guidance for African smallholder farmers",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health check and docs
    if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)
    
    try:
        await rate_limiter(request)
        response = await call_next(request)
        return response
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content=e.detail
        )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(
                error=exc.detail if isinstance(exc.detail, str) else exc.detail.get("error", "Unknown error"),
                code=exc.detail.get("code", "HTTP_ERROR") if isinstance(exc.detail, dict) else "HTTP_ERROR",
                details=exc.detail.get("details", {}) if isinstance(exc.detail, dict) else {}
            )
        )
    
    # Log the error in production
    if not settings.debug:
        print(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=500,
        content=create_error_response(
            error="Internal server error",
            code="INTERNAL_SERVER_ERROR",
            details={"message": str(exc)} if settings.debug else {}
        )
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": "development" if settings.debug else "production"
    }


# Include API routes
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(farmers_router, prefix="/api/farmers", tags=["farmers"])
app.include_router(farms_router, prefix="/api/farms", tags=["farms"])
app.include_router(irrigation_router, prefix="/api/irrigation", tags=["irrigation"])
app.include_router(weather_router, prefix="/api/weather", tags=["weather"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["notifications"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Smart Irrigation Assistant API",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation not available in production"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        workers=1 if settings.debug else 4
    )
