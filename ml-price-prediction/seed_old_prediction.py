import sqlite3
import json
from datetime import datetime, timedelta
import random

# Connect to database
conn = sqlite3.connect('backend/ml_predictions.db')
cursor = conn.cursor()

# Get a user ID (assuming user 1 exists)
cursor.execute("SELECT id FROM users LIMIT 1")
user = cursor.fetchone()
if not user:
    print("No user found. Please register a user first.")
    exit()

user_id = user[0]
asset_symbol = "BTC-USD"
asset_name = "Bitcoin"
days_ago = 60
periods = 30

# Create fake prediction data
start_date = datetime.now() - timedelta(days=days_ago)
prophet_data = []
lstm_data = []

current_price = 50000
for i in range(periods):
    date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
    
    # Fake Prophet prediction (trending up)
    prophet_val = current_price * (1 + (i * 0.005)) + random.uniform(-500, 500)
    prophet_data.append({
        "ds": date,
        "yhat": prophet_val,
        "yhat_lower": prophet_val - 1000,
        "yhat_upper": prophet_val + 1000
    })
    
    # Fake LSTM prediction (trending down)
    lstm_val = current_price * (1 - (i * 0.002)) + random.uniform(-500, 500)
    lstm_data.append({
        "ds": date,
        "yhat": lstm_val
    })

# Insert into DB
sql = """
INSERT INTO prediction_history 
(user_id, asset_symbol, asset_name, prediction_period, prophet_data, lstm_data, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
"""

cursor.execute(sql, (
    user_id, 
    asset_symbol, 
    asset_name, 
    periods, 
    json.dumps(prophet_data), 
    json.dumps(lstm_data), 
    start_date.strftime('%Y-%m-%d %H:%M:%S')
))

conn.commit()
print(f"Inserted fake prediction for {asset_symbol} created at {start_date}")
conn.close()
