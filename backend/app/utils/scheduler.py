from celery import Celery
from datetime import datetime, timedelta
from sqlalchemy.orm import sessionmaker
from sqlalchemy import and_

from app.core.config import settings
from app.core.database import engine
from app.models import Farm, IrrigationSchedule, Farmer, NotificationLog, IrrigationStatusEnum, NotificationChannelEnum, NotificationStatusEnum
from app.services.notification_service import notification_service

# Create Celery app
celery_app = Celery(
    "smart_irrigation",
    broker=settings.redis_url,
    backend=settings.redis_url
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone=settings.scheduler_timezone,
    enable_utc=True,
    beat_schedule={
        'send-irrigation-reminders': {
            'task': 'app.utils.scheduler.send_irrigation_reminders',
            'schedule': 60.0 * 60.0 * 24.0,  # Daily at midnight
            'args': ()
        },
    }
)

# Create database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@celery_app.task
def send_irrigation_reminders():
    """Send irrigation reminders to farmers 24 hours before irrigation"""
    db = SessionLocal()
    
    try:
        # Get tomorrow's date
        tomorrow = datetime.utcnow().date() + timedelta(days=1)
        
        # Get all pending irrigation schedules for tomorrow
        schedules = db.query(IrrigationSchedule).join(Farm).join(Farmer).filter(
            and_(
                IrrigationSchedule.recommended_date.cast(db.Date) == tomorrow,
                IrrigationSchedule.status == IrrigationStatusEnum.PENDING,
                Farmer.is_active == True,
                Farmer.is_verified == True
            )
        ).all()
        
        for schedule in schedules:
            farmer = schedule.farm.farmer
            farm = schedule.farm
            
            # Create notification message
            message = notification_service.create_irrigation_message(
                crop_type=farm.crop_type,
                water_amount=schedule.water_amount,
                weather_condition=schedule.weather_condition,
                reasoning=schedule.ai_reasoning
            )
            
            # Send SMS notification
            sms_success = False
            try:
                sms_success = notification_service.send_sms(
                    farmer.phone_number,
                    message,
                    farmer.language_preference
                )
            except Exception as e:
                print(f"SMS sending error for farmer {farmer.id}: {e}")
            
            # Log SMS notification
            sms_log = NotificationLog(
                farmer_id=farmer.id,
                message=message,
                channel=NotificationChannelEnum.SMS,
                status=NotificationStatusEnum.SENT if sms_success else NotificationStatusEnum.FAILED
            )
            db.add(sms_log)
            
            # If farmer has email and SMS failed, try email
            if not sms_success and hasattr(farmer, 'email') and farmer.email:
                try:
                    email_content = notification_service.create_irrigation_email_html(
                        farmer_name=farmer.name,
                        crop_type=farm.crop_type,
                        water_amount=schedule.water_amount,
                        weather_condition=schedule.weather_condition,
                        reasoning=schedule.ai_reasoning,
                        farm_location=f"Lat: {farm.latitude}, Lon: {farm.longitude}"
                    )
                    
                    email_success = notification_service.send_email(
                        farmer.email,
                        "Irrigation Reminder - Smart Irrigation Assistant",
                        email_content,
                        farmer.language_preference
                    )
                    
                    # Log email notification
                    email_log = NotificationLog(
                        farmer_id=farmer.id,
                        message=email_content,
                        channel=NotificationChannelEnum.EMAIL,
                        status=NotificationStatusEnum.SENT if email_success else NotificationStatusEnum.FAILED
                    )
                    db.add(email_log)
                    
                except Exception as e:
                    print(f"Email sending error for farmer {farmer.id}: {e}")
            
            # Update schedule status to sent
            if sms_success:
                schedule.status = IrrigationStatusEnum.SENT
        
        db.commit()
        print(f"Processed {len(schedules)} irrigation reminders")
        
    except Exception as e:
        print(f"Error in send_irrigation_reminders: {e}")
        db.rollback()
    finally:
        db.close()


@celery_app.task
def cleanup_old_data():
    """Clean up old notification logs and completed irrigation schedules"""
    db = SessionLocal()
    
    try:
        # Delete notification logs older than 90 days
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        deleted_notifications = db.query(NotificationLog).filter(
            NotificationLog.sent_at < cutoff_date
        ).delete()
        
        # Delete completed irrigation schedules older than 30 days
        schedule_cutoff = datetime.utcnow() - timedelta(days=30)
        
        deleted_schedules = db.query(IrrigationSchedule).filter(
            and_(
                IrrigationSchedule.created_at < schedule_cutoff,
                IrrigationSchedule.status == IrrigationStatusEnum.COMPLETED
            )
        ).delete()
        
        db.commit()
        print(f"Cleaned up {deleted_notifications} old notifications and {deleted_schedules} old schedules")
        
    except Exception as e:
        print(f"Error in cleanup_old_data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == '__main__':
    celery_app.start()
