"""
Prophet model implementation for time series forecasting
"""

import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pickle
from pathlib import Path
from ..config import PROPHET_MODEL_DIR, PROPHET_CHANGEPOINT_PRIOR_SCALE, PROPHET_SEASONALITY_PRIOR_SCALE


class ProphetPredictor:
    """Prophet-based price prediction model"""
    
    def __init__(self):
        self.model = None
        self.model_dir = Path(PROPHET_MODEL_DIR)
        self.model_dir.mkdir(parents=True, exist_ok=True)
    
    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for Prophet (requires 'ds' and 'y' columns)
        
        Args:
            df: DataFrame with 'Date' and 'Close' columns
        
        Returns:
            DataFrame formatted for Prophet
        """
        prophet_df = pd.DataFrame({
            'ds': df['Date'],
            'y': df['Close']
        })
        return prophet_df
    
    def train(self, df: pd.DataFrame, symbol: str) -> dict:
        """
        Train Prophet model
        
        Args:
            df: DataFrame with historical data
            symbol: Asset symbol for model saving
        
        Returns:
            Dictionary with training metrics
        """
        print(f"Training Prophet model for {symbol}...")
        
        if len(df) < 30:
            raise ValueError(f"Insufficient data for Prophet training. Need at least 30 days, got {len(df)}")
        
        # Save last known price for anchoring (gap elimination)
        self.last_known_price = float(df['Close'].iloc[-1])
        
        # Prepare data
        prophet_df = self.prepare_data(df)
        
        # Initialize and train model
        # Financial time series (stocks/crypto) best practices:
        # - No daily/weekly/yearly seasonality (prices are driven by news/events, not calendar)
        # - Default changepoint_prior_scale (0.05) works well for detecting trend changes
        # - Low seasonality_prior_scale since we're not using seasonality components
        self.model = Prophet(
            changepoint_prior_scale=0.05,   # Back to default: slower reaction to short-term volatility
            changepoint_range=0.85,         # Ignore last 15% for trend changes (treat excessive drop as noise)
            seasonality_prior_scale=0.01,   # Low since we disable seasonality
            daily_seasonality=False,        # Financial markets don't have daily patterns
            weekly_seasonality=False,       # No "Monday effect" or weekly patterns
            yearly_seasonality=False,       # Stock prices don't follow yearly cycles
            interval_width=0.95             # 95% confidence intervals
        )
        
        self.model.fit(prophet_df)
        
        # Calculate training metrics
        train_predictions = self.model.predict(prophet_df)
        metrics = self._calculate_metrics(
            prophet_df['y'].values,
            train_predictions['yhat'].values
        )
        
        # Save model
        self._save_model(symbol)
        
        print(f"Prophet model trained. RMSE: {metrics['rmse']:.2f}, MAE: {metrics['mae']:.2f}")
        
        return metrics
    
        # Anchoring: Shift forecast to connect with last historical price
        # This prevents the "visual jump" users dislike
        if hasattr(self, 'last_known_price') and self.last_known_price is not None:
            # We want the first prediction point to align with last known price
            # But 'forecast' includes history if using predict_with_history or raw predict?
            # Standard predict(periods) gets future from make_future_dataframe which includes history by default unless filtered?
            # Wait, make_future_dataframe(periods=...) includes history + future rows.
            # self.model.predict(future) returns predictions for ALL rows.
            # Then we define: forecast = forecast.tail(periods). 
            
            # The "first point" of this future-only forecast is actually T+1.
            # The gap is between T (history) and T+1 (forecast).
            # We should calculate the jump relative to T's fitted value vs T's actual value?
            # Or just mechanically shift T+1...T+N by (LastPrice - FittedValueAtT)?
            
            # Use 'yhat' of the very last historical point (which corresponds to 'now')
            # But easier: just shift so that the *trend* aligns.
            
            # Let's align based on the last fitted value vs last actual value
            # Actually, simplest UI fix: Calculate diff between Last Actual Price and Last Fitted Price.
            # Add that diff to all future predictions.
            
            pass 
            # Note regarding implementation above: I need to save last_known_price in train() first.
            
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

    def _apply_anchoring(self, forecast):
        """Helper to shift forecast to match last known price"""
        if not hasattr(self, 'last_known_price') or self.last_known_price is None:
            return forecast
            
        # Get the fitted value for the last historical date
        # This is tricky without re-predicting history. 
        # But we can approximate roughly or just use the offset if we had the full series.
        
        # Alternative Strategy:
        # Just use the offset: (Last Actual) - (Predicted T+1 start).
        # But T+1 should be close to T.
        # Let's just modify the return directly in `predict` below.
        pass

    def predict(self, periods: int) -> pd.DataFrame:
        """
        Generate future predictions
        
        Args:
            periods: Number of days to predict
        
        Returns:
            DataFrame with predictions
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create future dataframe
        future = self.model.make_future_dataframe(periods=periods)
        
        # Make predictions
        forecast = self.model.predict(future)
        
        # Handle anchoring (Visual Continuity)
        if hasattr(self, 'last_known_price') and self.last_known_price is not None:
            # Get the fitted value at the last historical point (which is at index len(history)-1)
            # The future dataframe has length: len(history) + periods
            # The last historical index is len(future) - periods - 1
            last_hist_idx = len(forecast) - periods - 1
            
            if last_hist_idx >= 0:
                last_fitted = forecast.iloc[last_hist_idx]['yhat']
                gap = self.last_known_price - last_fitted
                
                # Apply shift to everything (or just future?)
                # Shifting everything preserves the shape but moves level.
                # Usually we only care about future for the plot line that is drawn separately.
                forecast['yhat'] += gap
                forecast['yhat_lower'] += gap
                forecast['yhat_upper'] += gap
        
        # Return only future predictions
        forecast = forecast.tail(periods)
        
        # DEBUG: Log forecast statistics
        print(f"\n=== PROPHET FORECAST DEBUG ===")
        print(f"Periods: {periods}")
        print(f"Forecast shape: {forecast.shape}")
        print(f"yhat range: {forecast['yhat'].min():.2f} to {forecast['yhat'].max():.2f}")
        print(f"First 5 predictions:\n{forecast[['ds', 'yhat']].head()}")
        print(f"==============================\n")
        
        # Clamp predictions to be non-negative
        forecast['yhat'] = forecast['yhat'].clip(lower=0)
        forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
        forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    def predict_with_history(self, df: pd.DataFrame, periods: int) -> pd.DataFrame:
        """
        Generate predictions including historical data
        
        Args:
            df: Historical data
            periods: Number of days to predict
        
        Returns:
            DataFrame with historical and predicted values
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create future dataframe
        future = self.model.make_future_dataframe(periods=periods)
        
        # Make predictions
        forecast = self.model.predict(future)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    def _calculate_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> dict:
        """Calculate evaluation metrics"""
        mae = mean_absolute_error(actual, predicted)
        rmse = np.sqrt(mean_squared_error(actual, predicted))
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        return {
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape)
        }
    
    def _save_model(self, symbol: str):
        """Save trained model to disk"""
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_prophet.pkl"
        
        try:
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"Model saved to {model_path}")
        except Exception as e:
            print(f"Error saving model: {e}")
    
    def load_model(self, symbol: str) -> bool:
        """Load trained model from disk"""
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_prophet.pkl"
        
        if not model_path.exists():
            return False
        
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"Model loaded from {model_path}")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
