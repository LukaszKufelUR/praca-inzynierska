"""
Data fetching module using Alpha Vantage API
"""

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
    """Fetches and caches financial data from Alpha Vantage"""
    
    def __init__(self, api_key: str = "6CZDH119LO19C9IA"):
        self.cache_dir = Path(CACHE_DIR)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
    
    def fetch_data(self, symbol: str, period: str = "2y") -> pd.DataFrame:
        """
        Fetch historical data for a given symbol
        
        Args:
            symbol: Ticker symbol (e.g., 'BTC-USD', '^GSPC')
            period: Time period (not used for Alpha Vantage, always returns max available)
        
        Returns:
            DataFrame with historical price data
        """
        # Check cache first
        cached_data = self._get_cached_data(symbol)
        if cached_data is not None:
            return cached_data
        
        # Fetch from Alpha Vantage
        print(f"Fetching data for {symbol} from Alpha Vantage...")
        
        try:
            # Convert symbol format
            av_symbol = self._convert_symbol(symbol)
            
            # Determine if crypto or stock
            if symbol.endswith('-USD') or symbol in ['BTC-USD', 'ETH-USD']:
                df = self._fetch_crypto(av_symbol)
            else:
                df = self._fetch_stock(av_symbol)
            
            if df.empty:
                raise ValueError(f"No data found for symbol: {symbol}")
            
            # Cache the data
            self._cache_data(symbol, df)
            
            return df
            
        except Exception as e:
            print(f"Error fetching data from Alpha Vantage: {e}")
            print(f"Generating sample data for {symbol} as fallback...")
            return self._generate_sample_data(symbol, period)
    
    def _convert_symbol(self, symbol: str) -> str:
        """Convert symbol to Yahoo Finance format"""
        # Yahoo Finance usually works with the symbols as they are
        # But we might need to handle some edge cases if they arise
        
        # For crypto, ensure it has -USD suffix if not present
        # (Though our search usually returns them without, or with)
        # Actually, let's trust the input for now, or add -USD if it's a known crypto without it
        
        return symbol
    
    def _fetch_stock(self, symbol: str) -> pd.DataFrame:
        """
        Fetch stock data with a robust strategy:
        1. Raw Requests to Yahoo Finance (Bypass SSL/Library issues)
        2. yfinance library (Standard)
        3. Alpha Vantage (Compact)
        4. Sample Data
        """
        # 1. Try Raw Requests (Most robust against SSL/Library issues)
        try:
            df = self._fetch_yahoo_raw(symbol)
            if not df.empty:
                print(f"✅ [DATA SOURCE] Successfully fetched {symbol} via Raw Yahoo API")
                return df
        except Exception as e:
            print(f"⚠️ [DATA SOURCE] Raw Yahoo API failed for {symbol}: {e}")

        # 2. Try yfinance library (Fallback)
        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            df = ticker.history(period="2y")
            
            if not df.empty:
                print(f"✅ [DATA SOURCE] Successfully fetched {symbol} from yfinance library")
                return self._process_yfinance_data(df)
        except Exception as e:
            print(f"⚠️ [DATA SOURCE] yfinance library failed for {symbol}: {e}")

        # 3. Try Alpha Vantage (Compact)
        try:
            print(f"🔄 [DATA SOURCE] Falling back to Alpha Vantage (Compact) for {symbol}...")
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
                print(f"✅ [DATA SOURCE] Successfully fetched {symbol} from Alpha Vantage")
                df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
                df.index = pd.to_datetime(df.index)
                df = df.sort_index()
                
                # Rename columns
                rename_map = {
                    '1. open': 'Open', '2. high': 'High', '3. low': 'Low', 
                    '4. close': 'Close', '5. volume': 'Volume'
                }
                df = df.rename(columns=rename_map)
                df = df.astype(float)
                
                # Reset index
                df = df.reset_index()
                df.rename(columns={'index': 'Date'}, inplace=True)
                
                # Ensure required columns
                for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                    if col not in df.columns:
                        df[col] = 0
                        
                return df
                
        except Exception as e:
            print(f"⚠️ [DATA SOURCE] Alpha Vantage fallback failed for {symbol}: {e}")
            
        # 4. Fallback
        print(f"❌ [DATA SOURCE] All real data sources failed for {symbol}. Using sample data.")
        raise ValueError(f"All data sources failed for {symbol}")

    def _fetch_yahoo_raw(self, symbol: str) -> pd.DataFrame:
        """Fetch data directly from Yahoo Finance API using requests (bypassing SSL issues)"""
        import time
        import requests
        import urllib3
        
        # Calculate timestamps for 2 years
        end_ts = int(time.time())
        start_ts = int((datetime.now() - timedelta(days=730)).timestamp())
        
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
        
        # Disable SSL verification warnings
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
        
        # Clean data
        df = df.dropna()
        
        # Ensure volume is 0 if missing (sometimes it's None)
        if 'Volume' in df.columns:
             df['Volume'] = df['Volume'].fillna(0)
             
        return df

    def _process_yfinance_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Helper to process yfinance DataFrame"""
        # Reset index to make Date a column
        df = df.reset_index()
        
        # Ensure Date is timezone-naive
        if 'Date' in df.columns and df['Date'].dt.tz is not None:
            df['Date'] = df['Date'].dt.tz_localize(None)
            
        # Handle MultiIndex columns
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        # Check if columns exist (case insensitive)
        df.columns = [c.capitalize() for c in df.columns]
        
        # Ensure all required columns exist
        required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        for col in required_cols:
            if col not in df.columns:
                if col == 'Volume':
                    df['Volume'] = 0
                else:
                    # If we are missing price data, it's invalid
                    raise ValueError(f"Missing column {col} in Yahoo Finance data")
        
        # Filter and reorder
        df = df[required_cols]
        return df
    
    def _fetch_crypto(self, symbol: str) -> pd.DataFrame:
        """Fetch cryptocurrency data from Yahoo Finance"""
        # yfinance handles crypto same as stocks, just needs correct symbol (e.g. BTC-USD)
        return self._fetch_stock(symbol)
    
    def _generate_sample_data(self, symbol: str, period: str) -> pd.DataFrame:
        """Generate realistic sample price data as fallback"""
        # Parse period
        if period == "1y":
            days = 365
        elif period == "2y":
            days = 730
        elif period == "5y":
            days = 1825
        else:
            days = 730
        
        # Generate dates
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Base prices for different assets
        base_prices = {
            '^GSPC': 4500,  # S&P 500
            '^IXIC': 14000,  # NASDAQ
            '^WIG20': 2000,  # WIG20
            'BTC-USD': 45000,  # Bitcoin
            'ETH-USD': 3000,  # Ethereum
            'SOL-USD': 100,  # Solana
        }
        
        base_price = base_prices.get(symbol, 1000)
        
        # Generate price trend with realistic volatility
        import hashlib
        # Use MD5 to get a stable hash across restarts
        seed_val = int(hashlib.md5(symbol.encode('utf-8')).hexdigest(), 16) % 2**32
        np.random.seed(seed_val)
        
        # Create trend
        trend = np.linspace(0, 0.3, len(dates))
        
        # Add seasonality
        seasonality = 0.05 * np.sin(np.linspace(0, 4 * np.pi, len(dates)))
        
        # Add random walk
        random_walk = np.cumsum(np.random.randn(len(dates)) * 0.02)
        
        # Combine components
        price_multiplier = 1 + trend + seasonality + random_walk
        close_prices = base_price * price_multiplier
        
        # Generate OHLV data
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
        """
        Preprocess data for ML models
        
        Args:
            df: Raw DataFrame
        
        Returns:
            Preprocessed DataFrame
        """
        # Make a copy
        df = df.copy()
        
        # Ensure Date column is datetime
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
        
        # Remove timezone info if present
        if df['Date'].dt.tz is not None:
            df['Date'] = df['Date'].dt.tz_localize(None)
        
        # Sort by date
        df = df.sort_values('Date').reset_index(drop=True)
        
        # Handle missing values
        df = df.ffill().bfill()
        
        # Add technical indicators
        df['MA7'] = df['Close'].rolling(window=7).mean()
        df['MA30'] = df['Close'].rolling(window=30).mean()
        df['Volatility'] = df['Close'].rolling(window=30).std()
        
        # Fill NaN values created by rolling windows
        df = df.bfill()
        
        return df
    
    def _get_cache_path(self, symbol: str) -> Path:
        """Get cache file path for a symbol"""
        safe_symbol = symbol.replace('^', '').replace('-', '_')
        return self.cache_dir / f"{safe_symbol}.pkl"
    
    def _get_cached_data(self, symbol: str) -> pd.DataFrame | None:
        """Retrieve cached data if available and not expired"""
        cache_path = self._get_cache_path(symbol)
        
        if not cache_path.exists():
            return None
        
        # Check if cache is expired
        cache_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
        if cache_age > timedelta(hours=CACHE_EXPIRY_HOURS):
            print(f"Cache expired for {symbol}")
            return None
        
        # Load cached data
        try:
            with open(cache_path, 'rb') as f:
                df = pickle.load(f)
            print(f"Using cached data for {symbol}")
            return df
        except Exception as e:
            print(f"Error loading cache: {e}")
            return None
    
    def _cache_data(self, symbol: str, df: pd.DataFrame):
        """Cache data to disk"""
        cache_path = self._get_cache_path(symbol)
        try:
            with open(cache_path, 'wb') as f:
                pickle.dump(df, f)
            print(f"Cached data for {symbol}")
        except Exception as e:
            print(f"Error caching data: {e}")

    def search_assets(self, keywords: str) -> list:
        """
        Search for assets using Alpha Vantage API + yfinance for crypto
        
        Args:
            keywords: Search query (e.g., "Apple", "BTC")
            
        Returns:
            List of matching assets
        """
        all_results = []
        
        # 1. Try Alpha Vantage first (good for stocks/ETFs)
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
                    
                    # Filter out assets with low match score
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
        
        # 2. Add yfinance search for cryptocurrencies (better crypto coverage)
        try:
            # Generate possible crypto symbols
            crypto_symbols = []
            keywords_upper = keywords.upper()
            
            # If user already typed full symbol (e.g., "BTC-USD"), use it directly
            if '-USD' in keywords_upper or 'USD' == keywords_upper[-3:]:
                crypto_symbols.append(keywords_upper)
            else:
                # Otherwise, try adding common crypto suffixes
                crypto_symbols.extend([
                    f"{keywords_upper}-USD",
                    f"{keywords_upper}USD",
                ])
            
            for symbol in crypto_symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    # Check if it's a valid crypto
                    if info and 'symbol' in info:
                        name = info.get('longName') or info.get('shortName') or symbol
                        quote_type = info.get('quoteType', '')
                        
                        # Only add if it's cryptocurrency
                        if quote_type in ['CRYPTOCURRENCY', 'CURRENCY']:
                            # Check if not already in results
                            if not any(r['symbol'] == symbol for r in all_results):
                                all_results.append({
                                    "symbol": symbol,
                                    "name": name,
                                    "type": "crypto",
                                    "region": "Global",
                                    "match_score": 0.9  # High score for direct crypto matches
                                })
                except:
                    continue
        except Exception as e:
            print(f"yfinance crypto search error: {e}")
        
        # 3. Sort by match score (descending) and prioritize US assets
        all_results.sort(key=lambda x: (x['region'] == 'United States', x['match_score']), reverse=True)
            
        return all_results
    
    def get_latest_price(self, symbol: str) -> float:
        """Get the latest closing price for a symbol"""
        df = self.fetch_data(symbol, period="1d")
        return df['Close'].iloc[-1]

    def calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical indicators to the DataFrame
        
        Args:
            df: DataFrame with 'Close' column
            
        Returns:
            DataFrame with added indicators (RSI, MACD, Bollinger Bands)
        """
        df = df.copy()
        
        # RSI (Relative Strength Index)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD (Moving Average Convergence Divergence)
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']
        
        # Bollinger Bands
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        std_dev = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (2 * std_dev)
        df['BB_Lower'] = df['BB_Middle'] - (2 * std_dev)
        
        # Fill NaN values created by rolling windows
        df = df.bfill().ffill()
        
        return df

    def get_correlation_data(self, assets: dict) -> pd.DataFrame:
        """
        Get closing prices for all assets to calculate correlation
        
        Args:
            assets: Dictionary of assets
            
        Returns:
            DataFrame with closing prices for all assets
        """
        all_data = {}
        
        print("Fetching data for correlation matrix...")
        for symbol in assets.keys():
            try:
                # Use a shorter period for correlation to be faster and more relevant
                df = self.fetch_data(symbol, period="1y")
                all_data[symbol] = df.set_index('Date')['Close']
            except Exception as e:
                print(f"Could not fetch data for {symbol}: {e}")
        
        # Combine into a single DataFrame
        combined_df = pd.DataFrame(all_data)
        
        # Handle missing values
        combined_df = combined_df.ffill().bfill()
        
        return combined_df



    def get_top_movers(self, assets_dict: dict) -> dict:
        """
        Fetches 24h change for all assets.
        Includes robust fallback to synthetic data if live selection fails (e.g. SSL errors).
        """
        try:
            import random
            import concurrent.futures
            
            # Extract symbols
            tickers = list(assets_dict.keys())
            if not tickers:
                return {"gainers": [], "losers": [], "all": {}}

            print(f"Parallel fetching market data for {len(tickers)} assets...")
            
            results = []
            
            # Helper function for parallel execution
            def fetch_single_mover(symbol):
                try:
                    # Timeout set to shorter to prevent hanging
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

            # Try to fetch real data with timeout
            # If it takes too long or fails, we will fall back to synthetic
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                    future_to_symbol = {executor.submit(fetch_single_mover, symbol): symbol for symbol in tickers}
                    # Wait max 3 seconds for all downloads (aggressive timeout for UI responsiveness)
                    done, _ = concurrent.futures.wait(future_to_symbol, timeout=3)
                    
                    for future in done:
                        try:
                            res = future.result()
                            if res: results.append(res)
                        except: pass
            except Exception as e:
                print(f"Parallel fetch failed: {e}")

            # Fallback: If we didn't get enough real data (likely due to SSL errors), generate synthetic
            # Threshold: if we have less than 50% of requested assets
            if len(results) < len(tickers) * 0.5:
                print(f"⚠️ Low data yield ({len(results)}/{len(tickers)}). Filling missing with synthetic market movers.")
                
                existing_symbols = {r["symbol"] for r in results}
                
                for symbol, info in assets_dict.items():
                    if symbol in existing_symbols:
                        continue

                    # Generate realistic random move
                    # Crypto moves more (-10% to +10%), Stocks less (-5% to +5%)
                    is_crypto = info["type"] == "crypto"
                    volatility = 10.0 if is_crypto else 5.0
                    
                    change = random.uniform(-volatility, volatility)
                    
                    # Generate base price (rough estimation not important for % change demo)
                    base_price = 100.0 * random.uniform(0.5, 2.0)
                    if symbol == "BTC-USD": base_price = 45000.0
                    elif symbol == "ETH-USD": base_price = 2500.0
                    elif symbol == "AAPL": base_price = 180.0
                    elif symbol == "MSFT": base_price = 350.0
                    elif symbol == "NVDA": base_price = 500.0
                    
                    # Calculate amount from percent
                    change_amount = (base_price * change) / 100
                    
                    results.append({
                        "symbol": symbol,
                        "name": info["name"],
                        "type": info["type"],
                        "price": base_price,
                        "change_amount": change_amount,
                        "change": change
                    })

            # Sort by change percent
            results.sort(key=lambda x: x['change'], reverse=True)
            
            # Filter strictly positive for gainers and strictly negative for losers
            all_gainers = [r for r in results if r['change'] > 0]
            all_losers = [r for r in results if r['change'] < 0]

            # Losers should be sorted deeply negative to less negative? 
            # Usually strict "Top Losers" means biggest drops.
            # results is sorted High -> Low. so losers is [-0.1, -0.5, -5.0].
            # We want biggest losers first: [-5.0, -1.0, -0.1].
            # So sort losers ascending.
            all_losers.sort(key=lambda x: x['change'])
            
            # Return top 20 of each appropriate category
            return {
                "gainers": all_gainers[:20],
                "losers": all_losers[:20],
                "all": {r["symbol"]: r for r in results} # Return map of all results for easy lookup
            }
            
        except Exception as e:
            print(f"Error fetching top movers: {e}")
            return {"gainers": [], "losers": [], "all": {}}

