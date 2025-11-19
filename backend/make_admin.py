"""
Script to make a farmer an admin
Usage: python make_admin.py +250788123456
"""
import sys
from app.core.database import SessionLocal
from app.models import Farmer, RoleEnum

def make_admin(phone_number: str):
    db = SessionLocal()
    try:
        farmer = db.query(Farmer).filter(Farmer.phone_number == phone_number).first()
        
        if not farmer:
            print(f"❌ Farmer with phone number {phone_number} not found!")
            print("\nAvailable farmers:")
            farmers = db.query(Farmer).all()
            for f in farmers:
                print(f"  - {f.name}: {f.phone_number}")
            return
        
        farmer.role = RoleEnum.ADMIN
        db.commit()
        
        print(f"✅ Success! {farmer.name} ({farmer.phone_number}) is now an ADMIN!")
        print(f"   Role: {farmer.role.value}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <phone_number>")
        print("Example: python make_admin.py +250788123456")
        sys.exit(1)
    
    phone_number = sys.argv[1]
    make_admin(phone_number)
