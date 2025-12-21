"""
FastAPI Backend for ML Price Prediction System
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import pandas as pd
from datetime import datetime
from datetime import datetime
import traceback
import json
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

from src.config import ASSETS, PREDICTION_HORIZONS
from src.data_fetcher import DataFetcher
from src.models.prophet_model import ProphetPredictor
from src.models.lstm_model import LSTMPredictor

# Import authentication and database
import models
import schemas
import auth
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)


# Initialize FastAPI app
app = FastAPI(
    title="ML Price Prediction API",
    description="API for predicting stock and crypto prices using Prophet and LSTM",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_fetcher = DataFetcher()


# Pydantic models for request/response
class PredictionRequest(BaseModel):
    symbol: str
    periods: int = 30
    period: str = "2y"
    model_type: str = "prophet"  # "prophet" or "lstm"


class PredictionResponse(BaseModel):
    symbol: str
    model_type: str
    predictions: List[Dict]
    metrics: Dict
    historical_data: Optional[List[Dict]] = None


class AssetInfo(BaseModel):
    symbol: str
    name: str
    type: str


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ML Price Prediction API",
        "version": "1.0.0",
        "endpoints": [
            "/api/assets",
            "/api/data/{symbol}",
            "/api/predict/prophet",
            "/api/predict/lstm",
            "/api/predict/both"
        ]
    }


@app.get("/api/assets", response_model=List[AssetInfo])
async def get_assets():
    """Get list of all available assets"""
    assets = []
    for symbol, info in ASSETS.items():
        assets.append({
            "symbol": symbol,
            "name": info["name"],
            "type": info["type"]
        })
    return assets


@app.get("/api/assets/search")
async def search_assets(query: str):
    """Search for assets by name or symbol"""
    if not query or len(query) < 2:
        return []
        
    try:
        # Search using DataFetcher
        results = data_fetcher.search_assets(query)
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []


@app.get("/api/data/{symbol}")
async def get_historical_data(symbol: str, period: str = "2y"):
    """Get historical data for a symbol"""
    # Removed strict validation to allow dynamic assets
    # if symbol not in ASSETS:
    #     raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")
    
    try:
        # Fetch and preprocess data
        df = data_fetcher.fetch_data(symbol, period)
        df = data_fetcher.preprocess_data(df)
        
        # Convert to JSON-serializable format
        data = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']].copy()
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
        
        # Get name from ASSETS if available, otherwise use symbol
        asset_name = ASSETS.get(symbol, {}).get("name", symbol)
        
        return {
            "symbol": symbol,
            "name": asset_name,
            "data": data.to_dict('records')
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/prophet")
async def predict_prophet(request: PredictionRequest):
    """Generate predictions using Prophet model"""
    # Removed strict validation
    # if request.symbol not in ASSETS:
    #     raise HTTPException(status_code=404, detail=f"Asset {request.symbol} not found")
    
    if request.periods not in PREDICTION_HORIZONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Nieprawidłowy okres. Dostępne: {PREDICTION_HORIZONS}"
        )
    
    try:
        # Fetch and preprocess data
        df = data_fetcher.fetch_data(request.symbol)
        df = data_fetcher.preprocess_data(df)
        
        # Train Prophet model
        prophet = ProphetPredictor()
        metrics = prophet.train(df, request.symbol)
        
        # Generate predictions
        forecast = prophet.predict(request.periods)
        
        # Convert to JSON-serializable format
        forecast['ds'] = forecast['ds'].dt.strftime('%Y-%m-%d')
        predictions = forecast.to_dict('records')
        
        return {
            "symbol": request.symbol,
            "model_type": "prophet",
            "predictions": predictions,
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/lstm")
async def predict_lstm(request: PredictionRequest):
    """Generate predictions using LSTM model - TEMPORARILY DISABLED"""
    raise HTTPException(status_code=501, detail="LSTM temporarily disabled for demo")


@app.post("/api/predict/both")
async def predict_both(request: PredictionRequest):
    """Generate predictions using both Prophet and LSTM models"""
    # Removed strict validation
    # if request.symbol not in ASSETS:
    #     raise HTTPException(status_code=404, detail=f"Asset {request.symbol} not found")
    
    if request.periods not in PREDICTION_HORIZONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Nieprawidłowy okres. Dostępne: {PREDICTION_HORIZONS}"
        )
    
    try:
        # Fetch and preprocess data
        df = data_fetcher.fetch_data(request.symbol, request.period)
        df = data_fetcher.preprocess_data(df)
        
        # Train and predict with Prophet
        prophet = ProphetPredictor()
        prophet_metrics = prophet.train(df, request.symbol)
        prophet_forecast = prophet.predict(request.periods)
        prophet_forecast['ds'] = prophet_forecast['ds'].dt.strftime('%Y-%m-%d')
        
        # Train and predict with LSTM
        lstm = LSTMPredictor()
        lstm_metrics = lstm.train(df, request.symbol)
        lstm_forecast = lstm.predict(df, request.periods)
        lstm_forecast['ds'] = lstm_forecast['ds'].dt.strftime('%Y-%m-%d')
        
        # Prepare historical data
        # Return full historical data (or at least same as get_historical_data)
        historical = df[['Date', 'Close']].copy()
        historical['Date'] = historical['Date'].dt.strftime('%Y-%m-%d')
        
        # Helper to clean NaNs for JSON serialization
        def clean_nans(data_list):
            if not data_list: return []
            cleaned = []
            for item in data_list:
                new_item = {}
                for k, v in item.items():
                    if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                        new_item[k] = None
                    else:
                        new_item[k] = v
                cleaned.append(new_item)
            return cleaned

        return {
            "symbol": request.symbol,
            "name": ASSETS.get(request.symbol, {}).get("name", request.symbol),
            "historical_data": clean_nans(historical.to_dict('records')),
            "prophet": {
                "predictions": clean_nans(prophet_forecast.to_dict('records')),
                "metrics": prophet_metrics
            },
            "lstm": {
                "predictions": clean_nans(lstm_forecast.to_dict('records')),
                "metrics": lstm_metrics
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/movers")
async def get_market_movers():
    """Get top 5 gainers and losers in the last 24h"""
    try:
        movers = data_fetcher.get_top_movers(ASSETS)
        return movers
    except Exception as e:
        print(f"Error getting market movers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}



@app.get("/api/indicators/{symbol}")
async def get_indicators(symbol: str, period: str = "2y"):
    """Get technical indicators for a symbol"""
    # Removed strict validation
    # if symbol not in ASSETS:
    #     raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")
    
    try:
        # Fetch and preprocess data
        df = data_fetcher.fetch_data(symbol, period)
        df = data_fetcher.preprocess_data(df)
        
        # Calculate indicators
        df = data_fetcher.calculate_technical_indicators(df)
        
        # Convert to JSON-serializable format
        # We need Date, Close, and the new indicators
        data = df[['Date', 'Close', 'RSI', 'MACD', 'Signal_Line', 'MACD_Histogram', 'BB_Upper', 'BB_Middle', 'BB_Lower']].copy()
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
        
        # Handle NaN values (replace with None for JSON)
        data = data.where(pd.notnull(data), None)
        
        # Get name from ASSETS if available, otherwise use symbol
        asset_name = ASSETS.get(symbol, {}).get("name", symbol)
        
        return {
            "symbol": symbol,
            "name": asset_name,
            "indicators": data.to_dict('records')
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/correlation")
async def get_correlation():
    """Get correlation matrix for all assets"""
    try:
        # Fetch data for all assets
        df = data_fetcher.get_correlation_data(ASSETS)
        
        # Calculate correlation matrix
        corr_matrix = df.corr()
        
        # Format for frontend (heatmap)
        # We want a list of { x: symbol1, y: symbol2, value: correlation }
        matrix_data = []
        for x in corr_matrix.columns:
            for y in corr_matrix.index:
                matrix_data.append({
                    "x": x,
                    "y": y,
                    "value": float(corr_matrix.loc[y, x])
                })
                
        # Prepare assets info with full details
        assets_info = []
        for symbol in corr_matrix.columns:
            if symbol in ASSETS:
                assets_info.append({
                    "symbol": symbol,
                    "name": ASSETS[symbol]["name"],
                    "type": ASSETS[symbol]["type"]
                })
                
        return {
            "assets": assets_info,
            "matrix": matrix_data
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email jest już zarejestrowany")
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Niepoprawny email lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """Get current user information"""
    return current_user


# ============================================================================
# FAVORITES ENDPOINTS (renamed from watchlist)
# ============================================================================

@app.get("/api/favorites", response_model=List[schemas.FavoriteItem])
async def get_favorites(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's favorite assets"""
    favorites = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id
    ).all()
    return favorites


