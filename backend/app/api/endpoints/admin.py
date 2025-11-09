from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models import Farmer, Farm, NotificationLog, IrrigationSchedule, IrrigationStatusEnum, NotificationStatusEnum
from app.schemas import SystemStats, AdminFarmerResponse

router = APIRouter()

# Note: In production, add proper admin authentication
# For now, we'll assume admin routes are protected at the gateway level


@router.get("/stats", response_model=SystemStats)
def get_system_stats(db: Session = Depends(get_db)):
    """Get system usage statistics"""
    today = datetime.utcnow().date()
    month_start = datetime.utcnow().replace(day=1).date()
    
    # Total counts
    total_farmers = db.query(func.count(Farmer.id)).scalar()
    total_farms = db.query(func.count(Farm.id)).scalar()
    
    # Active schedules (pending and future)
    active_schedules = db.query(func.count(IrrigationSchedule.id)).filter(
        and_(
            IrrigationSchedule.recommended_date >= today,
            IrrigationSchedule.status == IrrigationStatusEnum.PENDING
        )
    ).scalar()
    
    # Notifications sent today
    notifications_today = db.query(func.count(NotificationLog.id)).filter(
        func.date(NotificationLog.sent_at) == today
    ).scalar()
    
    # Farmers registered this month
    farmers_this_month = db.query(func.count(Farmer.id)).filter(
        func.date(Farmer.created_at) >= month_start
    ).scalar()
    
    return SystemStats(
        total_farmers=total_farmers or 0,
        total_farms=total_farms or 0,
        active_schedules=active_schedules or 0,
        notifications_sent_today=notifications_today or 0,
        farmers_registered_this_month=farmers_this_month or 0
    )


@router.get("/farmers", response_model=List[AdminFarmerResponse])
def get_all_farmers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all farmers (paginated)"""
    farmers_query = db.query(Farmer).offset(skip).limit(limit)
    farmers = farmers_query.all()
    
    result = []
    for farmer in farmers:
        # Count farms for each farmer
        farms_count = db.query(func.count(Farm.id)).filter(Farm.farmer_id == farmer.id).scalar()
        
        # Get last notification as proxy for last activity
        last_notification = db.query(NotificationLog).filter(
            NotificationLog.farmer_id == farmer.id
        ).order_by(NotificationLog.sent_at.desc()).first()
        
        farmer_data = AdminFarmerResponse(
            **farmer.__dict__,
            farms_count=farms_count or 0,
            last_active=last_notification.sent_at if last_notification else None
        )
        result.append(farmer_data)
    
    return result


@router.get("/reports")
def generate_usage_reports(
    db: Session = Depends(get_db),
    days: int = 30
):
    """Generate usage reports"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Farmers registered in period
    new_farmers = db.query(func.count(Farmer.id)).filter(
        Farmer.created_at >= start_date
    ).scalar()
    
    # Farms created in period
    new_farms = db.query(func.count(Farm.id)).filter(
        Farm.created_at >= start_date
    ).scalar()
    
    # Notifications sent in period
    notifications_sent = db.query(func.count(NotificationLog.id)).filter(
        NotificationLog.sent_at >= start_date
    ).scalar()
    
    # Irrigation schedules created in period
    schedules_created = db.query(func.count(IrrigationSchedule.id)).filter(
        IrrigationSchedule.created_at >= start_date
    ).scalar()
    
    # Active vs inactive farmers
    active_farmers = db.query(func.count(Farmer.id)).filter(Farmer.is_active == True).scalar()
    inactive_farmers = db.query(func.count(Farmer.id)).filter(Farmer.is_active == False).scalar()
    
    # Verified vs unverified farmers
    verified_farmers = db.query(func.count(Farmer.id)).filter(Farmer.is_verified == True).scalar()
    unverified_farmers = db.query(func.count(Farmer.id)).filter(Farmer.is_verified == False).scalar()
    
    # Most common crops
    crop_stats = db.query(
        Farm.crop_type,
        func.count(Farm.id).label('count')
    ).group_by(Farm.crop_type).order_by(func.count(Farm.id).desc()).limit(10).all()
    
    # Language preferences
    language_stats = db.query(
        Farmer.language_preference,
        func.count(Farmer.id).label('count')
    ).group_by(Farmer.language_preference).all()
    
    return {
        "period_days": days,
        "summary": {
            "new_farmers": new_farmers or 0,
            "new_farms": new_farms or 0,
            "notifications_sent": notifications_sent or 0,
            "schedules_created": schedules_created or 0
        },
        "farmer_status": {
            "active": active_farmers or 0,
            "inactive": inactive_farmers or 0,
            "verified": verified_farmers or 0,
            "unverified": unverified_farmers or 0
        },
        "top_crops": [{"crop": crop, "count": count} for crop, count in crop_stats],
        "language_distribution": [{"language": str(lang), "count": count} for lang, count in language_stats]
    }
