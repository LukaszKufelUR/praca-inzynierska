from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Integer, default=0)
    is_approved = Column(Integer, default=0)  
    created_at = Column(DateTime, default=datetime.utcnow)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_symbol = Column(String, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_symbol = Column(String, nullable=False)
    asset_name = Column(String, nullable=False)
    custom_name = Column(String, nullable=True)
    prediction_period = Column(Integer, nullable=False)
    prophet_data = Column(Text, nullable=True)
    lstm_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    default_prediction_period = Column(Integer, default=30)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")
