import pandas as pd
import numpy as np
import random
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
        
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size, 1)
        
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        
        last_output = lstm_out[:, -1, :]
        
        out = self.dropout(last_output)
        out = self.fc(out)
        
        return out


class LSTMPredictor:
    
    def __init__(self, lookback_days: int = LSTM_LOOKBACK_DAYS):
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.lookback_days = lookback_days
        self.model_dir = Path(LSTM_MODEL_DIR)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    def prepare_sequences(self, data: np.ndarray) -> tuple:
        X, y = [], []
        
        for i in range(self.lookback_days, len(data)):
            X.append(data[i - self.lookback_days:i])
            y.append(data[i])
        
        X = np.array(X)
        y = np.array(y)
        
        X = X.reshape((X.shape[0], X.shape[1], 1))
        
        return X, y

    
    def train(self, df: pd.DataFrame, symbol: str) -> dict:
        print(f"Trenowanie modelu LSTM dla {symbol} (różnice cen, 150 units)...")
        
        random.seed(42)
        torch.manual_seed(42)
        np.random.seed(42)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(42)
            torch.cuda.manual_seed_all(42)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
        
        if len(df) <= self.lookback_days + 10:
            raise ValueError(f"Niewystarczająca ilość danych do treningu LSTM. Wymagane co najmniej {self.lookback_days + 10} dni, otrzymano {len(df)}")

        diff_values = df['Close'].diff().dropna().values.reshape(-1, 1)
        
        scaled_data = self.scaler.fit_transform(diff_values)
        
        X, y = self.prepare_sequences(scaled_data)
        
        X_tensor = torch.FloatTensor(X).to(self.device)
        y_tensor = torch.FloatTensor(y).to(self.device)
        
        split_idx = int(len(X_tensor) * 0.8)
        X_train, X_test = X_tensor[:split_idx], X_tensor[split_idx:]
        y_train, y_test = y_tensor[:split_idx], y_tensor[split_idx:]
        
        self.model = LSTMModel(input_size=1, hidden_size=50, num_layers=2, dropout=0.2).to(self.device)
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
        batch_size = 16
        epochs = 30
        validation_split = 0.1
        
        val_size = int(len(X_train) * validation_split)
        X_train_final, X_val = X_train[:-val_size], X_train[-val_size:]
        y_train_final, y_val = y_train[:-val_size], y_train[-val_size:]
        
        best_val_loss = float('inf')
        patience = 10
        patience_counter = 0
        
        for epoch in range(epochs):
            self.model.train()
            
            for i in range(0, len(X_train_final), batch_size):
                batch_X = X_train_final[i:i+batch_size]
                batch_y = y_train_final[i:i+batch_size]
                
                outputs = self.model(batch_X).squeeze()
                loss = criterion(outputs, batch_y.squeeze())
                
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            
            self.model.eval()
            with torch.no_grad():
                val_outputs = self.model(X_val).squeeze()
                val_loss = criterion(val_outputs, y_val.squeeze())
            
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Wczesne zatrzymanie w epoce {epoch+1}")
                    break
        
        self.model.eval()
        with torch.no_grad():
            test_predictions = self.model(X_test).squeeze().cpu().numpy()
        
        y_test_np = y_test.squeeze().cpu().numpy()
        
        test_predictions_unscaled = self.scaler.inverse_transform(test_predictions.reshape(-1, 1)).flatten()
        y_test_unscaled = self.scaler.inverse_transform(y_test_np.reshape(-1, 1)).flatten()
        
        test_start_idx = 1 + self.lookback_days + split_idx
        
        base_price = df['Close'].iloc[test_start_idx - 1]
        
        reconstructed_actual = base_price + np.cumsum(y_test_unscaled)
        reconstructed_predicted = base_price + np.cumsum(test_predictions_unscaled)
        
        mae = mean_absolute_error(reconstructed_actual, reconstructed_predicted)
        rmse = np.sqrt(mean_squared_error(reconstructed_actual, reconstructed_predicted))
        epsilon = 1e-8 
        mape = np.mean(np.abs((reconstructed_actual - reconstructed_predicted) / (reconstructed_actual + epsilon))) * 100
        
        self._save_model(symbol)
        
        print(f"Model LSTM wytrenowany. Test RMSE: {rmse:.4f}, Test MAE: {mae:.4f}, Test MAPE: {mape:.2f}%")
        
        return {
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape)
        }
    
    def predict(self, df: pd.DataFrame, periods: int) -> pd.DataFrame:
        if self.model is None:
            raise ValueError("Model nie wytrenowany. Najpierw wywołaj train().")
        
        self.model.eval()
        
        diff_values = df['Close'].diff().dropna().values.reshape(-1, 1)
        
        scaled_diffs = self.scaler.transform(diff_values)
        
        last_sequence = scaled_diffs[-self.lookback_days:]
        
        predicted_diffs_scaled = []
        current_sequence = torch.FloatTensor(last_sequence).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            for _ in range(periods):
                next_pred = self.model(current_sequence).cpu().numpy()[0, 0]
                predicted_diffs_scaled.append(next_pred)
                
                next_pred_tensor = torch.FloatTensor([[next_pred]]).to(self.device)
                current_sequence = torch.cat([current_sequence[:, 1:, :], next_pred_tensor.unsqueeze(1)], dim=1)
        
        predicted_diffs = self.scaler.inverse_transform(np.array(predicted_diffs_scaled).reshape(-1, 1)).flatten()
        
        last_close_price = df['Close'].iloc[-1]
        predicted_prices = []
        current_price = last_close_price
        
        for diff in predicted_diffs:
            current_price = current_price + diff
            predicted_prices.append(current_price)
            
        last_date = df['Date'].iloc[-1]
        future_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1),
            periods=periods,
            freq='D'
        )
        
        forecast_df = pd.DataFrame({
            'ds': future_dates,
            'yhat': [max(0, p) for p in predicted_prices]
        })
        
        return forecast_df
    
    def _calculate_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> dict:
        pass
    
    def _save_model(self, symbol: str):
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_lstm.pth"
        scaler_path = self.model_dir / f"{safe_symbol}_scaler.pkl"
        
        try:
            torch.save(self.model.state_dict(), model_path)
            
            import pickle
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            print(f"Model zapisany w {model_path}")
        except Exception as e:
            print(f"Błąd zapisu modelu: {e}")
    
    def load_model(self, symbol: str) -> bool:
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        model_path = self.model_dir / f"{safe_symbol}_lstm.pth"
        scaler_path = self.model_dir / f"{safe_symbol}_scaler.pkl"
        
        if not model_path.exists() or not scaler_path.exists():
            return False
        
        try:
            self.model = LSTMModel().to(self.device)
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.eval()
            
            import pickle
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            print(f"Model wczytany z {model_path}")
            return True
        except Exception as e:
            print(f"Błąd wczytywania modelu: {e}")
            return False
