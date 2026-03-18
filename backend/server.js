const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

function parseCommandOutput(stdout, vulnerability) {
  console.log(`Raw output for ${vulnerability}:`, stdout);
  
  // Initialize result structure with expanded fields
  const result = {
    vulnerability: vulnerability,
    status: "UNKNOWN",
    isVulnerable: false,
    location: "",
    prevention: [],
    reference: "",
    details: "", // New field for additional technical details
    impact: "", // New field for potential impact
    severity: "MEDIUM" // Default severity level
  };

  // Process the output line by line
  const lines = stdout.split('\n');
  let section = "status";
  let hasFoundVulnerability = false;

  for (let line of lines) {
    line = line.trim();
    
    if (!line) continue;
    
    console.log(`Processing line: "${line}"`);

    if (line.startsWith('[VULNERABLE]')) {
      result.status = "VULNERABLE";
      result.isVulnerable = true;
      hasFoundVulnerability = true;
      // Extract severity if provided in format [VULNERABLE:HIGH]
      const severityMatch = line.match(/\[VULNERABLE:(\w+)\]/);
      if (severityMatch) {
        result.severity = severityMatch[1];
      }
    } else if (line.startsWith('[OK]')) {
      result.status = "SECURE";
      result.isVulnerable = false;
    } else if (line.startsWith('[LOCATION]')) {
      result.location = line.replace('[LOCATION]', '').trim();
      section = "location";
    } else if (line.startsWith('[PREVENTION]')) {
      section = "prevention";
    } else if (line.startsWith('[REFERENCE]')) {
      result.reference = line.replace('[REFERENCE]', '').trim();
      section = "reference";
    } else if (line.startsWith('[DETAILS]')) {
      result.details = line.replace('[DETAILS]', '').trim();
      section = "details";
    } else if (line.startsWith('[IMPACT]')) {
      result.impact = line.replace('[IMPACT]', '').trim();
      section = "impact";
    } else if (line.startsWith('[SEVERITY]')) {
      result.severity = line.replace('[SEVERITY]', '').trim();
    } else if (section === "prevention" && line.match(/^\d+\./)) {
      result.prevention.push(line);
    } else if (section === "details" && !line.startsWith('[')) {
      result.details += " " + line;
    } else if (section === "impact" && !line.startsWith('[')) {
      result.impact += " " + line;
    }
  }

  // If no explicit status was found but vulnerability was detected
  if (result.status === "UNKNOWN" && hasFoundVulnerability) {
    result.status = "VULNERABLE";
    result.isVulnerable = true;
  }

  console.log(`Parsed result for ${vulnerability}:`, result);
  return result;
}

app.post('/scan-xss', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python xss_scanner11.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan XSS: ${stdout}`);
    
    // Handle XSS special case - might have both reflected and stored XSS results
    const lines = stdout.split('\n');
    let hasReflectedVuln = false;
    let hasStoredVuln = false;
    
    for (let line of lines) {
      if (line.includes('vulnérable à reflected XSS')) {
        hasReflectedVuln = true;
      }
      if (line.includes('vulnérable à stored XSS')) {
        hasStoredVuln = true;
      }
    }
    
    // Combine results
    const result = parseCommandOutput(stdout, 'XSS');
    
    // Update vulnerability status based on both types
    result.isVulnerable = hasReflectedVuln || hasStoredVuln;
    if (result.isVulnerable) {
      result.status = "VULNERABLE";
      if (hasReflectedVuln && hasStoredVuln) {
        result.location = "Vulnérable à la fois aux attaques XSS reflétées et stockées";
      } else if (hasReflectedVuln) {
        result.location = "Vulnérable aux attaques XSS reflétées";
      } else if (hasStoredVuln) {
        result.location = "Vulnérable aux attaques XSS stockées";
      }
    }
    
    res.json(result);
  });
});

app.post('/scan-html', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python injectionHTML.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan html injection: ${stdout}`);
    res.json(parseCommandOutput(stdout, 'HTML Injection'));
 });
});

app.post('/scan-brute', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python brute-force.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan brute force: ${stdout}`);
    res.json(parseCommandOutput(stdout, 'Brute Force'));
 });
});

app.post('/scan-poisoning', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python poisoning.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan web cache poisoning: ${stdout}`);
    res.json(parseCommandOutput(stdout, 'Web Cache Poisoning'));
 });
});

app.post('/scan-deception', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python deception.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan web cache deception: ${stdout}`);
    res.json(parseCommandOutput(stdout, 'Web Cache Deception'));
 });
});

app.post('/scan-sqli', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python sqli.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan SQL injection: ${stdout}`);
    res.json(parseCommandOutput(stdout, 'SQL Injection'));
 });
});

app.post('/scan-lfi', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const command = `python lfi.py ${url}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
   if (error) {
    console.error(`Erreur lors de l'exécution: ${stderr}`);
    return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution' });
   }

    console.log(`Résultat du scan lfi: ${stdout}`);
    res.json(parseCommandOutput(stdout, 'Local File Inclusion'));
  });
});

