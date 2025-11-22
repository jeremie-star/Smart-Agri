from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.api.endpoints.auth import get_current_admin
from app.models import Farmer, Farm, NotificationLog, IrrigationSchedule, IrrigationStatusEnum, NotificationStatusEnum, NotificationChannelEnum
from app.schemas import SystemStats, AdminFarmerResponse, FarmResponse, IrrigationScheduleResponse, NotificationResponse, FarmUpdate
from app.services.notification_service import notification_service
from uuid import UUID
from fastapi import Body
import asyncio

router = APIRouter()


@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    current_admin: Farmer = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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
    current_admin: Farmer = Depends(get_current_admin),
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
    current_admin: Farmer = Depends(get_current_admin),
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


@router.get("/farms/all")
def admin_get_all_farms(
    current_admin: Farmer = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Admin: get all farms with farmer info"""
    farms = db.query(Farm).offset(skip).limit(limit).all()
    result = []
    for farm in farms:
        result.append({
            "id": str(farm.id),
            "crop_type": farm.crop_type,
            "land_size": farm.land_size,
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "soil_type": farm.soil_type,
            "farmer_id": str(farm.farmer_id),
            "farmer_name": farm.farmer.name if farm.farmer else None,
            "created_at": farm.created_at
        })
    return result


@router.get("/farms/{farm_id}")
def admin_get_farm(farm_id: UUID, current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return {
        "id": str(farm.id),
        "crop_type": farm.crop_type,
        "land_size": farm.land_size,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "soil_type": farm.soil_type,
        "farmer_id": str(farm.farmer_id),
        "farmer_name": farm.farmer.name if farm.farmer else None,
        "created_at": farm.created_at
    }


@router.put("/farms/{farm_id}")
def admin_update_farm(
    farm_id: UUID,
    farm_update: FarmUpdate,
    current_admin: Farmer = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    update_data = farm_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(farm, k, v)
    db.commit()
    db.refresh(farm)
    return {
        "id": str(farm.id),
        "crop_type": farm.crop_type,
        "land_size": farm.land_size,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "soil_type": farm.soil_type,
        "farmer_id": str(farm.farmer_id),
        "farmer_name": farm.farmer.name if farm.farmer else None,
        "created_at": farm.created_at
    }


@router.delete("/farms/{farm_id}")
def admin_delete_farm(farm_id: UUID, current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    db.delete(farm)
    db.commit()
    return {"message": "Farm deleted"}


@router.get("/schedules/all")
def admin_get_schedules(current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    schedules = db.query(IrrigationSchedule).offset(skip).limit(limit).all()
    result = []
    for s in schedules:
        result.append({
            "id": str(s.id),
            "farm_id": str(s.farm_id),
            "farm_name": s.farm.crop_type if s.farm else None,
            "recommended_date": s.recommended_date,
            "water_amount": s.water_amount,
            "weather_condition": s.weather_condition,
            "ai_reasoning": s.ai_reasoning,
            "status": s.status.value if s.status else None,
            "created_at": s.created_at
        })
    return result


@router.put("/schedules/{schedule_id}")
def admin_update_schedule(schedule_id: UUID, payload: dict = Body(...), current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db)):
    schedule = db.query(IrrigationSchedule).filter(IrrigationSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    allowed = ["recommended_date", "water_amount", "weather_condition", "ai_reasoning", "status"]
    for k, v in payload.items():
        if k in allowed:
            setattr(schedule, k, v)
    db.commit()
    db.refresh(schedule)
    return {
        "id": str(schedule.id),
        "farm_id": str(schedule.farm_id),
        "recommended_date": schedule.recommended_date,
        "water_amount": schedule.water_amount,
        "weather_condition": schedule.weather_condition,
        "ai_reasoning": schedule.ai_reasoning,
        "status": schedule.status.value if schedule.status else None,
        "created_at": schedule.created_at
    }


@router.post("/schedules/{schedule_id}/run")
async def admin_run_schedule(schedule_id: UUID, current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db)):
    schedule = db.query(IrrigationSchedule).filter(IrrigationSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    farm = schedule.farm
    if not farm:
        raise HTTPException(status_code=400, detail="Associated farm not found")
    farmer = farm.farmer
    if not farmer:
        raise HTTPException(status_code=400, detail="Associated farmer not found")

    # Create message and send via notification service
    msg = notification_service.create_irrigation_message(farm.crop_type, schedule.water_amount, schedule.weather_condition or "", schedule.ai_reasoning or "")
    success = False
    if settings.debug:
        # In dev just mark as sent
        success = True
    else:
        # attempt SMS send
        try:
            success = await notification_service.send_sms(farmer.phone_number, msg, farmer.language_preference)
        except Exception as e:
            print(f"Notification send error: {e}")
            success = False

    # Create log
    status = NotificationStatusEnum.SENT if success else NotificationStatusEnum.FAILED
    log = NotificationLog(farmer_id=farmer.id, message=msg, channel=NotificationChannelEnum.SMS, status=status)
    db.add(log)
    schedule.status = IrrigationStatusEnum.SENT if success else schedule.status
    db.commit()
    db.refresh(schedule)

    return {"success": success, "log_id": str(log.id)}


@router.get("/notifications/all")
def admin_get_notifications(current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    logs = db.query(NotificationLog).order_by(NotificationLog.sent_at.desc()).offset(skip).limit(limit).all()
    result = []
    for l in logs:
        result.append({
            "id": str(l.id),
            "farmer_id": str(l.farmer_id),
            "farmer_name": l.farmer.name if l.farmer else None,
            "message": l.message,
            "channel": l.channel.value if l.channel else None,
            "status": l.status.value if l.status else None,
            "sent_at": l.sent_at
        })
    return result


from pydantic import BaseModel
from typing import List

class BulkNotification(BaseModel):
    farmer_ids: List[UUID]
    message: str
    channel: NotificationChannelEnum


@router.post("/notifications/send")
async def admin_send_notifications(payload: BulkNotification, current_admin: Farmer = Depends(get_current_admin), db: Session = Depends(get_db)):
    results = []
    for fid in payload.farmer_ids:
        farmer = db.query(Farmer).filter(Farmer.id == fid).first()
        if not farmer:
            results.append({"farmer_id": str(fid), "success": False, "error": "Farmer not found"})
            continue
        success = False
        try:
            if payload.channel == NotificationChannelEnum.SMS:
                success = await notification_service.send_sms(farmer.phone_number, payload.message, farmer.language_preference)
            elif payload.channel == NotificationChannelEnum.EMAIL:
                success = await notification_service.send_email(farmer.phone_number, "Notification", payload.message, farmer.language_preference)
            else:
                # other channels not implemented
                success = False
        except Exception as e:
            print(f"Send error for {farmer.phone_number}: {e}")
            success = False

        log = NotificationLog(farmer_id=farmer.id, message=payload.message, channel=payload.channel, status=(NotificationStatusEnum.SENT if success else NotificationStatusEnum.FAILED))
        db.add(log)
        db.commit()
        results.append({"farmer_id": str(fid), "success": success, "log_id": str(log.id)})

    return {"results": results}
