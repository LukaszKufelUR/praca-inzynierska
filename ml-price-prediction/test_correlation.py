import sys
import os
import time
import pandas as pd

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.data_fetcher import DataFetcher
from src.config import ASSETS

def test_correlation_fetch():
    print("Starting correlation data fetch test...")
    fetcher = DataFetcher()
    
    start_time = time.time()
    try:
        df = fetcher.get_correlation_data(ASSETS)
        end_time = time.time()
        
        print(f"\nFetch completed in {end_time - start_time:.2f} seconds")
        print(f"DataFrame shape: {df.shape}")
        print("\nColumns (Assets):")
        print(df.columns.tolist())
        
        if df.empty:
            print("\n❌ DataFrame is empty!")
        else:
            print("\n✅ Data fetched successfully")
            print(df.head())
            
            # Calculate correlation
            corr = df.corr()
            print("\nCorrelation Matrix shape:", corr.shape)
            
    except Exception as e:
        print(f"\n❌ Error during fetch: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_correlation_fetch()
