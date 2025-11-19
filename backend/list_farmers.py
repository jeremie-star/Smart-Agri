"""
Script to list all farmers and their roles
Usage: python list_farmers.py
"""
from app.core.database import SessionLocal
from app.models import Farmer

def list_farmers():
    db = SessionLocal()
    try:
        farmers = db.query(Farmer).all()
        
        if not farmers:
            print("No farmers found in database.")
            return
        
        print(f"\n📋 Total Farmers: {len(farmers)}\n")
        print(f"{'Name':<25} {'Phone':<20} {'Role':<15} {'Active':<10} {'Verified':<10}")
        print("-" * 80)
        
        for farmer in farmers:
            active = "✓" if farmer.is_active else "✗"
            verified = "✓" if farmer.is_verified else "✗"
            print(f"{farmer.name:<25} {farmer.phone_number:<20} {farmer.role.value:<15} {active:<10} {verified:<10}")
        
        print("\n" + "=" * 80)
        
        # Count by role
        admin_count = sum(1 for f in farmers if f.role.value in ['admin', 'super_admin'])
        farmer_count = sum(1 for f in farmers if f.role.value == 'farmer')
        
        print(f"Admins: {admin_count} | Farmers: {farmer_count}")
        print("\nTo make a user admin, run:")
        print("  python make_admin.py <phone_number>")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_farmers()
