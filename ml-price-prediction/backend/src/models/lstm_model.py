"""
LSTM model implementation for time series forecasting using PyTorch
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import torch
import torch.nn as nn
from pathlib import Path
from ..config import (
    LSTM_MODEL_DIR, 
    LSTM_LOOKBACK_DAYS, 
    LSTM_EPOCHS, 
    LSTM_BATCH_SIZE,
    LSTM_VALIDATION_SPLIT
)


class LSTMModel(nn.Module):
    """PyTorch LSTM model"""
    
    def __init__(self, input_size=1, hidden_size=50, num_layers=2, dropout=0.2):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True
        )
        
        self.fc1 = nn.Linear(hidden_size, 25)
        self.fc2 = nn.Linear(25, 1)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        # LSTM layer
        lstm_out, _ = self.lstm(x)
        
        # Take the last output
        last_output = lstm_out[:, -1, :]
        
        # Fully connected layers
        out = self.relu(self.fc1(last_output))
        out = self.fc2(out)
        
        return out


class LSTMPredictor:
    """LSTM-based price prediction model using PyTorch"""
    
    def __init__(self, lookback_days: int = LSTM_LOOKBACK_DAYS):
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.lookback_days = lookback_days
        self.model_dir = Path(LSTM_MODEL_DIR)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    def prepare_sequences(self, data: np.ndarray) -> tuple:
        """
        Prepare sequences for LSTM training
        
        Args:
            data: 1D array of prices
        
        Returns:
            Tuple of (X, y) for training
        """
        X, y = [], []
        
        for i in range(self.lookback_days, len(data)):
            X.append(data[i - self.lookback_days:i])
            y.append(data[i])
        
        X = np.array(X)
        y = np.array(y)
        
        # Reshape X to 3D: (samples, lookback_days, features)
        X = X.reshape((X.shape[0], X.shape[1], 1))
        
        return X, y

    
    def train(self, df: pd.DataFrame, symbol: str) -> dict:
        """
        Train LSTM model on price differences
        
        Args:
            df: DataFrame with historical data
            symbol: Asset symbol for model saving
        
        Returns:
            Dictionary with training metrics
        """
        print(f"Training LSTM model for {symbol} (using differencing)...")
        
        if len(df) <= self.lookback_days + 10: # +10 buffer
            raise ValueError(f"Insufficient data for LSTM training. Need at least {self.lookback_days + 10} days, got {len(df)}")

        
        # Calculate differences (stationarity)
        # We use simple difference: Price_t - Price_{t-1}
        diff_values = df['Close'].diff().dropna().values.reshape(-1, 1)
        
        # Scale data (-1 to 1 is often better for tanh in LSTM, but 0-1 is fine too)
        # We stick to 0-1 as per previous scaler config, but fit on diffs
        scaled_data = self.scaler.fit_transform(diff_values)
        
        # Prepare sequences
        X, y = self.prepare_sequences(scaled_data)
        
        # Convert to PyTorch tensors (X is already 3D: samples, lookback, features)
        X_tensor = torch.FloatTensor(X).to(self.device)
        y_tensor = torch.FloatTensor(y).to(self.device)
        
        # Split into train and validation
        split_idx = int(len(X_tensor) * (1 - LSTM_VALIDATION_SPLIT))
        X_train, X_val = X_tensor[:split_idx], X_tensor[split_idx:]
        y_train, y_val = y_tensor[:split_idx], y_tensor[split_idx:]
        
        # Initialize model
        self.model = LSTMModel().to(self.device)
        
        # Loss and optimizer
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
        # Training loop
        best_val_loss = float('inf')
        patience = 5
        patience_counter = 0
        
        for epoch in range(LSTM_EPOCHS):
            self.model.train()
            
            # Mini-batch training
            for i in range(0, len(X_train), LSTM_BATCH_SIZE):
                batch_X = X_train[i:i+LSTM_BATCH_SIZE]
                batch_y = y_train[i:i+LSTM_BATCH_SIZE]
                
                # Forward pass
                outputs = self.model(batch_X).squeeze()
                loss = criterion(outputs, batch_y)
                
                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            
            # Validation
            self.model.eval()
            with torch.no_grad():
                val_outputs = self.model(X_val).squeeze()
                val_loss = criterion(val_outputs, y_val)
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping at epoch {epoch+1}")
                    break
        
        # Calculate metrics on training data (reconstructed prices)
        self.model.eval()
        with torch.no_grad():
            predictions_diff_scaled = self.model(X_tensor).squeeze().cpu().numpy()
        
        # Reconstruct prices for metrics calculation
        # We need the base prices corresponding to the start of each prediction
        # y contains diffs starting from lookback_days index of the diff array
        # The diff array starts at index 1 of original df
        # So diff[i] corresponds to Close[i+1] - Close[i]
        
        # Inverse transform predicted differences
        predictions_diff = self.scaler.inverse_transform(predictions_diff_scaled.reshape(-1, 1)).flatten()
        actual_diff = self.scaler.inverse_transform(y.reshape(-1, 1)).flatten()
        
        # To calculate RMSE on prices, we need to reconstruct.
        # However, for training metrics, it's often enough to report error on diffs or just save the model.
        # But to be consistent with the UI, let's try to reconstruct a segment.
        # For simplicity in this method, we'll report metrics on the DIFFERENCES, 
        # as reconstructing the whole series for training metrics is complex due to windowing.
        # Or we can just return the loss.
        
        # Let's calculate MAE/RMSE on the differences themselves for the log
        mae_diff = mean_absolute_error(actual_diff, predictions_diff)
        rmse_diff = np.sqrt(mean_squared_error(actual_diff, predictions_diff))
        
        # Save model
        self._save_model(symbol)
        
        print(f"LSTM model trained on differences. Diff RMSE: {rmse_diff:.4f}, Diff MAE: {mae_diff:.4f}")
        
        # Return metrics (note: these are on differences, not absolute prices)
        return {
            'mae': float(mae_diff),
            'rmse': float(rmse_diff),
            'mape': 0.0 # MAPE on differences is not very meaningful (div by zero issues)
        }
    
    def predict(self, df: pd.DataFrame, periods: int) -> pd.DataFrame:
        """
        Generate future predictions using differencing
        
        Args:
            df: Historical data
            periods: Number of days to predict
        
        Returns:
            DataFrame with predictions
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        self.model.eval()
        
        # Prepare data for prediction
        # Calculate differences
        diff_values = df['Close'].diff().dropna().values.reshape(-1, 1)
        
        # Scale differences
        scaled_diffs = self.scaler.transform(diff_values)
        
        # Get last sequence of differences
        last_sequence = scaled_diffs[-self.lookback_days:]
        
        # Generate predictions (of differences)
        predicted_diffs_scaled = []
        current_sequence = torch.FloatTensor(last_sequence).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            for _ in range(periods):
                # Predict next difference
                next_pred = self.model(current_sequence).cpu().numpy()[0, 0]
                predicted_diffs_scaled.append(next_pred)
                
                # Update sequence
                next_pred_tensor = torch.FloatTensor([[next_pred]]).to(self.device)
                current_sequence = torch.cat([current_sequence[:, 1:, :], next_pred_tensor.unsqueeze(1)], dim=1)
        
        # Inverse transform predicted differences
        predicted_diffs = self.scaler.inverse_transform(np.array(predicted_diffs_scaled).reshape(-1, 1)).flatten()
        
        # Reconstruct absolute prices
        last_close_price = df['Close'].iloc[-1]
        predicted_prices = []
        current_price = last_close_price
        
        for diff in predicted_diffs:
            current_price = current_price + diff
            predicted_prices.append(current_price)
            
        # Create future dates
        last_date = df['Date'].iloc[-1]
        future_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1),
            periods=periods,
            freq='D'
        )
        
        # Create DataFrame
        forecast_df = pd.DataFrame({
            'ds': future_dates,
            'yhat': [max(0, p) for p in predicted_prices]  # Clamp to 0
        })
        
        return forecast_df
    
    def _calculate_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> dict:
        """Calculate evaluation metrics"""
        # Inverse transform for actual values
        actual_prices = self.scaler.inverse_transform(actual.reshape(-1, 1))
        predicted_prices = self.scaler.inverse_transform(predicted.reshape(-1, 1))
        
        mae = mean_absolute_error(actual_prices, predicted_prices)
        rmse = np.sqrt(mean_squared_error(actual_prices, predicted_prices))
        mape = np.mean(np.abs((actual_prices - predicted_prices) / actual_prices)) * 100
        
        return {
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape)
        }
    
    def _save_model(self, symbol: str):
        """Save trained model to disk"""
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_lstm.pth"
        scaler_path = self.model_dir / f"{safe_symbol}_scaler.pkl"
        
        try:
            # Save PyTorch model
            torch.save(self.model.state_dict(), model_path)
            
            # Save scaler
            import pickle
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            print(f"Model saved to {model_path}")
        except Exception as e:
            print(f"Error saving model: {e}")
    
    def load_model(self, symbol: str) -> bool:
        """Load trained model from disk"""
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_lstm.pth"
        scaler_path = self.model_dir / f"{safe_symbol}_scaler.pkl"
        
        if not model_path.exists() or not scaler_path.exists():
            return False
        
        try:
            # Load PyTorch model
            self.model = LSTMModel().to(self.device)
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.eval()
            
            # Load scaler
            import pickle
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            print(f"Model loaded from {model_path}")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

