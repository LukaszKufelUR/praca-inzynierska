# Giełdomat 📈

> **Zaawansowany system prognozowania cen aktywów finansowych wykorzystujący Uczenie Maszynowe**

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)

---

## O Projekcie

**Giełdomat** to kompleksowa platforma analityczna stworzona w ramach pracy inżynierskiej. System integruje nowoczesne technologie webowe z zaawansowanymi algorytmami uczenia maszynowego (Prophet, LSTM) w celu dostarczania precyzyjnych prognoz krótkoterminowych dla rynków finansowych.

Aplikacja umożliwia analizę trendów, generowanie predykcji oraz zarządzanie portfelem obserwowanych aktywów w czasie rzeczywistym.

---

##  Kluczowe Funkcje

- **Zaawansowane Modele AI**
  - **Prophet (Facebook)**: Ekspert w wykrywaniu sezonowości i trendów długoterminowych
  - **LSTM (Deep Learning)**: Sieci neuronowe z pamięcią długoterminową do analizy sekwencyjnej (okno 60 dni)
  
- **Wszechstronna Analiza**
  - Obsługa indeksów giełdowych (S&P 500, WIG20, NASDAQ)
  - Kryptowaluty (Bitcoin, Ethereum, Solana i inne)
  - Akcje polskie i globalne (KGHM, CD Projekt, Apple, Tesla)
  
- **Interaktywny Dashboard**
  - Responsywny interfejs React z wizualizacją w czasie rzeczywistym
  - Tryb ciemny/jasny
  - Wykresy interaktywne z możliwością zmiany zakresu danych
  
- **Porównywarka Modeli**
  - Bezpośrednie zestawienie wyników Prophet vs LSTM
  - Metryki błędów: RMSE, MAE, MAPE
  - Analiza techniczna (RSI, MACD, Bollinger Bands)
  
- **System Użytkowników**
  - Rejestracja i logowanie z JWT
  - Ulubione aktywa
  - Historia zapisanych prognoz
  - Panel administracyjny
  - Generowanie raportów HTML

---

## Szybki Start (Docker) - **ZALECANE**

To najprostszy sposób uruchomienia aplikacji. Wymaga jedynie zainstalowanego **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**.

### Uruchomienie

Otwórz terminal w głównym folderze projektu i wpisz:

```powershell
docker-compose up --build
```

> **Wskazówka:** Flaga `--build` zapewnia, że uruchamiasz najnowszą wersję kodu. Przy kolejnych uruchomieniach (bez zmian w kodzie) możesz użyć tylko `docker-compose up`.

### Dostęp do Aplikacji

Poczekaj 2-3 minuty, aż kontenery się zbudują i wystartują. Aplikacja będzie dostępna pod adresem:

