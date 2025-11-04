from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.endpoints.auth import get_current_active_farmer
from app.models import Farmer, NotificationLog, NotificationChannelEnum, NotificationStatusEnum
from app.schemas import NotificationCreate, NotificationResponse
from app.services.notification_service import notification_service

router = APIRouter()


@router.post("/send-sms")
async def send_sms_notification(
    phone_number: str,
    message: str,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Send SMS notification"""
    # Send SMS
    success = await notification_service.send_sms(
        phone_number, 
        message, 
        current_farmer.language_preference
    )
    
    # Log notification
    notification_log = NotificationLog(
        farmer_id=current_farmer.id,
        message=message,
        channel=NotificationChannelEnum.SMS,
        status=NotificationStatusEnum.SENT if success else NotificationStatusEnum.FAILED
    )
    
    db.add(notification_log)
    db.commit()
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send SMS"
        )
    
    return {"message": "SMS sent successfully"}


@router.post("/send-email")
async def send_email_notification(
    email: str,
    subject: str,
    message: str,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Send email notification"""
    # Send email
    success = await notification_service.send_email(
        email, 
        subject, 
        message, 
        current_farmer.language_preference
    )
    
    # Log notification
    notification_log = NotificationLog(
        farmer_id=current_farmer.id,
        message=f"Subject: {subject}\n\n{message}",
        channel=NotificationChannelEnum.EMAIL,
        status=NotificationStatusEnum.SENT if success else NotificationStatusEnum.FAILED
    )
    
    db.add(notification_log)
    db.commit()
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send email"
        )
    
    return {"message": "Email sent successfully"}


@router.get("/history", response_model=List[NotificationResponse])
def get_notification_history(
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get notification history"""
    notifications = db.query(NotificationLog).filter(
        NotificationLog.farmer_id == current_farmer.id
    ).order_by(NotificationLog.sent_at.desc()).limit(limit).all()
    
    return notifications
