# Giełdomat

Aplikacja do monitorowania i predykcji cen kursów giełdowych i kryptowalutowych z wykorzystaniem uczenia maszynowego. System wykorzystuje zaawansowane modele Prophet i LSTM do generowania prognoz cenowych.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 🚀 Funkcje

- **Dwa Modele ML**: Prognozy Prophet (szeregi czasowe) i LSTM (sieci neuronowe)
- **Wiele Aktywów**: Wsparcie dla indeksów giełdowych (S&P 500, NASDAQ, WIG20), akcji i kryptowalut (Bitcoin, Ethereum, Solana)
- **Interaktywny Dashboard**: Nowoczesny interfejs React z wykresami w czasie rzeczywistym
- **Porównanie Modeli**: Metryki wydajności obok siebie (RMSE, MAE, MAPE)
- **Elastyczne Prognozy**: Prognozy na 7, 14 lub 30 dni
- **Zarządzanie Danymi**: Efektywne cachowanie danych
- **System Uwierzytelniania**: Rejestracja, logowanie i zarządzanie ulubionymi aktywami
- **Historia Prognoz**: Zapisywanie i wczytywanie wcześniejszych prognoz

## 📊 Wspierane Aktywa

### Indeksy Giełdowe
- **^GSPC** - S&P 500
- **^IXIC** - NASDAQ
- **^WIG20** - WIG20 (indeks polski)

### Kryptowaluty
- **BTC-USD** - Bitcoin
- **ETH-USD** - Ethereum
- **SOL-USD** - Solana

### Akcje i ETF-y
Możliwość wyszukiwania tysięcy akcji i funduszy ETF z różnych giełd światowych.

## 🛠️ Stos Technologiczny

### Backend
- **Python 3.9+** - Język programowania
- **FastAPI** - Framework REST API
- **Prophet** - Prognozowanie szeregów czasowych (Facebook)
- **TensorFlow/Keras** - Sieci neuronowe LSTM
- **yfinance** - Dane z Yahoo Finance
- **pandas/numpy** - Przetwarzanie danych
- **SQLAlchemy** - ORM dla bazy danych
- **bcrypt** - Hashowanie haseł

### Frontend
- **React 18** - Framework UI
- **Vite** - Narzędzie budowania
- **TailwindCSS** - Stylowanie
- **Recharts** - Interaktywne wykresy
- **Axios** - Klient HTTP
- **Lucide React** - Ikony

## 📦 Instalacja

### Wymagania
- Python 3.9 lub nowszy
- Node.js 16 lub nowszy
- pip i npm

### Konfiguracja Backend

```bash
cd backend
pip install -r requirements.txt
```

### Konfiguracja Frontend

```bash
cd frontend
npm install
```

## 🚀 Uruchomienie Aplikacji

### Uruchomienie Serwera Backend

```bash
cd backend
uvicorn main:app --reload
```

API będzie dostępne pod adresem `http://localhost:8000`
- Dokumentacja API: `http://localhost:8000/docs`

### Uruchomienie Serwera Frontend

```bash
cd frontend
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`

## 📖 Użytkowanie

1. **Wybierz Aktywo**: Wybierz z indeksów giełdowych, akcji lub kryptowalut
2. **Wybierz Okres Prognozy**: Wybierz 7, 14 lub 30 dni
3. **Generuj Prognozy**: Kliknij przycisk, aby wytrenować modele i wygenerować prognozy
4. **Analizuj Wyniki**: Przeglądaj interaktywne wykresy i porównuj wydajność modeli
5. **Zapisz Prognozy**: Zaloguj się, aby zapisywać ulubione aktywa i prognozy

## 🔌 Endpointy API

- `GET /api/assets` - Lista wszystkich dostępnych aktywów
- `GET /api/data/{symbol}` - Pobierz dane historyczne
- `POST /api/predict/prophet` - Prognozy Prophet
- `POST /api/predict/lstm` - Prognozy LSTM
- `POST /api/predict/both` - Oba modele z porównaniem
- `POST /api/auth/register` - Rejestracja użytkownika
- `POST /api/auth/login` - Logowanie użytkownika
- `GET /api/favorites` - Lista ulubionych aktywów
- `GET /api/predictions/history` - Historia zapisanych prognoz

## 📁 Struktura Projektu

```
ml-price-prediction/
├── backend/
│   ├── main.py                 # Aplikacja FastAPI
│   ├── requirements.txt        # Zależności Python
│   ├── database.py            # Konfiguracja bazy danych
│   └── src/
│       ├── config.py          # Konfiguracja
│       ├── data_fetcher.py    # Pobieranie danych
│       ├── auth.py            # Uwierzytelnianie
│       └── models/
│           ├── prophet_model.py
│           └── lstm_model.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Główna aplikacja
│   │   ├── components/       # Komponenty React
│   │   ├── contexts/         # Konteksty React
│   │   └── services/         # Klient API
│   └── package.json
└── README.md
```

## 🧪 Szczegóły Modeli

### Model Prophet
- Prognozowanie szeregów czasowych z automatyczną detekcją sezonowości
- Obsługa trendów i świąt
- Przedziały ufności
- Szybkie trenowanie i predykcja

### Model LSTM
- Głęboka sieć neuronowa
- Okno wsteczne 60 dni
- Architektura 2-warstwowa LSTM
- Regularyzacja Dropout zapobiegająca przeuczeniu

## 📊 Metryki Wydajności

System ocenia modele używając:
- **RMSE** (Root Mean Square Error) - Ogólna dokładność predykcji
- **MAE** (Mean Absolute Error) - Średni błąd predykcji
- **MAPE** (Mean Absolute Percentage Error) - Dokładność procentowa

## 🎯 Przyszłe Ulepszenia

- [x] System uwierzytelniania użytkowników
- [x] Zapisywanie ulubionych aktywów
- [x] Historia prognoz
- [ ] Aktualizacje cen w czasie rzeczywistym (WebSocket)
- [ ] Dodatkowe modele ML (ARIMA, GRU, Transformer)
- [ ] Analiza sentymentu z wiadomości
- [ ] Framework backtestingu
- [ ] Aplikacja mobilna (React Native)
- [ ] Alerty email/SMS dla celów cenowych

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Autor

Projekt stworzony jako praca inżynierska demonstrująca zastosowanie uczenia maszynowego w prognozowaniu finansowym.

## 🙏 Podziękowania

- Yahoo Finance za dane finansowe
- Zespół Facebook Prophet
- Zespół TensorFlow/Keras
- Społeczności React i FastAPI
