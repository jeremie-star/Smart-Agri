from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.endpoints.auth import get_current_active_farmer
from app.models import Farmer, Farm, IrrigationSchedule, IrrigationStatusEnum
from app.schemas import IrrigationScheduleCreate, IrrigationScheduleResponse
from app.services.ai_service import ai_recommendation_service

router = APIRouter()


@router.post("/generate")
async def generate_irrigation_schedule(
    schedule_data: IrrigationScheduleCreate,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Generate irrigation schedule for a farm"""
    # Verify farm belongs to current farmer
    farm = db.query(Farm).filter(
        Farm.id == schedule_data.farm_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    # Prepare farm data for AI service
    farm_data = {
        "crop_type": farm.crop_type,
        "land_size": farm.land_size,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "soil_type": farm.soil_type
    }
    
    # Get AI recommendations
    recommendations = await ai_recommendation_service.generate_irrigation_recommendations(farm_data)
    
    # Clear existing future schedules for this farm
    db.query(IrrigationSchedule).filter(
        IrrigationSchedule.farm_id == farm.id,
        IrrigationSchedule.recommended_date > datetime.utcnow(),
        IrrigationSchedule.status == IrrigationStatusEnum.PENDING
    ).delete()
    
    # Create new irrigation schedules
    created_schedules = []
    for rec in recommendations["recommendations"]:
        if rec["irrigate"]:
            schedule = IrrigationSchedule(
                farm_id=farm.id,
                recommended_date=datetime.strptime(rec["date"], "%Y-%m-%d"),
                water_amount=rec["water_amount_liters"],
                weather_condition=f"Temperature: Variable, Humidity: Variable",
                ai_reasoning=rec["reasoning"],
                status=IrrigationStatusEnum.PENDING
            )
            db.add(schedule)
            created_schedules.append(schedule)
    
    db.commit()
    
    # Refresh all created schedules
    for schedule in created_schedules:
        db.refresh(schedule)
    
    return {
        "message": "Irrigation schedule generated successfully",
        "schedules_created": len(created_schedules),
        "general_advice": recommendations.get("general_advice", ""),
        "schedules": created_schedules
    }


@router.get("/schedule/{farm_id}", response_model=List[IrrigationScheduleResponse])
def get_irrigation_schedule(
    farm_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get irrigation schedule for a farm"""
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
    
    # Get future irrigation schedules
    schedules = db.query(IrrigationSchedule).filter(
        IrrigationSchedule.farm_id == farm_id,
        IrrigationSchedule.recommended_date >= datetime.utcnow().date()
    ).order_by(IrrigationSchedule.recommended_date).all()
    
    return schedules


@router.get("/history/{farm_id}", response_model=List[IrrigationScheduleResponse])
def get_irrigation_history(
    farm_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get past irrigation history for a farm"""
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
    
    # Get historical irrigation schedules
    start_date = datetime.utcnow() - timedelta(days=days)
    schedules = db.query(IrrigationSchedule).filter(
        IrrigationSchedule.farm_id == farm_id,
        IrrigationSchedule.recommended_date >= start_date,
        IrrigationSchedule.recommended_date < datetime.utcnow().date()
    ).order_by(IrrigationSchedule.recommended_date.desc()).all()
    
    return schedules


@router.patch("/schedule/{schedule_id}/complete")
def mark_irrigation_complete(
    schedule_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Mark irrigation schedule as completed"""
    # Get schedule and verify ownership
    schedule = db.query(IrrigationSchedule).join(Farm).filter(
        IrrigationSchedule.id == schedule_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Irrigation schedule not found"
        )
    
    schedule.status = IrrigationStatusEnum.COMPLETED
    db.commit()
    
    return {"message": "Irrigation marked as completed"}
