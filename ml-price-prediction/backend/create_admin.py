"""
Script to set admin@example.com as admin
Run this after the database is created
"""
from sqlalchemy.orm import Session
from database import SessionLocal
import models

def set_admin():
    db = SessionLocal()
    try:
        # Find user by email
        user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
        
        if user:
            user.is_admin = 1
            db.commit()
            print(f"✅ Successfully set {user.email} as admin")
        else:
            print("❌ User admin@example.com not found. Please register this account first.")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    set_admin()
