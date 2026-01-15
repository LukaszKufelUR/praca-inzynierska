ASSETS = {
    "^GSPC": {"name": "S&P 500", "type": "index"},
    "^IXIC": {"name": "NASDAQ", "type": "index"},
    "^WIG20": {"name": "WIG20", "type": "index"},
    "^DJI": {"name": "Dow Jones Industrial Average", "type": "index"},
    "^GDAXI": {"name": "DAX (Germany)", "type": "index"},
    "^FTSE": {"name": "FTSE 100 (UK)", "type": "index"},
    "^N225": {"name": "Nikkei 225 (Japan)", "type": "index"},
    "^FCHI": {"name": "CAC 40 (France)", "type": "index"},

    "AAPL": {"name": "Apple Inc.", "type": "stock"},
    "MSFT": {"name": "Microsoft Corp.", "type": "stock"},
    "GOOGL": {"name": "Alphabet Inc. (Google)", "type": "stock"},
    "AMZN": {"name": "Amazon.com Inc.", "type": "stock"},
    "TSLA": {"name": "Tesla Inc.", "type": "stock"},
    "NVDA": {"name": "NVIDIA Corp.", "type": "stock"},
    "META": {"name": "Meta Platforms", "type": "stock"},
    "NFLX": {"name": "Netflix Inc.", "type": "stock"},
    "AMD": {"name": "AMD", "type": "stock"},
    "INTC": {"name": "Intel Corp.", "type": "stock"},

    "CDR.WA": {"name": "CD Projekt", "type": "stock"},
    "PKO.WA": {"name": "PKO BP", "type": "stock"},
    "KGH.WA": {"name": "KGHM", "type": "stock"},
    "ALE.WA": {"name": "Allegro", "type": "stock"},
    "DNP.WA": {"name": "Dino Polska", "type": "stock"},
    "PKN.WA": {"name": "Orlen", "type": "stock"},
    "LPP.WA": {"name": "LPP", "type": "stock"},
    "PEO.WA": {"name": "Pekao SA", "type": "stock"},
    
    "BTC-USD": {"name": "Bitcoin", "type": "crypto"},
    "ETH-USD": {"name": "Ethereum", "type": "crypto"},
    "SOL-USD": {"name": "Solana", "type": "crypto"},
    "BNB-USD": {"name": "Binance Coin", "type": "crypto"},
    "XRP-USD": {"name": "XRP", "type": "crypto"},
    "ADA-USD": {"name": "Cardano", "type": "crypto"},
    "DOGE-USD": {"name": "Dogecoin", "type": "crypto"},
    "DOT-USD": {"name": "Polkadot", "type": "crypto"},
    "AVAX-USD": {"name": "Avalanche", "type": "crypto"},
    "POL-USD": {"name": "Polygon (POL)", "type": "crypto"},
    "LINK-USD": {"name": "Chainlink", "type": "crypto"},
    "UNI-USD": {"name": "Uniswap", "type": "crypto"},
    "ATOM-USD": {"name": "Cosmos", "type": "crypto"},
    "LTC-USD": {"name": "Litecoin", "type": "crypto"},
    "BCH-USD": {"name": "Bitcoin Cash", "type": "crypto"},
    "ALGO-USD": {"name": "Algorand", "type": "crypto"},
    "XLM-USD": {"name": "Stellar", "type": "crypto"},
    "VET-USD": {"name": "VeChain", "type": "crypto"},
    "FIL-USD": {"name": "Filecoin", "type": "crypto"},
    "TRX-USD": {"name": "TRON", "type": "crypto"},
}

PREDICTION_HORIZONS = [7, 14, 30]

DEFAULT_HISTORY_PERIOD = "2y"
CACHE_EXPIRY_HOURS = 1

LSTM_LOOKBACK_DAYS = 60
LSTM_EPOCHS = 50
LSTM_BATCH_SIZE = 32
LSTM_VALIDATION_SPLIT = 0.2

PROPHET_CHANGEPOINT_PRIOR_SCALE = 0.05
PROPHET_SEASONALITY_PRIOR_SCALE = 10

PROPHET_MODEL_DIR = "saved_models/prophet"
LSTM_MODEL_DIR = "saved_models/lstm"
CACHE_DIR = "data/cache"
