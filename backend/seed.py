"""
Run this ONCE after setting up the database to seed initial data.
Usage: python seed.py
"""
from database import SessionLocal, engine, Base
import models
from utils.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    print("🌱 Seeding database...")

    # Create admin if not exists
    if not db.query(models.Admin).first():
        admin = models.Admin(
            username="admin",
            email="admin@kamaurentals.com",
            full_name="Murithi Admin",
            hashed_password=hash_password("admin123"),
        )
        db.add(admin)
        print("✅ Admin created: username=admin, password=admin123")
        print("   ⚠️  Change password after first login!")

    # Create the 11 houses
    houses_data = [
        # Bedsitters
        {"name": "Bedsitter B1", "house_type": "bedsitter", "rent_amount": 8000, "floor": "Ground"},
        {"name": "Bedsitter B2", "house_type": "bedsitter", "rent_amount": 8000, "floor": "Ground"},
        {"name": "Bedsitter B3", "house_type": "bedsitter", "rent_amount": 8000, "floor": "Ground"},
        {"name": "Bedsitter B4", "house_type": "bedsitter", "rent_amount": 8000, "floor": "First"},
        {"name": "Bedsitter B5", "house_type": "bedsitter", "rent_amount": 8500, "floor": "First"},
        {"name": "Bedsitter B6", "house_type": "bedsitter", "rent_amount": 8000, "floor": "First"},
        # Single Rooms
        {"name": "Single S1", "house_type": "single_room", "rent_amount": 5500, "floor": "Ground"},
        {"name": "Single S2", "house_type": "single_room", "rent_amount": 5500, "floor": "Ground"},
        {"name": "Single S3", "house_type": "single_room", "rent_amount": 5500, "floor": "Ground"},
        {"name": "Single S4", "house_type": "single_room", "rent_amount": 5500, "floor": "First"},
        {"name": "Single S5", "house_type": "single_room", "rent_amount": 5500, "floor": "First"},
        # One BedRooms
        {"name": "Onebedroom E1", "house_type": "one_bedroom", "rent_amount": 9000, "floor": "Ground"},
        {"name": "Onebedroom E2", "house_type": "one_bedroom", "rent_amount": 9000, "floor": "Ground"},
    ]

    created = 0
    for h_data in houses_data:
        exists = db.query(models.House).filter(models.House.name == h_data["name"]).first()
        if not exists:
            house = models.House(**h_data)
            db.add(house)
            created += 1

    db.commit()
    print(f"✅ {created} houses created ({11 - created} already existed)")
    print("\n🎉 Seeding complete! You can now start the server.")
    print("   Run: uvicorn main:app --reload")

if __name__ == "__main__":
    seed()
    db.close()