@app.post("/api/favorites/{symbol}", response_model=schemas.FavoriteItem)
async def add_to_favorites(
    symbol: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Add asset to favorites"""
    # Check if already in favorites
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.asset_symbol == symbol
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Aktywo jest już w ulubionych")
    
    # Add to favorites
    favorite_item = models.Favorite(user_id=current_user.id, asset_symbol=symbol)
    db.add(favorite_item)
    db.commit()
    db.refresh(favorite_item)
    
    return favorite_item


@app.delete("/api/favorites/{symbol}")
async def remove_from_favorites(
    symbol: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Remove asset from favorites"""
    favorite_item = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.asset_symbol == symbol
    ).first()
    
    if not favorite_item:
        raise HTTPException(status_code=404, detail="Brak aktywa w ulubionych")
    
    db.delete(favorite_item)
    db.commit()
    
    return {"message": "Asset removed from favorites"}


# ============================================================================
# PREDICTION HISTORY ENDPOINTS
# ============================================================================

@app.get("/api/predictions/history", response_model=List[schemas.PredictionHistoryItem])
async def get_prediction_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's prediction history (last N predictions)"""
    predictions = db.query(models.PredictionHistory).filter(
        models.PredictionHistory.user_id == current_user.id
    ).order_by(models.PredictionHistory.created_at.desc()).limit(limit).all()
    return predictions


