from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import random
import string

from app.core.database import get_db
from app.core.security import create_access_token, verify_token, get_password_hash, verify_password
from app.models import Farmer
from app.schemas import FarmerCreate, FarmerLogin, Token, PhoneVerification, FarmerResponse
from app.services.notification_service import notification_service

router = APIRouter()
security = HTTPBearer()

# In-memory OTP storage (in production, use Redis)
otp_storage = {}


def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def get_current_farmer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current authenticated farmer"""
    payload = verify_token(credentials.credentials)
    phone_number = payload.get("sub")
    
    if phone_number is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == phone_number).first()
    if farmer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Farmer not found"
        )
    
    return farmer


def get_current_active_farmer(current_farmer: Farmer = Depends(get_current_farmer)):
    """Get current active farmer"""
    if not current_farmer.is_active:
        raise HTTPException(status_code=400, detail="Inactive farmer")
    return current_farmer


@router.post("/register", response_model=Token)
async def register_farmer(farmer_data: FarmerCreate, db: Session = Depends(get_db)):
    """Register a new farmer"""
    # Check if farmer already exists
    existing_farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_data.phone_number).first()
    if existing_farmer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create new farmer
    hashed_password = get_password_hash(farmer_data.password)
    db_farmer = Farmer(
        phone_number=farmer_data.phone_number,
        name=farmer_data.name,
        language_preference=farmer_data.language_preference,
        password_hash=hashed_password
    )
    
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    
    # Generate and send OTP for phone verification
    otp = generate_otp()
    otp_storage[farmer_data.phone_number] = otp
    
    message = f"Welcome to Smart Irrigation Assistant! Your verification code is: {otp}"
    await notification_service.send_sms(farmer_data.phone_number, message, farmer_data.language_preference)
    
    # Create access token
    access_token = create_access_token(data={"sub": db_farmer.phone_number})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login_farmer(farmer_data: FarmerLogin, db: Session = Depends(get_db)):
    """Login farmer"""
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_data.phone_number).first()
    
    if not farmer or not verify_password(farmer_data.password, farmer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password"
        )
    
    if not farmer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    access_token = create_access_token(data={"sub": farmer.phone_number})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/verify-phone")
async def verify_phone(verification_data: PhoneVerification, db: Session = Depends(get_db)):
    """Verify phone number with OTP"""
    stored_otp = otp_storage.get(verification_data.phone_number)
    
    if not stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP not found or expired"
        )
    
    if stored_otp != verification_data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # Mark farmer as verified
    farmer = db.query(Farmer).filter(Farmer.phone_number == verification_data.phone_number).first()
    if farmer:
        farmer.is_verified = True
        db.commit()
    
    # Remove OTP from storage
    del otp_storage[verification_data.phone_number]
    
    return {"message": "Phone number verified successfully"}


@router.post("/resend-otp")
async def resend_otp(phone_number: str, db: Session = Depends(get_db)):
    """Resend OTP for phone verification"""
    farmer = db.query(Farmer).filter(Farmer.phone_number == phone_number).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    if farmer.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already verified"
        )
    
    # Generate and send new OTP
    otp = generate_otp()
    otp_storage[phone_number] = otp
    
    message = f"Your new verification code is: {otp}"
    await notification_service.send_sms(phone_number, message, farmer.language_preference)
    
    return {"message": "OTP sent successfully"}
