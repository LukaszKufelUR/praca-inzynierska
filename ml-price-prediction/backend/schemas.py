from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_admin: int
    created_at: datetime

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Password change schema
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# Favorite schemas (renamed from Watchlist)
class FavoriteItem(BaseModel):
    id: int
    asset_symbol: str
    added_at: datetime

    class Config:
        from_attributes = True

class FavoriteCreate(BaseModel):
    asset_symbol: str

# Prediction History schemas
class PredictionHistoryItem(BaseModel):
    id: int
    asset_symbol: str
    asset_name: str
    custom_name: Optional[str] = None
    prediction_period: int
    prophet_data: str
    lstm_data: str
    created_at: datetime

    class Config:
        from_attributes = True

class PredictionHistoryCreate(BaseModel):
    asset_symbol: str
    asset_name: str
    custom_name: Optional[str] = None
    prediction_period: int
    prophet_data: Optional[str] = None
    lstm_data: Optional[str] = None

class PredictionVerificationResponse(BaseModel):
    prediction: PredictionHistoryItem
    actual_data: list[dict]
    metrics: dict

# User Settings schemas
class UserSettingsResponse(BaseModel):
    id: int
    default_prediction_period: int
    updated_at: datetime

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    default_prediction_period: int

# Admin schemas
class AdminUserListItem(BaseModel):
    id: int
    email: str
    is_admin: int
    created_at: datetime
    prediction_count: int
    favorite_count: int

    class Config:
        from_attributes = True

class AdminChangePasswordRequest(BaseModel):
    new_password: str

class AdminStatsResponse(BaseModel):
    total_users: int
    total_predictions: int
    total_favorites: int
    recent_users: int  # Last 7 days

