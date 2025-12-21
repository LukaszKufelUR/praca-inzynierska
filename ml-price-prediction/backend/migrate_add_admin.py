"""
Migration script to add is_admin column to users table
"""
import sqlite3
import os

def migrate_database():
    db_path = "ml_predictions.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_admin' in columns:
            print("✅ Column 'is_admin' already exists")
        else:
            # Add is_admin column
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
            conn.commit()
            print("✅ Successfully added 'is_admin' column to users table")
        
        # Set admin@example.com as admin
        cursor.execute("UPDATE users SET is_admin = 1 WHERE email = ?", ("admin@example.com",))
        if cursor.rowcount > 0:
            conn.commit()
            print("✅ Successfully set admin@example.com as admin")
        else:
            print("⚠️  User admin@example.com not found. Please register this account first.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
