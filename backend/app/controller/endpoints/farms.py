from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.endpoints.auth import get_current_active_farmer
from app.models import Farmer, Farm
from app.schemas import FarmCreate, FarmUpdate, FarmResponse

router = APIRouter()


@router.post("/", response_model=FarmResponse)
def create_farm(
    farm_data: FarmCreate,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Create a new farm"""
    db_farm = Farm(
        farmer_id=current_farmer.id,
        **farm_data.dict()
    )
    
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    
    return db_farm


@router.get("/", response_model=List[FarmResponse])
def get_farms(
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get all farms for logged-in farmer"""
    farms = db.query(Farm).filter(Farm.farmer_id == current_farmer.id).all()
    return farms


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Get specific farm"""
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    return farm


@router.put("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: UUID,
    farm_update: FarmUpdate,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Update farm details"""
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    update_data = farm_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm, field, value)
    
    db.commit()
    db.refresh(farm)
    
    return farm


@router.delete("/{farm_id}")
def delete_farm(
    farm_id: UUID,
    current_farmer: Farmer = Depends(get_current_active_farmer),
    db: Session = Depends(get_db)
):
    """Delete farm"""
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.farmer_id == current_farmer.id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    db.delete(farm)
    db.commit()
    
    return {"message": "Farm deleted successfully"}