@app.post("/api/predictions/save", response_model=schemas.PredictionHistoryItem)
async def save_prediction(
    prediction: schemas.PredictionHistoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Save a prediction to history"""
    prediction_item = models.PredictionHistory(
        user_id=current_user.id,
        asset_symbol=prediction.asset_symbol,
        asset_name=prediction.asset_name,
        custom_name=prediction.custom_name,
        prediction_period=prediction.prediction_period,
        prophet_data=prediction.prophet_data,
        lstm_data=prediction.lstm_data
    )
    db.add(prediction_item)
    db.commit()
    db.refresh(prediction_item)
    
    return prediction_item


@app.delete("/api/predictions/{prediction_id}")
async def delete_prediction(
    prediction_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prediction from history"""
    prediction = db.query(models.PredictionHistory).filter(
        models.PredictionHistory.id == prediction_id,
        models.PredictionHistory.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Nie znaleziono prognozy")
    
    db.delete(prediction)
    db.commit()
    
    return {"message": "Prediction deleted"}


@app.get("/api/predictions/{prediction_id}/verify", response_model=schemas.PredictionVerificationResponse)
async def verify_prediction(
    prediction_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Verify a past prediction against actual market data"""
    # 1. Get prediction record
    prediction = db.query(models.PredictionHistory).filter(
        models.PredictionHistory.id == prediction_id,
        models.PredictionHistory.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Nie znaleziono prognozy")
    
    try:
        # 2. Fetch actual data - get full historical context
        # We want to show data BEFORE prediction was made AND after
        start_date = prediction.created_at
        
        # Fetch data using existing data fetcher
        df = data_fetcher.fetch_data(prediction.asset_symbol, period="max")
        df = data_fetcher.preprocess_data(df)
        
        # Get data from 60 days before prediction to show context
        # This gives users a view of the trend leading up to the prediction
        start_ts = pd.Timestamp(start_date) - pd.Timedelta(days=60)
        actual_df = df[df['Date'] >= start_ts].copy()
        
        # 3. Calculate metrics
        metrics = {}
        
        # Helper to calculate metrics for a model's predictions
        def calculate_model_metrics(model_data_json, model_name):
            if not model_data_json:
                return
            
            try:
                pred_data = json.loads(model_data_json)
                # pred_data is list of dicts with 'ds' and 'yhat' (and others)
                
                # Create DataFrame from predictions
                pred_df = pd.DataFrame(pred_data)
                pred_df['ds'] = pd.to_datetime(pred_df['ds'])
                
                # Merge with actuals on date
                # actual_df has 'Date', pred_df has 'ds'
                merged = pd.merge(
                    actual_df, 
                    pred_df, 
                    left_on='Date', 
                    right_on='ds', 
                    how='inner'
                )
                
                if len(merged) > 0:
                    y_true = merged['Close'].values
                    y_pred = merged['yhat'].values
                    
                    mae = mean_absolute_error(y_true, y_pred)
                    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
                    
                    # Calculate percentage error (MAPE)
                    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
                    
                    metrics[model_name] = {
                        "mae": float(mae),
                        "rmse": float(rmse),
                        "mape": float(mape),
                        "days_verified": len(merged)
                    }
            except Exception as e:
                print(f"Error calculating metrics for {model_name}: {e}")
                traceback.print_exc()

        calculate_model_metrics(prediction.prophet_data, "prophet")
        calculate_model_metrics(prediction.lstm_data, "lstm")
        
        # 4. Prepare response
        actual_data_list = actual_df[['Date', 'Close']].copy()
        actual_data_list['Date'] = actual_data_list['Date'].dt.strftime('%Y-%m-%d')
        
        return {
            "prediction": prediction,
            "actual_data": actual_data_list.to_dict('records'),
            "metrics": metrics
        }
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# USER SETTINGS ENDPOINTS
# ============================================================================

@app.get("/api/settings", response_model=schemas.UserSettingsResponse)
async def get_user_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user settings (create default if doesn't exist)"""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings
        settings = models.UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@app.put("/api/settings", response_model=schemas.UserSettingsResponse)
async def update_user_settings(
    settings_update: schemas.UserSettingsUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create if doesn't exist
        settings = models.UserSettings(user_id=current_user.id)
        db.add(settings)
    
    settings.default_prediction_period = settings_update.default_prediction_period
    db.commit()
    db.refresh(settings)
    
    return settings


# ============================================================================
# PASSWORD CHANGE ENDPOINT
# ============================================================================

@app.put("/api/auth/change-password")
async def change_password(
    password_data: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify old password
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Niepoprawne aktualne hasło")
    
    # Update password
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.get("/api/admin/users", response_model=List[schemas.AdminUserListItem])
async def get_all_users(
    admin_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get list of all users (admin only)"""
    users = db.query(models.User).all()
    
    result = []
    for user in users:
        prediction_count = db.query(models.PredictionHistory).filter(
            models.PredictionHistory.user_id == user.id
        ).count()
        
        favorite_count = db.query(models.Favorite).filter(
            models.Favorite.user_id == user.id
        ).count()
        
        result.append({
            "id": user.id,
            "email": user.email,
            "is_admin": user.is_admin,
            "created_at": user.created_at,
            "prediction_count": prediction_count,
            "favorite_count": favorite_count
        })
    
    return result


@app.put("/api/admin/users/{user_id}/password")
async def admin_change_user_password(
    user_id: int,
    password_data: schemas.AdminChangePasswordRequest,
    admin_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Change any user's password (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
    
    # Update password
    user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": f"Password changed successfully for {user.email}"}


@app.get("/api/admin/stats", response_model=schemas.AdminStatsResponse)
async def get_admin_stats(
    admin_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get system statistics (admin only)"""
    from datetime import timedelta
    
    total_users = db.query(models.User).count()
    total_predictions = db.query(models.PredictionHistory).count()
    total_favorites = db.query(models.Favorite).count()
    
    # Users registered in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = db.query(models.User).filter(
        models.User.created_at >= seven_days_ago
    ).count()
    
    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "total_favorites": total_favorites,
        "recent_users": recent_users
    }


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    admin_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only) - cannot delete other admins"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
    
    # Prevent deleting admin users
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Nie można usunąć kont administratora")
    
    # Delete user (cascade will delete related favorites and predictions)
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user.email} deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)