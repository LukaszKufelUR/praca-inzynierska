
import yfinance as yf
import pandas as pd
import requests
import certifi

print(f"Certifi path: {certifi.where()}")

tickers = ["BTC-USD", "AAPL"]
print(f"Downloading {tickers}...")

try:
    data = yf.download(tickers, period="5d", progress=False)
    print("Download success!")
    print(data)
except Exception as e:
    print(f"Download failed: {e}")
