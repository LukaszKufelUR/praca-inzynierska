# Giełdomat 📈

> **Zaawansowany system prognozowania cen aktywów finansowych wykorzystujący Uczenie Maszynowe.**

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)

---

## 📋 O Projekcie

**Giełdomat** to kompleksowa platforma analityczna stworzona w ramach pracy inżynierskiej. System integruje nowoczesne technologie webowe z zaawansowanymi algorytmami uczenia maszynowego (Prophet, LSTM) w celu dostarczania precyzyjnych prognoz krótkoterminowych dla rynków finansowych.

Aplikacja umożliwia analizę trendów, generowanie predykcji oraz zarządzanie portfelem obserwowanych aktywów w czasie rzeczywistym.

## 🚀 Kluczowe Funkcje

*   **🤖 Zaawansowane Modele AI**:
    *   **Prophet (Facebook)**: Ekspert w wykrywaniu sezonowości i trendów.
    *   **LSTM (Deep Learning)**: Sieci neuronowe do analizy sekwencyjnej (okno 60 dni).
*   **📊 Wszechstronna Analiza**: Obsługa indeksów (S&P 500, WIG20), kryptowalut (BTC, ETH) oraz akcji globalnych.
*   **⚡ Interaktywny Dashboard**: Responsywny interfejs React z wizualizacją danych w czasie rzeczywistym.
*   **⚖️ Porównywarka Modeli**: Bezpośrednie zestawienie wyników modeli z metrykami błędów (RMSE, MAE, MAPE).
*   **🔐 Strefa Użytkownika**: System kont, ulubione aktywa, historia prognoz i panel administracyjny.

---

## 🐳 Szybki Start (Docker)

To zalecany sposób uruchomienia aplikacji. Wymaga jedynie zainstalowanego **Docker Desktop**.

### 1. Uruchomienie

Otwórz terminal w folderze projektu i wpisz:

```powershell
docker-compose up --build
```
*(Flaga `--build` zapewnia, że uruchamiasz najnowszą wersję kodu)*

### 2. Dostęp

Poczekaj chwilę, aż kontenery wystartują. Aplikacja będzie dostępna pod adresem:
👉 **[http://localhost](http://localhost)**

API Backendowe dostępne jest pod: **[http://localhost:8000/docs](http://localhost:8000/docs)** (Swagger UI)

### 3. Zatrzymanie

Aby bezpiecznie wyłączyć aplikację i posprzątać kontenery:
```powershell
docker-compose down
```

---

## 🔧 Uruchomienie Manualne (Alternatywne)

Jeśli wolisz uruchomić aplikację bez Dockera, będziesz potrzebować **Python 3.10+** oraz **Node.js 16+**.

### Backend

1.  Przejdź do folderu `backend`:
    ```bash
    cd backend
    ```
2.  Zainstaluj zależności:
    ```bash
    pip install -r requirements.txt
    ```
3.  Uruchom serwer:
    ```bash
    uvicorn main:app --reload
    ```
    *Działa na porcie: 8000*

### Frontend

1.  Przejdź do folderu `frontend`:
    ```bash
    cd frontend
    ```
2.  Zainstaluj zależności:
    ```bash
    npm install
    ```
3.  Uruchom serwer deweloperski:
    ```bash
    npm run dev
    ```
    *Działa na porcie: 5173* (Domyślnie)

---

## 🛠️ Stos Technologiczny

### Backend (Python)
| Technologia | Opis |
| :--- | :--- |
| **FastAPI** | Nowoczesny, wysokowydajny framework webowy |
| **Prophet** | Biblioteka do prognozowania szeregów czasowych |
| **PyTorch / LSTM** | Implementacja sieci neuronowych |
| **SQLAlchemy** | ORM do komunikacji z bazą danych SQLite |
| **YFinance** | Źródło danych rynkowych |

### Frontend (React)
| Technologia | Opis |
| :--- | :--- |
| **Vite** | Narzędzie budowania nowej generacji |
| **TailwindCSS** | Utility-first CSS framework |
| **Recharts** | Biblioteka do wizualizacji danych |
| **Lucide React** | Nowoczesny zestaw ikon |
| **Axios** | Klient HTTP do komunikacji z API |

---

## 📁 Struktura Projektu

```plaintext
ml-price-prediction/
├── backend/                # Logika serwerowa i modele ML
│   ├── src/
│   │   ├── models/         # Definicje modeli (Prophet, LSTM)
│   │   ├── data_fetcher.py # Moduł pobierania danych
│   │   └── config.py       # Konfiguracja globalna
│   ├── database.py         # Połączenie z SQLite
│   └── main.py             # Punkt wejściowy API
├── frontend/               # Interfejs użytkownika
│   ├── public/             # Zasoby statyczne
│   └── src/
│       ├── components/     # Komponenty React (Modale, Wykresy)
│       ├── contexts/       # Zarządzanie stanem (Auth, Theme)
│       └── services/       # Komunikacja z API
├── docker-compose.yml      # Orkestracja kontenerów
└── README.md               # Dokumentacja projektu
```


