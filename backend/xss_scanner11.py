import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
import argparse
import io
import sys

# Ensure proper encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# === Payloads XSS ===
payloads = [
    "<script>alert('XSS')</script>",
    "\"><script>alert('XSS')</script>",
    "'><img src=x onerror=alert('XSS')>",
    "<svg onload=alert(1)>",
    "<body onload=alert('XSS')>"
]

found_reflected = False
found_stored = False

def browser_check(url, cookies=None):
    options = Options()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)

    parsed_url = urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    driver.get(base_url)

    if cookies:
        for cookie in cookies:
            try:
                driver.add_cookie({
                    'name': cookie.name,
                    'value': cookie.value,
                    'domain': parsed_url.hostname,
                    'path': '/',
                })
            except:
                continue

    driver.get(url)
    time.sleep(2)
    try:
        alert = driver.switch_to.alert
        alert.accept()
        driver.quit()
        return True
    except:
        driver.quit()
        return False

def get_forms(url, session):
    try:
        soup = BeautifulSoup(session.get(url).content, "html.parser")
        return soup.find_all("form")
    except:
        return []

def form_details(form):
    details = {
        "action": form.attrs.get("action"),
        "method": form.attrs.get("method", "get").lower(),
        "inputs": []
    }
    for tag in form.find_all(["input", "textarea", "select"]):
        name = tag.attrs.get("name")
        tag_type = tag.attrs.get("type", "text")
        if name:
            details["inputs"].append({"type": tag_type, "name": name})
    return details

def submit_form(details, url, payload, session):
    target_url = urljoin(url, details["action"])
    data = {}
    for input in details["inputs"]:
        if input["type"] in ["text", "search", "email", "textarea"]:
            data[input["name"]] = payload
    if details["method"] == "post":
        return session.post(target_url, data=data)
    else:
        return session.get(target_url, params=data)

def test_reflected_xss(url, session):
    global found_reflected
    reflected_location = ""
    forms = get_forms(url, session)
    for i, form in enumerate(forms):
        details = form_details(form)
        for payload in payloads:
            response = submit_form(details, url, payload, session)
            if response and payload in response.text:
                if browser_check(response.url, session.cookies):
                    found_reflected = True
                    form_location = f"Form #{i+1}"
                    if details["inputs"]:
                        vulnerable_inputs = [input_field["name"] for input_field in details["inputs"] 
                                           if input_field["type"] in ["text", "search", "email", "textarea"]]
                        form_location += f" (fields: {', '.join(vulnerable_inputs)})"
                    reflected_location = form_location
                    return reflected_location
    return reflected_location

def test_stored_xss(url, session):
    global found_stored
    stored_location = ""
    for payload in payloads:
        data = {
            "txtName": "XSS Tester",
            "mtxMessage": payload,
            "btnSign": "Sign Guestbook"
        }
        try:
            response = session.post(url, data=data)
            time.sleep(2)
            if browser_check(url, session.cookies):
                found_stored = True
                stored_location = "Formulaire de commentaires/posts (champs: txtName, mtxMessage)"
                return stored_location
        except:
            continue
    return stored_location

def login(login_url, username, password):
    session = requests.Session()
    if not login_url:
        return session
    data = {"login": username, "password": password, "form": "submit"}
    session.post(login_url, data=data)
    return session

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="URL cible")
    parser.add_argument("--login-url", help="URL de login")
    parser.add_argument("--username", help="Nom d'utilisateur")
    parser.add_argument("--password", help="Mot de passe")
    # Add the new arguments to match other scanners
    parser.add_argument("--intensity", choices=['fast', 'medium', 'thorough'], default='medium',
                      help='Scan intensity: fast, medium, or thorough')
    parser.add_argument("--follow-redirects", action='store_true', default=True, 
                      help='Follow HTTP redirects')
    parser.add_argument("--max-depth", type=int, default=2, 
                      help='Maximum depth for crawling')
    args = parser.parse_args()

    session = login(args.login_url, args.username, args.password)
    reflected_loc = test_reflected_xss(args.url, session)
    stored_loc = test_stored_xss(args.url, session)

    if found_reflected:
        print("[VULNERABLE] Le site est vulnérable à reflected XSS")
        print(f"[LOCATION] {reflected_loc}")
        print("[PREVENTION] Pour prévenir les attaques XSS:")
        print("1. Validez et nettoyez toutes les entrées utilisateur")
        print("2. Utilisez des bibliothèques d'échappement HTML")
        print("3. Implémentez une politique de sécurité du contenu (CSP)")
        print("4. Utilisez l'attribut HttpOnly pour les cookies sensibles")
        print("[REFERENCE] https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html")
    else:
        print("[OK] Le site n'est pas vulnérable à reflected XSS")

    if found_stored:
        print("[VULNERABLE] Le site est vulnérable à stored XSS")
        print(f"[LOCATION] {stored_loc}")
        print("[PREVENTION] Pour prévenir les attaques XSS stockées:")
        print("1. Validez et filtrez les entrées côté serveur ET côté client")
        print("2. Encodez la sortie HTML, JavaScript, CSS et URL")
        print("3. Utilisez des frameworks modernes avec protection XSS intégrée")
        print("4. Utilisez une liste d'autorisation (whitelist) pour les balises HTML autorisées")
        print("[REFERENCE] https://owasp.org/www-community/attacks/xss/")
    else:
        print("[OK] Le site n'est pas vulnérable à stored XSS")

if __name__ == "__main__":
    main()