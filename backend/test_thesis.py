import requests
import time
import json
import random


BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = f"test_thesis_{random.randint(1000,9999)}@example.com"
TEST_PASSWORD = "TestPassword123!"

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_result(name, passed, time_taken=None, error=None):
    status = f"{Color.GREEN}PASSED{Color.END}" if passed else f"{Color.RED}FAILED{Color.END}"
    time_str = f" ({time_taken:.3f}s)" if time_taken is not None else ""
    print(f"[{status}] Test: {name}{time_str}")
    if error:
        print(f"       {Color.RED}Error: {error}{Color.END}")

def run_tests():
    print(f"{Color.BLUE}=== ROZPOCZĘCIE AUTOMATYCZNYCH TESTÓW INTEGRACYJNYCH ==={Color.END}")
    print(f"Target: {BASE_URL}\n")
    
    token = None
    
    start = time.time()
    try:
        payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        if resp.status_code == 200:
            print_result("Rejestracja nowego użytkownika (DB Write)", True, time.time() - start)
        elif resp.status_code == 400 and "zarejestrowany" in resp.text:
             print_result("Rejestracja (Użytkownik już istnieje - OK)", True, time.time() - start)
        else:
            print_result("Rejestracja", False, error=resp.text)
    except Exception as e:
        print_result("Rejestracja", False, error=str(e))

    start = time.time()
    try:
        payload = {"username": TEST_EMAIL, "password": TEST_PASSWORD}
        resp = requests.post(f"{BASE_URL}/api/auth/login", data=payload)
        
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            print_result("Logowanie i generowanie JWT", True, time.time() - start)
        else:
            print_result("Logowanie", False, error=resp.text)
            return 
    except Exception as e:
        print_result("Logowanie", False, error=str(e))

    headers = {"Authorization": f"Bearer {token}"}

    start = time.time()
    try:
        resp = requests.get(f"{BASE_URL}/api/data/BTC-USD", headers=headers)
        if resp.status_code == 200 and len(resp.json()['data']) > 0:
            print_result("Pobieranie danych giełdowych (External API)", True, time.time() - start)
        else:
            print_result("Pobieranie danych", False, error=f"Status {resp.status_code}")
    except Exception as e:
        print_result("Pobieranie danych", False, error=str(e))

    start = time.time()
    try:
        payload = {"symbol": "BTC-USD", "periods": 7, "model_type": "prophet"}
        resp = requests.post(f"{BASE_URL}/api/predict/prophet", json=payload, headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            if "predictions" in data and "metrics" in data:
                print_result("Generowanie predykcji Prophet (ML Core)", True, time.time() - start)
                print(f"       -> MAE: {data['metrics']['mae']:.2f}, RMSE: {data['metrics']['rmse']:.2f}")
            else:
                print_result("Predykcja Prophet", False, error="Brak kluczy w JSON")
        else:
            print_result("Predykcja Prophet", False, error=resp.text)
    except Exception as e:
        print_result("Predykcja Prophet", False, error=str(e))

    start = time.time()
    try:
        resp = requests.get(f"{BASE_URL}/api/auth/me") 
        if resp.status_code == 401:
            print_result("Sec: Odmowa dostępu bez tokena", True, time.time() - start)
        else:
            print_result("Sec: Odmowa dostępu", False, error=f"Otrzymano kod {resp.status_code}")
    except Exception as e:
        print_result("Sec: Odmowa dostępu", False, error=str(e))

    start = time.time()
    try:
        del_email = f"delete_me_{random.randint(1000,9999)}@example.com"
        del_pass = "DeleteMe123!"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={"email": del_email, "password": del_pass})
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", data={"username": del_email, "password": del_pass})
        del_token = login_resp.json()["access_token"]
        del_headers = {"Authorization": f"Bearer {del_token}"}
        del_resp = requests.request("DELETE", f"{BASE_URL}/api/auth/me", json={"password": del_pass}, headers=del_headers)
        
        if del_resp.status_code == 200:
            check_resp = requests.get(f"{BASE_URL}/api/auth/me", headers=del_headers)
            if check_resp.status_code == 401:
                print_result("Usuwanie konta i weryfikacja wylogowania", True, time.time() - start)
            else:
                 print_result("Usuwanie konta (Konto nadal aktywne?)", False, error=f"Status weryfikacji: {check_resp.status_code}")
        else:
             print_result("Usuwanie konta", False, error=f"Status API: {del_resp.status_code} - {del_resp.text}")

    except Exception as e:
        print_result("Usuwanie konta", False, error=str(e))
        
    print(f"\n{Color.BLUE}=== ZAKOŃCZONO TESTY ==={Color.END}")

if __name__ == "__main__":
    run_tests()
