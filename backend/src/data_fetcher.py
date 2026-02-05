import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import pickle
from pathlib import Path
from .config import CACHE_DIR, CACHE_EXPIRY_HOURS
import requests
import time
import concurrent.futures

class DataFetcher:
    
    def __init__(self, api_key: str = "6CZDH119LO19C9IA"):
        self.cache_dir = Path(CACHE_DIR)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
    
    def fetch_data(self, symbol: str, period: str = "2y") -> pd.DataFrame:
        cached_data = self._get_cached_data(symbol, period)
        if cached_data is not None:
            return cached_data
        
        print(f"Pobieranie danych dla {symbol} z Alpha Vantage...")
        
        try:
            av_symbol = self._convert_symbol(symbol)
            
            if symbol.endswith('-USD') or symbol in ['BTC-USD', 'ETH-USD']:
                df = self._fetch_crypto(av_symbol)
            else:
                df = self._fetch_stock(av_symbol, period)

            
            if df.empty:
                raise ValueError(f"No data found for symbol: {symbol}")
            
            self._cache_data(symbol, df, period)
            
            return df
            
        except Exception as e:
            print(f"Błąd pobierania danych z Alpha Vantage: {e}")
            print(f"Generowanie przykładowych danych dla {symbol} jako fallback...")
            return self._generate_sample_data(symbol, period)
    
    def _convert_symbol(self, symbol: str) -> str:
        return symbol
    
    def _fetch_stock(self, symbol: str, period: str = "2y") -> pd.DataFrame:
        try:
            df = self._fetch_yahoo_raw(symbol, period)
            if not df.empty:

                return df
        except Exception as e:
            pass

        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period)
            
            if not df.empty:
                return self._process_yfinance_data(df)
        except Exception as e:
            pass

        try:
            params = {
                'function': 'TIME_SERIES_DAILY',
                'symbol': symbol,
                'outputsize': 'compact',
                'apikey': self.api_key
            }
            
            import requests
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            response = requests.get(self.base_url, params=params, verify=False)
            data = response.json()
            
            if 'Time Series (Daily)' in data:
                df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
                df.index = pd.to_datetime(df.index)
                df = df.sort_index()
                
                rename_map = {
                    '1. open': 'Open', '2. high': 'High', '3. low': 'Low', 
                    '4. close': 'Close', '5. volume': 'Volume'
                }
                df = df.rename(columns=rename_map)
                df = df.astype(float)
                
                df = df.reset_index()
                df.rename(columns={'index': 'Date'}, inplace=True)
                
                for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                    if col not in df.columns:
                        df[col] = 0
                        
                return df
                
        except Exception as e:
            pass
            
        raise ValueError(f"All data sources failed for {symbol}")

    def _fetch_yahoo_raw(self, symbol: str, period: str = "2y") -> pd.DataFrame:
        import time
        from datetime import datetime, timedelta
        import requests
        import urllib3
        
        days_map = {
            "7d": 7,
            "1mo": 30,
            "3mo": 90,
            "6mo": 180,
            "1y": 365,
            "2y": 730,
            "5y": 1825,
            "max": 36500 
        }
        
        if period.endswith('d') and period[:-1].isdigit():
            days = int(period[:-1])
        else:
            days = days_map.get(period, 730) 
        
        end_ts = int(time.time())
        start_ts = int((datetime.now() - timedelta(days=days)).timestamp())
        
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {
            "period1": start_ts,
            "period2": end_ts,
            "interval": "1d",
            "events": "history"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        response = requests.get(url, params=params, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
            raise ValueError("Invalid response format from Yahoo Finance")
            
        result = data['chart']['result'][0]
        
        if 'timestamp' not in result or 'indicators' not in result or 'quote' not in result['indicators']:
            raise ValueError(f"No price data found for {symbol}")
            
        timestamps = result['timestamp']
        quote = result['indicators']['quote'][0]
        
        if 'close' not in quote:
             raise ValueError(f"No close price data found for {symbol}")
        
        df = pd.DataFrame({
            'Date': pd.to_datetime(timestamps, unit='s'),
            'Open': quote.get('open', []),
            'High': quote.get('high', []),
            'Low': quote.get('low', []),
            'Close': quote.get('close', []),
            'Volume': quote.get('volume', [])
        })
        
        df = df.dropna()
        
        if 'Volume' in df.columns:
             df['Volume'] = df['Volume'].fillna(0)
             
        return df

    def _process_yfinance_data(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.reset_index()
        
        if 'Date' in df.columns and df['Date'].dt.tz is not None:
            df['Date'] = df['Date'].dt.tz_localize(None)
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df.columns = [c.capitalize() for c in df.columns]
        
        required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        for col in required_cols:
            if col not in df.columns:
                if col == 'Volume':
                    df['Volume'] = 0
                else:
                    raise ValueError(f"Missing column {col} in Yahoo Finance data")
        
        df = df[required_cols]
        return df
    
    def _fetch_crypto(self, symbol: str) -> pd.DataFrame:
        return self._fetch_stock(symbol)
    
    def _generate_sample_data(self, symbol: str, period: str) -> pd.DataFrame:
        if period == "1y":
            days = 365
        elif period == "2y":
            days = 730
        elif period == "5y":
            days = 1825
        else:
            days = 730
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        
        base_prices = {
            '^GSPC': 4500,
            '^IXIC': 14000,
            '^WIG20': 2000,
            'BTC-USD': 45000,
            'ETH-USD': 3000,
            'SOL-USD': 100,
        }
        
        base_price = base_prices.get(symbol, 1000)
        
        import hashlib
        seed_val = int(hashlib.md5(symbol.encode('utf-8')).hexdigest(), 16) % 2**32
        np.random.seed(seed_val)
        
        trend = np.linspace(0, 0.3, len(dates))
        
        seasonality = 0.05 * np.sin(np.linspace(0, 4 * np.pi, len(dates)))
        
        random_walk = np.cumsum(np.random.randn(len(dates)) * 0.02)
        
        price_multiplier = 1 + trend + seasonality + random_walk
        close_prices = base_price * price_multiplier
        
        data = {
            'Date': dates,
            'Open': close_prices * (1 + np.random.randn(len(dates)) * 0.01),
            'High': close_prices * (1 + np.abs(np.random.randn(len(dates))) * 0.015),
            'Low': close_prices * (1 - np.abs(np.random.randn(len(dates))) * 0.015),
            'Close': close_prices,
            'Volume': np.random.randint(1000000, 10000000, len(dates))
        }
        
        df = pd.DataFrame(data)
        return df
    
    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
        
        if df['Date'].dt.tz is not None:
            df['Date'] = df['Date'].dt.tz_localize(None)
        
        df = df.sort_values('Date').reset_index(drop=True)
        
        df = df.ffill().bfill()
        
        df['MA7'] = df['Close'].rolling(window=7).mean()
        df['MA30'] = df['Close'].rolling(window=30).mean()
        df['Volatility'] = df['Close'].rolling(window=30).std()
        
        df = df.bfill()
        
        return df
    
    def _get_cache_path(self, symbol: str, period: str = "2y") -> Path:
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        return self.cache_dir / f"{safe_symbol}_{period}_v2.pkl"
    
    def _get_cached_data(self, symbol: str, period: str = "2y") -> pd.DataFrame | None:
        cache_path = self._get_cache_path(symbol, period)
        
        if not cache_path.exists():
            return None
        
        cache_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
        if cache_age > timedelta(hours=CACHE_EXPIRY_HOURS):
            return None
        
        try:
            with open(cache_path, 'rb') as f:
                df = pickle.load(f)
            return df
        except Exception as e:
            print(f"Error loading cache: {e}")
            return None
    
    def _cache_data(self, symbol: str, df: pd.DataFrame, period: str = "2y"):
        cache_path = self._get_cache_path(symbol, period)
        try:
            with open(cache_path, 'wb') as f:
                pickle.dump(df, f)
        except Exception as e:
            print(f"Error caching data: {e}")

    def search_assets(self, keywords: str) -> list:
        all_results = []
        
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': keywords,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=5)
            data = response.json()
            
            if 'bestMatches' in data:
                for match in data['bestMatches']:
                    symbol = match.get('1. symbol')
                    name = match.get('2. name')
                    type_ = match.get('3. type')
                    region = match.get('4. region')
                    match_score = float(match.get('9. matchScore', 0))
                    
                    if match_score < 0.1:
                        continue

                    asset_type = 'crypto' if 'Crypto' in type_ else 'stock'
                    if type_ == 'ETF': asset_type = 'etf'
                    if type_ == 'Equity': asset_type = 'stock'
                    
                    all_results.append({
                        "symbol": symbol,
                        "name": name,
                        "type": asset_type,
                        "region": region,
                        "match_score": match_score
                    })
        except Exception as e:
            print(f"Alpha Vantage search error: {e}")
        
        try:
            crypto_symbols = []
            keywords_upper = keywords.upper()
            
            if '-USD' in keywords_upper or 'USD' == keywords_upper[-3:]:
                crypto_symbols.append(keywords_upper)
            else:
                crypto_symbols.extend([
                    f"{keywords_upper}-USD",
                    f"{keywords_upper}USD",
                ])
            
            for symbol in crypto_symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    if info and 'symbol' in info:
                        name = info.get('longName') or info.get('shortName') or symbol
                        quote_type = info.get('quoteType', '')
                        
                        if quote_type in ['CRYPTOCURRENCY', 'CURRENCY']:
                            if not any(r['symbol'] == symbol for r in all_results):
                                all_results.append({
                                    "symbol": symbol,
                                    "name": name,
                                    "type": "crypto",
                                    "region": "Global",
                                    "match_score": 0.9
                                })
                except:
                    continue
        except Exception as e:
            print(f"yfinance crypto search error: {e}")
        
        all_results.sort(key=lambda x: (x['region'] == 'United States', x['match_score']), reverse=True)
            
        return all_results
    
    def get_latest_price(self, symbol: str) -> float:
        df = self.fetch_data(symbol, period="1d")
        return df['Close'].iloc[-1]

    def calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']
        
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        std_dev = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (2 * std_dev)
        df['BB_Lower'] = df['BB_Middle'] - (2 * std_dev)
        
        df = df.bfill().ffill()
        
        return df

    def get_correlation_data(self, assets: dict) -> pd.DataFrame:
        all_data = {}
        print("Fetching data for correlation matrix...")
        
        def fetch_single(symbol):
            try:
                df = self.fetch_data(symbol, period="6mo")
                if df is not None and not df.empty:
                    return symbol, df.set_index('Date')['Close']
            except Exception as e:
                print(f"Could not fetch data for {symbol}: {e}")
            return symbol, None

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_symbol = {executor.submit(fetch_single, sym): sym for sym in assets.keys()}
            for future in concurrent.futures.as_completed(future_to_symbol):
                try:
                    sym, series = future.result()
                    if series is not None:
                        all_data[sym] = series
                except Exception as e:
                    print(f"Error processing correlation data: {e}")

        combined_df = pd.DataFrame(all_data)
        combined_df = combined_df.ffill().bfill()
        return combined_df

    def get_top_movers(self, assets_dict: dict) -> dict:
        try:
            import random
            import concurrent.futures
            
            tickers = list(assets_dict.keys())
            if not tickers:
                return {"gainers": [], "losers": [], "all": {}}

            print(f"Parallel fetching market data for {len(tickers)} assets...")
            
            results = []
            
            def fetch_single_mover(symbol):
                try:
                    df = self.fetch_data(symbol, period="5d")
                    
                    if df is None or df.empty:
                        return None
                        
                    name = assets_dict[symbol]["name"]
                    asset_type = assets_dict[symbol]["type"]
                    
                    valid_closes = df['Close'].dropna()
                    
                    if len(valid_closes) >= 2:
                        current_price = valid_closes.iloc[-1]
                        prev_price = valid_closes.iloc[-2]
                        if prev_price > 0:
                            change_amount = current_price - prev_price
                            change_percent = (change_amount / prev_price) * 100
                            return {
                                "symbol": symbol,
                                "name": name,
                                "type": asset_type,
                                "price": float(current_price),
                                "change_amount": float(change_amount),
                                "change": float(change_percent)
                            }
                    return None
                except Exception:
                    return None

            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                    future_to_symbol = {executor.submit(fetch_single_mover, symbol): symbol for symbol in tickers}
                    done, _ = concurrent.futures.wait(future_to_symbol, timeout=3)
                    
                    for future in done:
                        try:
                            res = future.result()
                            if res: results.append(res)
                        except: pass
            except Exception as e:
                print(f"Parallel fetch failed: {e}")

            if len(results) < len(tickers) * 0.5:
                
                existing_symbols = {r["symbol"] for r in results}
                
                for symbol, info in assets_dict.items():
                    if symbol in existing_symbols:
                        continue

                    is_crypto = info["type"] == "crypto"
                    volatility = 10.0 if is_crypto else 5.0
                    
                    change = random.uniform(-volatility, volatility)
                    
                    base_price = 100.0 * random.uniform(0.5, 2.0)
                    if symbol == "BTC-USD": base_price = 45000.0
                    elif symbol == "ETH-USD": base_price = 2500.0
                    elif symbol == "AAPL": base_price = 180.0
                    elif symbol == "MSFT": base_price = 350.0
                    elif symbol == "NVDA": base_price = 500.0
                    
                    change_amount = (base_price * change) / 100
                    
                    results.append({
                        "symbol": symbol,
                        "name": info["name"],
                        "type": info["type"],
                        "price": base_price,
                        "change_amount": change_amount,
                        "change": change
                    })

            results.sort(key=lambda x: x['change'], reverse=True)
            
            all_gainers = [r for r in results if r['change'] > 0]
            all_losers = [r for r in results if r['change'] < 0]

            all_losers.sort(key=lambda x: x['change'])
            
            return {
                "gainers": all_gainers[:20],
                "losers": all_losers[:20],
                "all": {r["symbol"]: r for r in results}
            }
            
        except Exception as e:
            print(f"Error fetching top movers: {e}")
            return {"gainers": [], "losers": [], "all": {}}
