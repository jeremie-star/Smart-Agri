from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import re

from app.models import LanguageEnum, NotificationChannelEnum, NotificationStatusEnum, IrrigationStatusEnum


# Base schemas
class FarmerBase(BaseModel):
    phone_number: str
    name: str
    language_preference: LanguageEnum = LanguageEnum.ENGLISH
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        # Basic phone number validation for African countries
        pattern = r'^\+?[1-9]\d{1,14}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid phone number format')
        return v


class FarmerCreate(FarmerBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    language_preference: Optional[LanguageEnum] = None


class FarmerResponse(FarmerBase):
    id: UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FarmerLogin(BaseModel):
    phone_number: str
    password: str


# Farm schemas
class FarmBase(BaseModel):
    crop_type: str
    land_size: float
    latitude: float
    longitude: float
    soil_type: Optional[str] = None
    
    @field_validator('land_size')
    @classmethod
    def validate_land_size(cls, v):
        if v <= 0:
            raise ValueError('Land size must be positive')
        return v
    
    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v
    
    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    crop_type: Optional[str] = None
    land_size: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = None


class FarmResponse(FarmBase):
    id: UUID
    farmer_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Irrigation Schedule schemas
class IrrigationScheduleBase(BaseModel):
    recommended_date: datetime
    water_amount: float
    weather_condition: str
    ai_reasoning: str
    status: IrrigationStatusEnum = IrrigationStatusEnum.PENDING


class IrrigationScheduleCreate(BaseModel):
    farm_id: UUID


class IrrigationScheduleResponse(IrrigationScheduleBase):
    id: UUID
    farm_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Notification schemas
class NotificationCreate(BaseModel):
    farmer_id: UUID
    message: str
    channel: NotificationChannelEnum


class NotificationResponse(BaseModel):
    id: UUID
    farmer_id: UUID
    message: str
    channel: NotificationChannelEnum
    status: NotificationStatusEnum
    sent_at: datetime
    
    class Config:
        from_attributes = True


# Weather schemas
class WeatherData(BaseModel):
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    description: str
    date: datetime


class WeatherForecast(BaseModel):
    current: WeatherData
    forecast: List[WeatherData]


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    phone_number: Optional[str] = None


class PhoneVerification(BaseModel):
    phone_number: str
    otp_code: str


# Admin schemas
class SystemStats(BaseModel):
    total_farmers: int
    total_farms: int
    active_schedules: int
    notifications_sent_today: int
    farmers_registered_this_month: int


class AdminFarmerResponse(FarmerResponse):
    farms_count: int
    last_active: Optional[datetime] = None


# Error schemas
class ErrorResponse(BaseModel):
    error: str
    code: str
    details: dict = {}
