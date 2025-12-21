# 🚀 Szybka Instalacja z VENV (Rozwiązuje wszystkie problemy!)

## Krok 1: Stwórz środowisko wirtualne

Otwórz PowerShell w folderze projektu:

```powershell
cd C:\Users\Łukasz\Documents\Inzynierka\ml-price-prediction\backend
python -m venv venv
```

## Krok 2: Aktywuj venv

```powershell
.\venv\Scripts\Activate
```

**Powinieneś zobaczyć `(venv)` przed ścieżką w terminalu!**

## Krok 3: Zainstaluj zależności

```powershell
pip install -r requirements.txt
```

To zainstaluje wszystkie biblioteki w izolowanym środowisku.

## Krok 4: Uruchom backend

```powershell
uvicorn main:app --reload
```

**UWAGA:** Teraz używasz `uvicorn` (bez `python -m`) bo venv jest aktywowany!

## Krok 5: Uruchom frontend (nowy terminal)

W **nowym terminalu PowerShell**:

```powershell
cd C:\Users\Łukasz\Documents\Inzynierka\ml-price-prediction\frontend
npm run dev
```

## Krok 6: Otwórz przeglądarkę

http://localhost:5173

---

## Dlaczego venv działa?

✅ **Izolacja**: Biblioteki są oddzielone od systemowego Pythona  
✅ **Brak konfliktów**: Nie ma problemów z różnymi wersjami Pythona  
✅ **Czystość**: Świeża instalacja wszystkich pakietów  
✅ **Yahoo Finance**: Powinno działać bez problemów SSL

---

## Deaktywacja venv (gdy skończysz)

```powershell
deactivate
```

---

## Następnym razem

Wystarczy aktywować venv i uruchomić:

```powershell
cd C:\Users\Łukasz\Documents\Inzynierka\ml-price-prediction\backend
.\venv\Scripts\Activate
uvicorn main:app --reload
```
