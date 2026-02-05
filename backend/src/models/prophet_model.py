import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pickle
from pathlib import Path
from ..config import PROPHET_MODEL_DIR, PROPHET_CHANGEPOINT_PRIOR_SCALE, PROPHET_SEASONALITY_PRIOR_SCALE


class ProphetPredictor:
    
    def __init__(self):
        self.model = None
        self.model_dir = Path(PROPHET_MODEL_DIR)
        self.model_dir.mkdir(parents=True, exist_ok=True)
    
    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        prophet_df = pd.DataFrame({
            'ds': df['Date'],
            'y': df['Close']
        })
        return prophet_df
    
    def train(self, df: pd.DataFrame, symbol: str) -> dict:
        print(f"Trenowanie modelu Prophet dla {symbol}...")
        
        if len(df) < 30:
            raise ValueError(f"Niewystarczająca ilość danych do treningu Prophet. Wymagane co najmniej 30 dni, otrzymano {len(df)}")
        
        self.last_known_price = float(df['Close'].iloc[-1])
        
        prophet_df = self.prepare_data(df)
        
        self.model = Prophet(
            changepoint_prior_scale=0.05,
            changepoint_range=0.85,
            seasonality_prior_scale=0.01,
            daily_seasonality=False,
            weekly_seasonality=False,
            yearly_seasonality=False,
            interval_width=0.95
        )
        
        self.model.fit(prophet_df)
        
        train_predictions = self.model.predict(prophet_df)
        metrics = self._calculate_metrics(
            prophet_df['y'].values,
            train_predictions['yhat'].values
        )
        
        self._save_model(symbol)
        
        print(f"Model Prophet wytrenowany. RMSE: {metrics['rmse']:.2f}, MAE: {metrics['mae']:.2f}")
        
        return metrics
    
    def _apply_anchoring(self, forecast):
        if not hasattr(self, 'last_known_price') or self.last_known_price is None:
            return forecast
        return forecast

    def predict(self, periods: int) -> pd.DataFrame:
        if self.model is None:
            raise ValueError("Model nie wytrenowany. Najpierw wywołaj train().")
        
        future = self.model.make_future_dataframe(periods=periods)
        
        forecast = self.model.predict(future)
        
        if hasattr(self, 'last_known_price') and self.last_known_price is not None:
            last_hist_idx = len(forecast) - periods - 1
            
            if last_hist_idx >= 0:
                last_fitted = forecast.iloc[last_hist_idx]['yhat']
                gap = self.last_known_price - last_fitted
                
                forecast['yhat'] += gap
                forecast['yhat_lower'] += gap
                forecast['yhat_upper'] += gap
        
        forecast = forecast.tail(periods)
        
        forecast['yhat'] = forecast['yhat'].clip(lower=0)
        forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
        forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    def predict_with_history(self, df: pd.DataFrame, periods: int) -> pd.DataFrame:
        if self.model is None:
            raise ValueError("Model nie wytrenowany. Najpierw wywołaj train().")
        
        future = self.model.make_future_dataframe(periods=periods)
        
        forecast = self.model.predict(future)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    def _calculate_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> dict:
        mae = mean_absolute_error(actual, predicted)
        rmse = np.sqrt(mean_squared_error(actual, predicted))
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        return {
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape)
        }
    
    def _save_model(self, symbol: str):
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_prophet.pkl"
        
        try:
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"Model saved to {model_path}")
        except Exception as e:
            print(f"Błąd zapisu modelu: {e}")
    
    def load_model(self, symbol: str) -> bool:
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_prophet.pkl"
        
        if not model_path.exists():
            return False
        
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"Model wczytany z {model_path}")
            return True
        except Exception as e:
            print(f"Błąd wczytywania modelu: {e}")
            return False
