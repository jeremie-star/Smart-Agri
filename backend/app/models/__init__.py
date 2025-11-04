from sqlalchemy import Column, String, Float, DateTime, Text, Enum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class LanguageEnum(enum.Enum):
    ENGLISH = "English"
    SWAHILI = "Swahili"
    KINYARWANDA = "Kinyarwanda"


class NotificationChannelEnum(enum.Enum):
    SMS = "SMS"
    EMAIL = "Email"
    USSD = "USSD"
    WEB = "Web"


class NotificationStatusEnum(enum.Enum):
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"


class IrrigationStatusEnum(enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    COMPLETED = "completed"


class Farmer(Base):
    __tablename__ = "farmers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    language_preference = Column(Enum(LanguageEnum), default=LanguageEnum.ENGLISH)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="farmer")


class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    crop_type = Column(String, nullable=False)
    land_size = Column(Float, nullable=False)  # in acres
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil_type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    farmer = relationship("Farmer", back_populates="farms")
    irrigation_schedules = relationship("IrrigationSchedule", back_populates="farm", cascade="all, delete-orphan")


class IrrigationSchedule(Base):
    __tablename__ = "irrigation_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=False)
    recommended_date = Column(DateTime(timezone=True), nullable=False)
    water_amount = Column(Float, nullable=False)  # in liters
    weather_condition = Column(String)
    ai_reasoning = Column(Text)
    status = Column(Enum(IrrigationStatusEnum), default=IrrigationStatusEnum.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    farm = relationship("Farm", back_populates="irrigation_schedules")


class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(Enum(NotificationChannelEnum), nullable=False)
    status = Column(Enum(NotificationStatusEnum), nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    farmer = relationship("Farmer", back_populates="notifications")