- **Frontend:** [http://localhost](http://localhost)
- **Backend API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Pierwsze Logowanie

Domyślne konto administratora:
- **Email:** `admin@example.com`
- **Hasło:** `admin123`

> **Ważne:** Zmień hasło admina po pierwszym zalogowaniu!

### Zatrzymanie

Aby bezpiecznie wyłączyć aplikację:

```powershell
docker-compose down
```

> **Uwaga:** Baza danych (`ml_predictions.db`) jest zachowywana między restartami. Aby usunąć wszystkie dane, użyj `docker-compose down -v`.

---

## Uruchomienie Manualne (Dla Deweloperów)

Jeśli wolisz uruchomić aplikację bez Dockera (np. do developmentu), będziesz potrzebować:
- **Python 3.10+**
- **Node.js 18+**
- **npm lub yarn**

### Backend

1. Przejdź do folderu `backend`:
   ```bash
   cd backend
   ```

2. Zainstaluj zależności:
   ```bash
   pip install -r requirements.txt
   ```

3. Uruchom serwer deweloperski:
   ```bash
   python -m uvicorn main:app --reload
   ```
   
   Backend będzie dostępny na: `http://localhost:8000`

### Frontend

1. Przejdź do folderu `frontend`:
   ```bash
   cd frontend
   ```

2. Zainstaluj zależności:
   ```bash
   npm install
   ```

3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```
   
   Frontend będzie dostępny na: `http://localhost:5173`

---

## Stos Technologiczny

### Backend (Python)

| Technologia | Wersja | Opis |
|------------|--------|------|
| **FastAPI** | 0.104+ | Nowoczesny, wysokowydajny framework webowy z automatyczną dokumentacją |
| **Prophet** | 1.1.5+ | Biblioteka Facebook do prognozowania szeregów czasowych |
| **PyTorch** | 2.0+ | Framework deep learning do implementacji LSTM |
| **SQLAlchemy** | 2.0+ | ORM do komunikacji z bazą danych SQLite |
| **YFinance** | 0.2.40+ | Pobieranie danych rynkowych w czasie rzeczywistym |
| **Pandas** | 2.1+ | Analiza i przetwarzanie danych |
| **Scikit-learn** | 1.3+ | Metryki ewaluacji modeli |

### Frontend (React)

| Technologia | Wersja | Opis |
|------------|--------|------|
| **React** | 18+ | Biblioteka do budowy interfejsów użytkownika |
| **Vite** | 5+ | Szybkie narzędzie budowania nowej generacji |
| **TailwindCSS** | 3+ | Utility-first CSS framework |
| **Recharts** | 2+ | Biblioteka do wizualizacji danych |
| **Lucide React** | - | Nowoczesny zestaw ikon |
| **Axios** | 1+ | Klient HTTP do komunikacji z API |

---

## Struktura Projektu

```plaintext
ml-price-prediction/
├── backend/                    # Backend API (FastAPI)
│   ├── src/
│   │   ├── models/
│   │   │   ├── prophet_model.py    # Implementacja modelu Prophet
│   │   │   └── lstm_model.py       # Implementacja modelu LSTM
│   │   ├── data_fetcher.py         # Pobieranie danych z YFinance/Alpha Vantage
│   │   └── config.py               # Konfiguracja (lista aktywów, parametry)
│   ├── auth.py                     # Autentykacja JWT
│   ├── database.py                 # Połączenie z SQLite
│   ├── models.py                   # Modele SQLAlchemy (User, Prediction)
│   ├── schemas.py                  # Schematy Pydantic (walidacja)
│   ├── main.py                     # Punkt wejściowy API
│   ├── requirements.txt            # Zależności Python
│   └── Dockerfile                  # Konfiguracja kontenera
│
├── frontend/                   # Frontend (React + Vite)
│   ├── public/                     # Zasoby statyczne
│   ├── src/
│   │   ├── components/             # Komponenty React
│   │   │   ├── PriceChart.jsx          # Wykres cen i prognoz
│   │   │   ├── MetricsPanel.jsx        # Panel metryk modeli
│   │   │   ├── Sidebar.jsx             # Pasek boczny z aktywami
│   │   │   ├── AuthModal.jsx           # Modal logowania/rejestracji
│   │   │   └── AdminPanel.jsx          # Panel administracyjny
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx         # Kontekst autentykacji
│   │   │   └── ThemeContext.jsx        # Kontekst motywu (dark/light)
│   │   ├── services/
│   │   │   └── api.js                  # Komunikacja z backendem (Axios)
│   │   ├── App.jsx                     # Główny komponent aplikacji
│   │   └── main.jsx                    # Punkt wejściowy
│   ├── package.json                # Zależności Node.js
│   ├── tailwind.config.js          # Konfiguracja TailwindCSS
│   ├── nginx.conf                  # Konfiguracja Nginx (produkcja)
│   └── Dockerfile                  # Konfiguracja kontenera
│
├── docker-compose.yml          # Orkestracja kontenerów
└── README.md                   # Dokumentacja projektu
```

---

## Jak Działa System?

1. **Pobieranie Danych**
   - System automatycznie pobiera dane historyczne z Yahoo Finance
   - Dane są cache'owane lokalnie dla szybszego dostępu
   - Wsparcie dla akcji, indeksów i kryptowalut

2. **Trenowanie Modeli**
   - **Prophet**: Analizuje trendy, sezonowość i punkty zmiany
   - **LSTM**: Uczy się wzorców z ostatnich 60 dni danych
   - Modele są zapisywane i ładowane przy kolejnych prognozach

3. **Generowanie Prognoz**
   - Użytkownik wybiera aktywo i okres prognozy (7/14/30 dni)
   - Oba modele generują niezależne predykcje
   - Wyniki są porównywane z metrykami RMSE, MAE, MAPE

4. **Wizualizacja**
   - Interaktywny wykres z danymi historycznymi i prognozami
   - Analiza techniczna (RSI, MACD, Bollinger Bands)
   - Macierz korelacji między aktywami

---

## Bezpieczeństwo

- **Hasła**: Hashowane przy użyciu bcrypt
- **Autentykacja**: JWT (JSON Web Tokens) z czasem wygaśnięcia
- **Walidacja**: Pydantic schemas dla wszystkich endpointów API
- **CORS**: Skonfigurowany dla bezpiecznej komunikacji frontend-backend

Jeśli napotkasz problemy:
1. Sprawdź, czy Docker Desktop jest uruchomiony
2. Upewnij się, że porty 80 i 8000 są wolne
3. Sprawdź logi: `docker-compose logs -f`

---


