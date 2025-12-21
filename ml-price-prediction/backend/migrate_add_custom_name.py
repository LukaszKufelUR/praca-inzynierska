"""
Migration script to add custom_name column to prediction_history table
Run this once to update the database schema
"""

import sqlite3
import os

# Path to database
db_path = "ml_predictions.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found!")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column already exists
    cursor.execute("PRAGMA table_info(prediction_history)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'custom_name' in columns:
        print("✅ Column 'custom_name' already exists!")
    else:
        # Add the column
        cursor.execute("ALTER TABLE prediction_history ADD COLUMN custom_name TEXT")
        conn.commit()
        print("✅ Successfully added 'custom_name' column to prediction_history table!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nDone! You can now restart the backend server.")
