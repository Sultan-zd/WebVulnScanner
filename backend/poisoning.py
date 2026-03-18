import requests
import sys
import io
import argparse

# Ensure proper encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HEADERS_TO_TEST = [
    {"X-Forwarded-Host": "evil.com"},
    {"X-Host": "evil.com"},
    {"X-Forwarded-Scheme": "http"},
    {"X-Original-URL": "/"},
]

def check_poisoning(target):
    vulnerable_headers = []
    
    try:
        base_response = requests.get(target, timeout=10)
    except Exception:
        print("Erreur : impossible de se connecter au site.")
        sys.exit(1)

    for header in HEADERS_TO_TEST:
        try:
            header_name = list(header.keys())[0]
            header_value = header[header_name]
            
            r = requests.get(target, headers=header, timeout=10)
            if r.status_code == 200 and r.text != base_response.text:
                vulnerable_headers.append(f"Header: {header_name} (valeur: {header_value})")
        except:
            continue

    if vulnerable_headers:
        print("[VULNERABLE] Le site est vulnérable à Web Cache Poisoning")
        print(f"[LOCATION] {'; '.join(vulnerable_headers)}")
        print("[PREVENTION] Pour prévenir le Web Cache Poisoning:")
        print("1. Vérifiez et validez tous les en-têtes HTTP utilisés par votre application")
        print("2. Configurez correctement votre CDN ou reverse proxy")
        print("3. Utilisez des règles de mise en cache basées sur une liste d'autorisation d'en-têtes")
        print("4. Implémentez des mécanismes de sécurité comme Subresource Integrity (SRI)")
        print("[REFERENCE] https://portswigger.net/web-security/web-cache-poisoning")
    else:
        print("[OK] Le site n'est pas vulnérable à Web Cache Poisoning")

def parse_args():
    parser = argparse.ArgumentParser(description='Web Cache Poisoning Scanner')
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
    check_poisoning(args.url)