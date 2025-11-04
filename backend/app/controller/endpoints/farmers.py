from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.endpoints.auth import get_current_active_farmer
from app.models import Farmer
from app.schemas import FarmerResponse, FarmerUpdate

router = APIRouter()


@router.get("/profile", response_model=FarmerResponse)
def get_farmer_profile(current_farmer: Farmer = Depends(get_current_active_farmer)):
    """Get current farmer profile"""
    return current_farmer


@router.put("/profile", response_model=FarmerResponse)
def update_farmer_profile(
    farmer_update: FarmerUpdate,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Update farmer profile"""
    update_data = farmer_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_farmer, field, value)
    
    db.commit()
    db.refresh(current_farmer)
    
    return current_farmer


@router.delete("/profile")
def delete_farmer_account(
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Delete farmer account (soft delete)"""
    current_farmer.is_active = False
    db.commit()
    
    return {"message": "Account deactivated successfully"}
