# WebVulnScanner

WebVulnScanner is a comprehensive web application security testing tool that helps identify various vulnerabilities in web applications. Built with React + Vite for the frontend and Node.js + Python for the backend, it provides a modern, efficient interface for security testing.

## Features

- **Multiple Vulnerability Scans:**
  - Cross-Site Scripting (XSS) Detection
  - SQL Injection Testing
  - HTML Injection Analysis
  - Local File Inclusion (LFI) Detection
  - Web Cache Poisoning Tests
  - Web Cache Deception Analysis
  - Brute Force Attack Testing
  - Web Crawler Functionality

- **Advanced Scanning Options:**
  - Configurable scan intensity
  - Authentication support
  - Customizable depth for crawling
  - Redirect following
  - Retry mechanisms for reliability
  - Batch URL scanning

## Tech Stack

- **Frontend:**
  - React 18+
  - Vite
  - TailwindCSS
  - Modern UI/UX design

- **Backend:**
  - Node.js Express server
  - Python security scripts
  - RESTful API architecture

## Prerequisites

- Python 3.7 or higher
- Node.js 14.x or higher
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/LahsenAitOiahmane/WebVulnScanner.git
cd WebVulnScanner
```

2. Install backend dependencies:
```bash
cd backend
npm install
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd ../
npm install
```

## Usage

1. Start the backend server:
```bash
cd backend
node server.js
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Access the application at `http://localhost:5173`

## Configuration

The scanner can be configured with various options:

- `intensity`: Scan intensity (low/medium/high)
- `maxDepth`: Maximum crawling depth
- `followRedirects`: Whether to follow redirects
- `timeout`: Scan timeout in seconds
- `maxRetries`: Number of retry attempts

## API Endpoints

- `/scan-xss` - XSS vulnerability scanning
- `/scan-sqli` - SQL injection testing
- `/scan-html` - HTML injection analysis
- `/scan-lfi` - Local File Inclusion detection
- `/scan-poisoning` - Web Cache Poisoning tests
- `/scan-deception` - Web Cache Deception analysis
- `/scan-brute` - Brute Force attack testing
- `/crawl` - Web crawler functionality
- `/scan-multiple` - Batch scanning of multiple URLs

## Dependencies

All required Python packages are listed in `backend/requirements.txt`. Key dependencies include:
- requests
- beautifulsoup4
- selenium
- aiohttp
- cryptography
- and more

For a complete list of Python dependencies, see the requirements.txt file.

## Security Notes

- Always obtain proper authorization before scanning any website
- Use responsibly and ethically
- Avoid scanning websites without permission
- Be aware of local security testing laws and regulations

## Cross-Platform Compatibility

WebVulnScanner is platform-independent and can run on:
- Windows
- Linux
- macOS

The tool has been designed to work consistently across all major operating systems.

## Contributing

Contributions are welcome! Please feel free to submit pull requests.


## Disclaimer

This tool is for educational and security testing purposes only. Users are responsible for obtaining proper authorization before scanning any web applications. The developers are not responsible for any misuse or damage caused by this tool.
