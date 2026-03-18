import sys
import requests
import io
from bs4 import BeautifulSoup
import time
import argparse

# Ensure proper encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

brute_force_payload = {
    "username": "admin",
    "password": "password123"
}

def test_login_form(url):
    vulnerable_forms = []
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        forms = soup.find_all('form')

        for i, form in enumerate(forms):
            action = form.get('action', '')
            method = form.get('method', 'get').lower()
            form_data = {}
            inputs = form.find_all('input')
            
            has_username = False
            has_password = False
            
            for input_field in inputs:
                name = input_field.get('name')
                if name == 'username' or name == 'user' or name == 'email' or name == 'login':
                    form_data[name] = brute_force_payload['username']
                    has_username = True
                elif name == 'password' or name == 'pass' or name == 'pwd':
                    form_data[name] = brute_force_payload['password']
                    has_password = True
                elif name:
                    form_data[name] = ""
            
            if has_username and has_password:
                action_url = url + action if action else url

                if method == 'post':
                    response = requests.post(action_url, data=form_data)
                else:
                    response = requests.get(action_url, params=form_data)

                if "incorrect password" in response.text.lower() or "invalid credentials" in response.text.lower() or "wrong password" in response.text.lower():
                    form_location = f"Form de login #{i+1}"
                    if action:
                        form_location += f" (action: {action})"
                    vulnerable_forms.append(form_location)
    except requests.RequestException:
        pass
    return vulnerable_forms

def test_rate_limiting(url):
    try:
        for _ in range(5):
            response = requests.post(url, data=brute_force_payload)
            if "too many requests" in response.text or response.status_code == 429:
                return True
            time.sleep(1)
    except requests.RequestException:
        return False
    return False

def test_account_lock(url):
    try:
        for _ in range(5):
            response = requests.post(url, data={"username": "wrong", "password": "wrong"})
            if "account locked" in response.text or "Too many failed attempts" in response.text:
                return True
            time.sleep(1)
    except requests.RequestException:
        return False
    return False

def test_captcha(url):
    try:
        response = requests.get(url)
        if "captcha" in response.text or "recaptcha" in response.text or "g-recaptcha" in response.text:
            return True
    except requests.RequestException:
        return False
    return False

def test_ip_protection(url):
    try:
        for _ in range(10):
            response = requests.post(url, data=brute_force_payload)
            if response.status_code == 403 or "blocked" in response.text:
                return True
            time.sleep(1)
    except requests.RequestException:
        return False
    return False

def test_session_protection(url):
    try:
        session = requests.Session()
        for _ in range(5):
            response = session.post(url, data=brute_force_payload)
            if "session expired" in response.text or "Please log in again" in response.text:
                return True
            time.sleep(1)
    except requests.RequestException:
        return False
    return False

def test_http_headers(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        if "X-Content-Type-Options" in response.headers or "Strict-Transport-Security" in response.headers:
            return True
    except requests.RequestException:
        return False
    return False

def test_brute_force(url):
    protections = [
        test_rate_limiting(url),
        test_account_lock(url),
        test_captcha(url),
        test_ip_protection(url),
        test_session_protection(url),
        test_http_headers(url)
    ]
    
    vulnerable_forms = test_login_form(url)
    is_vulnerable = len(vulnerable_forms) > 0 and not any(protections)
    return is_vulnerable, vulnerable_forms, protections

def parse_args():
    parser = argparse.ArgumentParser(description='Brute Force Attack Scanner')
    parser.add_argument('url', help='Target URL to scan')
    parser.add_argument('--intensity', choices=['fast', 'medium', 'thorough'], default='medium',
                      help='Scan intensity: fast, medium, or thorough')
    parser.add_argument('--follow-redirects', action='store_true', default=True,
                      help='Follow HTTP redirects')
    parser.add_argument('--max-depth', type=int, default=2,
                      help='Maximum depth for crawling')
    parser.add_argument('--username', help='Username for authentication')
    parser.add_argument('--password', help='Password for authentication')
    parser.add_argument('--login-url', help='URL for login page')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    target_url = args.url
    is_vulnerable, vulnerable_forms, protections = test_brute_force(target_url)

    if is_vulnerable:
        print("[VULNERABLE] Le site est vulnérable aux attaques par force brute.")
        print(f"[LOCATION] {'; '.join(vulnerable_forms)}")
        print("[PREVENTION] Pour prévenir les attaques par force brute:")
        print("1. Implémentez le verrouillage de compte après plusieurs tentatives échouées")
        print("2. Utilisez des CAPTCHAs ou d'autres challenges humains")
        print("3. Implémentez des délais exponentiels entre les tentatives")
        print("4. Utilisez l'authentification à deux facteurs (2FA)")
        print("5. Surveillez et bloquez les tentatives de connexion suspectes")
        print("[REFERENCE] https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html")
    else:
        print("[OK] Le site n'est pas vulnérable aux attaques par force brute.")
        if vulnerable_forms and any(protections):
            print("[INFO] Des formulaires de connexion ont été trouvés, mais des protections sont en place.")