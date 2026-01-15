from sqlalchemy.orm import Session
from database import SessionLocal
import models
import auth

def create_initial_admin():
    db = SessionLocal()
    try:
        # Sprawdzamy czy admin już istnieje
        admin_email = "admin@example.com"
        existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if not existing_admin:
            print(f"🚀 Creating initial admin user: {admin_email}")
            admin_user = models.User(
                email=admin_email,
                hashed_password=auth.get_password_hash("admin123"), # Domyślne hasło
                is_admin=1
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin user created successfully!")
        else:
            print("ℹ️ Admin user already exists.")
            
    except Exception as e:
        print(f"❌ Error creating initial admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin()
