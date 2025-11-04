from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.endpoints.auth import get_current_active_farmer
from app.models import Farmer, Farm
from app.schemas import WeatherData, WeatherForecast
from app.services.weather_service import weather_service

router = APIRouter()


@router.get("/current/{farm_id}", response_model=WeatherData)
async def get_current_weather(
    farm_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get current weather for farm location"""
    # Verify farm belongs to current farmer
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    # Get current weather
    weather_data = await weather_service.get_current_weather(farm.latitude, farm.longitude)
    
    if not weather_data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather service temporarily unavailable"
        )
    
    return weather_data


@router.get("/forecast/{farm_id}", response_model=WeatherForecast)
async def get_weather_forecast(
    farm_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get 7-day weather forecast for farm location"""
    # Verify farm belongs to current farmer
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    # Get weather forecast
    forecast_data = await weather_service.get_forecast(farm.latitude, farm.longitude)
    
    if not forecast_data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather service temporarily unavailable"
        )
    
    return forecast_data
