import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import sys
import io
import json
import time
import re
import random
from itertools import product

# Redirect stdout and stderr to avoid any unintentional output
original_stdout = sys.stdout
original_stderr = sys.stderr

# Create new IO streams for debugging output
debug_stream = io.StringIO()
sys.stderr = debug_stream

# Function to log to debug stream only
def log(message):
    print(message, file=debug_stream)

class WebCrawler:
    def __init__(self, base_url, max_pages=20, max_depth=3):
        self.base_url = base_url
        self.max_pages = int(max_pages)
        self.max_depth = int(max_depth)
        self.visited_urls = set()
        self.results = []
        
        # Common endpoints to try at each path level
        self.common_endpoints = [
            # Admin and authentication
            "admin", "login", "register", "logout", "signup", "signin",
            # User related
            "search", "profile", "account", "view-profile", "user", "users", "member", "members",
            # Content
            "dashboard", "home", "index", "main", "welcome",
            # Functions
            "search", "find", "query", "browse", "filter", "results",
            # Actions
            "upload", "download", "edit", "delete", "remove", "create", "new", "add",
            # Content types
            "post", "posts", "article", "articles", "blog", "news", "page", "pages",
            "file", "files", "document", "documents", "image", "images", "photo", "photos",
            # E-commerce
            "product", "products", "cart", "checkout", "order", "orders", "item", "items",
            "category", "categories", "catalog", "shop", "store",
            # API
            "api", "rest", "json", "data", "feed", "rss", "xml",
            # Settings and info
            "settings", "config", "preferences", "options", "help",
            "about", "contact", "support", "info", "faq", "privacy", "terms",
            # System
            "admin-panel", "controlpanel", "cp", "administrator", "moderator",
            "backend", "system", "console", "manage", "management",
            # Misc
            "forum", "forums", "comment", "comments", "message", "messages",
            "notification", "notifications", "event", "events"
        ]
        
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        })

    def get_base_domain(self):
        """Get base domain without path"""
        parsed_url = urlparse(self.base_url)
        return f"{parsed_url.scheme}://{parsed_url.netloc}"

    def is_valid_url(self, url):
        """Check if the URL is valid and belongs to the same domain."""
        if not url:
            return False
            
        parsed_base = urlparse(self.base_url)
        parsed_url = urlparse(url)
        
        # Make sure URL is from the same domain
        if parsed_base.netloc != parsed_url.netloc:
            return False
            
        # Avoid common file extensions that are not web pages
        if re.search(r"\.(jpg|jpeg|png|gif|css|js|ico|pdf|doc|docx|xls|xlsx|zip|tar|gz|svg)$", url, re.IGNORECASE):
            return False
            
        return True

    def extract_forms(self, url):
        """Extract form details from a page."""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return []
                
            soup = BeautifulSoup(response.text, 'html.parser')
            forms_data = []
            
            for i, form in enumerate(soup.find_all('form')):
                action = form.get('action', '')
                method = form.get('method', 'get').lower()
                
                # Normalize action URL
                if not action:
                    action = url
                else:
                    action = urljoin(url, action)
                
                # Extract inputs
                inputs = []
                for input_tag in form.find_all(['input', 'textarea', 'select']):
                    input_type = input_tag.get('type', 'text')
                    input_name = input_tag.get('name', '')
                    if input_name:
                        inputs.append({
                            'name': input_name,
                            'type': input_type
                        })
                
                forms_data.append({
                    'id': i + 1,
                    'action': action,
                    'method': method,
                    'inputs': inputs
                })
            
            return forms_data
        except Exception as e:
            log(f"Error extracting forms from {url}: {e}")
            return []

    def analyze_page(self, url):
        """Analyze page for forms, parameters, and potential vulnerabilities."""
        try:
            # Get page content
            response = self.session.get(url, timeout=10)
            if response.status_code == 404:
                return None
            
            # Basic page info
            page_info = {
                'url': url,
                'status_code': response.status_code,
                'title': '',
                'forms': self.extract_forms(url),
                'inputs': 0,
                'scripts': 0,
                'links': 0
            }
            
            if response.status_code != 200:
                return page_info
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Get page title
            title_tag = soup.find('title')
            if title_tag:
                page_info['title'] = title_tag.text.strip()
            
            # Count inputs (potential injection points)
            page_info['inputs'] = len(soup.find_all(['input', 'textarea', 'select']))
            
            # Count scripts
            page_info['scripts'] = len(soup.find_all('script'))
            
            # Count links
            page_info['links'] = len(soup.find_all('a', href=True))
            
            return page_info
        except Exception as e:
            log(f"Error analyzing {url}: {e}")
            return None

    def generate_url_paths(self, depth):
        """Generate combinations of paths for a given depth"""
        if depth == 1:
            return [self.get_base_domain()]
        
        # For depth > 1, generate all possible path combinations
        base_domain = self.get_base_domain()
        
        # Generate combinations for each depth level
        # e.g. for depth=3, we have:
        # - /endpoint1/
        # - /endpoint1/endpoint2/
        paths = []
        
        if depth >= 2:
            # Add all endpoints at depth 1
            for endpoint in self.common_endpoints:
                paths.append(f"{base_domain}/{endpoint}")
                
        if depth >= 3:
            # Generate combinations for depth 2
            # We'll limit to a subset of combinations to avoid too many requests
            second_level_endpoints = random.sample(self.common_endpoints, min(30, len(self.common_endpoints)))
            for first in self.common_endpoints[:20]:  # Limit first level to 20 endpoints
                for second in second_level_endpoints[:10]:  # Limit second level to 10 endpoints
                    paths.append(f"{base_domain}/{first}/{second}")
        
        return paths

    def crawl(self):
        """Main crawling method - systematically test paths at different depths."""
        # Start with the base URL
        log(f"Starting crawler on {self.base_url} with depth {self.max_depth}")
        
        # Process each depth level
        for current_depth in range(1, self.max_depth + 1):
            log(f"Processing depth level {current_depth}...")
            
            # Generate URL paths for this depth level
            urls_to_check = self.generate_url_paths(current_depth)
            
            # Limit the number of URLs to check to avoid overwhelming
            if len(urls_to_check) > self.max_pages:
                urls_to_check = random.sample(urls_to_check, self.max_pages)
            
            # Process each URL at this depth
            for url in urls_to_check:
                if url in self.visited_urls or len(self.results) >= self.max_pages:
                    continue
                
                # Add to visited set
                self.visited_urls.add(url)
                
                # Process the URL
                log(f"Checking: {url}")
                page_info = self.analyze_page(url)
                
                if page_info:
                    # Add results for non-404 pages
                    if page_info.get('status_code') != 404:
                        self.results.append(page_info)
                
                # Respect the server with a small delay
                time.sleep(random.uniform(0.3, 0.7))
                
                # Stop if we've reached the maximum number of pages
                if len(self.results) >= self.max_pages:
                    log(f"Reached maximum number of pages ({self.max_pages})")
                    break
        
        # Sort results by status code (successful pages first)
        self.results.sort(key=lambda x: 0 if x.get('status_code') == 200 else x.get('status_code', 999))
        
        return {
            'crawled_urls': len(self.visited_urls),
            'found_pages': len(self.results),
            'max_depth': self.max_depth,
            'pages': self.results
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        log("Usage: python crawler.py <url> [max_pages] [max_depth]")
        sys.exit(1)
        
    url = sys.argv[1]
    max_pages = sys.argv[2] if len(sys.argv) > 2 else 20
    max_depth = sys.argv[3] if len(sys.argv) > 3 else 3
    
    try:
        crawler = WebCrawler(url, max_pages, max_depth)
        results = crawler.crawl()
        
        # Restore original stdout for final output only
        sys.stdout = original_stdout
        
        # Only output the JSON to stdout - this is what the server will parse
        print(json.dumps(results, indent=2))
    except Exception as e:
        # In case of error, log to stderr and exit
        sys.stderr = original_stderr
        print(f"Error during crawling: {str(e)}", file=sys.stderr)
        sys.exit(1) 