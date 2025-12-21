# 🚀 Quick Start Guide

## Problem z Yahoo Finance? Użyj venv!

### Krok 1: Stwórz środowisko wirtualne

```powershell
cd C:\Users\Łukasz\Documents\Inzynierka\ml-price-prediction\backend
python -m venv venv
```

### Krok 2: Aktywuj venv

```powershell
.\venv\Scripts\Activate
```

### Krok 3: Zainstaluj zależności

```powershell
pip install -r requirements.txt
```

### Krok 4: Uruchom backend

```powershell
uvicorn main:app --reload
```

### Krok 5: Uruchom frontend (nowy terminal)

```powershell
cd C:\Users\Łukasz\Documents\Inzynierka\ml-price-prediction\frontend
npm run dev
```

### Krok 6: Otwórz przeglądarkę

http://localhost:5173

---

## Dlaczego venv rozwiązuje problem?

- ✅ Izoluje biblioteki od systemowego Pythona
- ✅ Unika konfliktów wersji
- ✅ Zapewnia czystą instalację yfinance
- ✅ Działa z Yahoo Finance API bez problemów SSL

## Jeśli nadal nie działa Yahoo Finance

Użyj alternatywnego źródła danych - Alpha Vantage (darmowe):
1. Zarejestruj się: https://www.alphavantage.co/support/#api-key
2. Dostaniesz darmowy klucz API
3. Zmodyfikujemy kod żeby używał Alpha Vantage zamiast Yahoo Finance
