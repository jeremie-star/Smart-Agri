from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Application settings
    app_name: str = "Smart Irrigation Assistant"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Database
    database_url: str
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    
    # Weather API
    openweather_api_key: str
    openweather_base_url: str = "https://api.openweathermap.org/data/2.5"
    
    # AI API Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    cohere_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    # SMS Configuration
    africas_talking_api_key: Optional[str] = None
    africas_talking_username: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    # Email Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    sendgrid_from_email: Optional[str] = None
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # CORS
    cors_origins_string: str = "https://smart-agri-five.vercel.app"
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_string.split(",")]
    
    # Rate Limiting (more generous for development)
    rate_limit_requests: int = 1000  # Increased from 100 to 1000
    rate_limit_window: int = 60  # Changed from 3600 (1 hour) to 60 seconds
    
    # Scheduler
    scheduler_timezone: str = "Africa/Kigali"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
