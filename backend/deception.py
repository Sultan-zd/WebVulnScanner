import requests
import sys
import io
import argparse

# Ensure proper encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FAKE_EXTENSIONS = [".css", ".jpg", ".html", ".txt"]
COMMON_PATHS = ["/account", "/profile", "/dashboard", "/settings", "/user"]
HEADERS = {"User-Agent": "Mozilla/5.0"}

def check_cache_deception(base_url):
    vulnerable_paths = []
    
    try:
        for path in COMMON_PATHS:
            for ext in FAKE_EXTENSIONS:
                url = base_url.rstrip("/") + path + ext
                r = requests.get(url, headers=HEADERS, timeout=10)
                cache_control = r.headers.get("Cache-Control", "").lower()

                if "public" in cache_control or "max-age" in cache_control:
                    vulnerable_paths.append(f"Path: {path}{ext} (Cache-Control: {cache_control})")
    except Exception:
        print("Erreur : impossible de se connecter au site.")
        sys.exit(1)

    if vulnerable_paths:
        print("[VULNERABLE] Le site est vulnérable à Web Cache Deception")
        print(f"[LOCATION] {'; '.join(vulnerable_paths)}")
        print("[PREVENTION] Pour prévenir le Web Cache Deception:")
        print("1. Configurez des règles de mise en cache basées sur des URLs exactes")
        print("2. Utilisez l'en-tête Cache-Control: no-store pour les pages sensibles")
        print("3. Vérifiez l'authentification sur chaque page sensible")
        print("4. Configurez correctement votre CDN ou reverse proxy")
        print("[REFERENCE] https://owasp.org/www-community/attacks/Cache_Deception_Attack")
    else:
        print("[OK] Le site n'est pas vulnérable à Web Cache Deception")

def parse_args():
    parser = argparse.ArgumentParser(description='Web Cache Deception Scanner')
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
    check_cache_deception(args.url)