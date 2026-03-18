import requests
from bs4 import BeautifulSoup
import sys
import io
import argparse
from urllib.parse import urljoin

# Ensure proper encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_html_injection(url):
    payloads = [
        "<h1>Test Injection</h1>",
        "<script>alert('XSS')</script>",
        "<img src='x' onerror='alert(1)' />",
        "<svg/onload=alert(1)>",
        "<iframe src='javascript:alert(1)'></iframe>",
        "<body onload=alert(1)>",
        "<a href='javascript:alert(1)'>Click me</a>",
        "<div onmouseover='alert(1)'>Test XSS</div>",
        "<input type='text' value='<script>alert(1)</script>' />",
        "<style>body{background-image:url('javascript:alert(1)');}</style>"
    ]

    vulnerable_points = []

    try:
        # Test GET parameters
        for payload in payloads:
            test_url = f"{url}?q={payload}"
            response = requests.get(test_url, timeout=5)
            if payload in response.text:
                vulnerable_points.append(f"URL parameter: q")
                break

        # Test forms
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        forms = soup.find_all('form')
        
        for i, form in enumerate(forms):
            action = form.get('action') or ''
            method = form.get('method', 'get').lower()
            inputs = form.find_all(['input', 'textarea', 'select', 'button'])

            if not inputs:
                continue

            form_data = {}
            input_names = []
            for input_field in inputs:
                name = input_field.get('name')
                if name:
                    form_data[name] = payloads[0]
                    input_names.append(name)

            if method == 'post':
                post_url = urljoin(url, action) if action else url
                post_response = requests.post(post_url, data=form_data, timeout=5)
                if payloads[0] in post_response.text:
                    form_location = f"Form #{i+1}"
                    if action:
                        form_location += f" (action: {action})"
                    if input_names:
                        form_location += f" (fields: {', '.join(input_names)})"
                    vulnerable_points.append(form_location)
                    break
    except:
        pass

    return vulnerable_points

def parse_args():
    parser = argparse.ArgumentParser(description='HTML Injection Scanner')
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
    url = args.url
    vulnerable_points = test_html_injection(url)

    if vulnerable_points:
        print("[VULNERABLE] Le site est vulnérable à l'injection HTML.")
        print(f"[LOCATION] {'; '.join(vulnerable_points)}")
        print("[PREVENTION] Pour prévenir les injections HTML:")
        print("1. Validez et nettoyez toutes les entrées utilisateur")
        print("2. Encodez correctement toutes les sorties HTML")
        print("3. Utilisez des bibliothèques d'échappement comme DOMPurify")
        print("4. Implémentez une politique de sécurité du contenu (CSP)")
        print("[REFERENCE] https://owasp.org/www-community/attacks/xss/")
    else:
        print("[OK] Le site n'est pas vulnérable à l'injection HTML.")