// Add a new endpoint for the crawler
app.post('/crawl', (req, res) => {
  const { url, maxPages, maxDepth } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  const max_pages = maxPages || 20;
  const max_depth = maxDepth || 3;

  const command = `python crawler.py ${url} ${max_pages} ${max_depth}`;

  exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution du crawler: ${stderr}`);
      return res.status(500).json({ error: stderr || 'Erreur lors de l\'exécution du crawler' });
    }

    console.log(`Résultat du crawler: ${stdout}`);
    
    try {
      // Clean the output to ensure we only get valid JSON
      let jsonOutput = stdout.trim();
      // Find where the JSON starts (looking for first '{')
      const jsonStart = jsonOutput.indexOf('{');
      if (jsonStart !== -1) {
        jsonOutput = jsonOutput.substring(jsonStart);
      }
      
      const crawlerResult = JSON.parse(jsonOutput);
      res.json(crawlerResult);
    } catch (e) {
      console.error('Erreur lors du parsing du résultat du crawler:', e);
      console.error('Output brut:', stdout);
      res.status(500).json({ error: 'Erreur lors du parsing du résultat du crawler' });
    }
  });
});

// Add a new endpoint for scanning multiple URLs with enhanced options
app.post('/scan-multiple', async (req, res) => {
  const { urls, vulnerabilities, options } = req.body;

  if (!urls || !urls.length || !vulnerabilities || !vulnerabilities.length) {
    return res.status(400).json({ error: 'URLs ou vulnérabilités manquantes' });
  }

  // Parse additional options with defaults
  const scanOptions = {
    intensity: options?.intensity || 'medium',
    maxDepth: options?.maxDepth || 3,
    followRedirects: options?.followRedirects !== false,
    useAuth: options?.useAuth || false,
    username: options?.username || '',
    password: options?.password || '',
    timeout: options?.timeout || 30,
    maxRetries: options?.maxRetries || 2
  };

  try {
    const results = [];
    
    // Process each URL
    for (const url of urls) {
      const urlResults = [];
      
      // Process each vulnerability type
      for (const vuln of vulnerabilities) {
        let endpoint = null;
        
        if (vuln === 'xss') endpoint = 'scan-xss';
        else if (vuln === 'html-injection') endpoint = 'scan-html';
        else if (vuln === 'brute-force') endpoint = 'scan-brute';
        else if (vuln === 'web-cache-poisoning') endpoint = 'scan-poisoning';
        else if (vuln === 'web-cache-deception') endpoint = 'scan-deception';
        else if (vuln === 'sql-injection') endpoint = 'scan-sqli';
        else if (vuln === 'lfi') endpoint = 'scan-lfi';
        
        if (endpoint) {
          // Build command with options
          const scriptName = getScriptName(endpoint);
          let command = `python ${scriptName} ${url}`;
          
          // Add intensity flag if supported
          if (scanOptions.intensity !== 'medium') {
            command += ` --intensity ${scanOptions.intensity}`;
          }
          
          // Add authentication options if needed
          if (scanOptions.useAuth && scanOptions.username && scanOptions.password) {
            command += ` --username "${scanOptions.username}" --password "${scanOptions.password}"`;
          }
          
          // Add additional options
          if (endpoint === 'scan-xss' || endpoint === 'scan-html') {
            command += ` --max-depth ${scanOptions.maxDepth}`;
          }
          
          if (scanOptions.followRedirects) {
            command += ` --follow-redirects`;
          }
          
          try {
            const { stdout, stderr } = await execPromise(command, { 
              encoding: 'utf8',
              timeout: scanOptions.timeout * 1000  // Convert to milliseconds
            });
            
            if (stderr) {
              console.error(`Erreur lors de l'exécution: ${stderr}`);
              urlResults.push({
                url,
                vulnerability: vuln,
                error: stderr
              });
            } else {
              const result = parseCommandOutput(stdout, getVulnName(vuln));
              result.url = url;
              urlResults.push(result);
            }
          } catch (error) {
            // Implement retry logic
            let retrySuccessful = false;
            for(let retry = 0; retry < scanOptions.maxRetries; retry++) {
              try {
                console.log(`Retry attempt ${retry+1} for ${url} - ${vuln}`);
                const { stdout } = await execPromise(command, { 
                  encoding: 'utf8',
                  timeout: scanOptions.timeout * 1000
                });
                const result = parseCommandOutput(stdout, getVulnName(vuln));
                result.url = url;
                urlResults.push(result);
                retrySuccessful = true;
                break;
              } catch (retryError) {
                console.error(`Retry ${retry+1} failed: ${retryError.message}`);
              }
            }
            
            if (!retrySuccessful) {
              console.error(`All retries failed for ${url} - ${vuln}: ${error.message}`);
              urlResults.push({
                url,
                vulnerability: vuln,
                error: error.message,
                status: "ERROR"
              });
            }
          }
        }
      }
      
      results.push({
        url,
        results: urlResults
      });
    }
    
    res.json({ 
      results,
      meta: {
        scannedUrls: urls.length,
        scannedVulnerabilities: vulnerabilities.length,
        options: scanOptions
      }
    });
    
  } catch (error) {
    console.error(`Erreur globale: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to convert exec to Promise
function execPromise(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Helper function to get script name from endpoint
function getScriptName(endpoint) {
  switch (endpoint) {
    case 'scan-xss': return 'xss_scanner11.py';
    case 'scan-html': return 'injectionHTML.py';
    case 'scan-brute': return 'brute-force.py';
    case 'scan-poisoning': return 'poisoning.py';
    case 'scan-deception': return 'deception.py';
    case 'scan-sqli': return 'sqli.py';
    case 'scan-lfi': return 'lfi.py';
    default: return '';
  }
}

// Helper function to get vulnerability name
function getVulnName(vuln) {
  switch (vuln) {
    case 'xss': return 'XSS';
    case 'html-injection': return 'HTML Injection';
    case 'brute-force': return 'Brute Force';
    case 'web-cache-poisoning': return 'Web Cache Poisoning';
    case 'web-cache-deception': return 'Web Cache Deception';
    case 'sql-injection': return 'SQL Injection';
    case 'lfi': return 'Local File Inclusion';
    default: return vuln;
  }
}

app.listen(5000, '0.0.0.0', () => console.log('Backend lancé sur http://0.0.0.0:5000'));
