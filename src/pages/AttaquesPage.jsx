import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faUserShield,
  faCode,
  faExclamationTriangle,
  faSearch,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faShieldVirus,
  faBook,
  faExternalLinkAlt,
  faSpider,
  faLink,
  faAngleRight,
  faListAlt,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";

const vulnerabilitiesList = [
  {
    id: 'xss',
    label: 'XSS (Reflected + Stored)',
    icon: faCode,
    description: 'Cross-site scripting attacks: reflected and stored.',
  },
  {
    id: 'sql-injection',
    label: 'SQL Injection',
    icon: faExclamationTriangle,
    description: 'Injecting SQL to manipulate database.',
  },
  {
    id: 'html-injection',
    label: 'HTML Injection',
    icon: faCode,
    description: 'Injecting HTML into pages viewed by other users.',
  },
  {
    id: 'web-cache-poisoning',
    label: 'Web Cache Poisoning',
    icon: faExclamationTriangle,
    description: 'Serving malicious content from cache to users.',
  },
  {
    id: 'web-cache-deception',
    label: 'Web Cache Deception',
    icon: faExclamationTriangle,
    description: 'Tricking the cache into storing sensitive data.',
  },
  {
    id: 'brute-force',
    label: 'Brute Force Test',
    icon: faUserShield,
    description: 'Testing login forms with multiple password attempts.',
  },
  {
    id: 'lfi',
    label: 'Local File Inclusion',
    icon: faExclamationTriangle,
    description: 'Exploiting vulnerable file inclusion functionality to access sensitive files on the server.',
  }
];

// Helper function to safely decode text with accented characters
const decodeText = (text) => {
  try {
    // First try to normalize any HTML entities
    const decoded = text.replace(/&amp;/g, '&')
                         .replace(/&lt;/g, '<')
                         .replace(/&gt;/g, '>')
                         .replace(/&quot;/g, '"')
                         .replace(/&#39;/g, "'")
                         .replace(/&eacute;/g, 'é')
                         .replace(/&egrave;/g, 'è')
                         .replace(/&agrave;/g, 'à')
                         .replace(/&ccedil;/g, 'ç')
                         .replace(/&ecirc;/g, 'ê')
                         .replace(/&euml;/g, 'ë');
    return decoded;
  } catch (e) {
    console.error("Error decoding text:", e);
    return text;
  }
};

// Define the main steps of the workflow
const STEPS = {
  CRAWL: 'crawl',
  SELECT_ATTACKS: 'select_attacks',
  SELECT_URLS: 'select_urls',
  RESULTS: 'results'
};

const AttaquesPage = () => {
  const { state } = useLocation();
  const { url } = state || {};

  // Application state
  const [currentStep, setCurrentStep] = useState(STEPS.CRAWL);
  const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);
  const [scanIntensity, setScanIntensity] = useState("fast");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [selectedUrlFilter, setSelectedUrlFilter] = useState('all');
  
  // Crawler state
  const [crawlerMaxPages, setCrawlerMaxPages] = useState(20);
  const [crawlerMaxDepth, setCrawlerMaxDepth] = useState(3);
  const [crawlerResults, setCrawlerResults] = useState(null);
  const [crawlerLoading, setCrawlerLoading] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState([]);

  const allIds = vulnerabilitiesList.map(v => v.id);

  // Check if we can proceed to the next step
  const canProceed = () => {
    switch(currentStep) {
      case STEPS.CRAWL:
        return crawlerResults !== null;
      case STEPS.SELECT_ATTACKS:
        return selectedVulnerabilities.length > 0;
      case STEPS.SELECT_URLS:
        return selectedUrls.length > 0;
      default:
        return false;
    }
  };

  // Move to the next step if conditions are met
  const nextStep = () => {
    if (!canProceed()) return;
    
    switch(currentStep) {
      case STEPS.CRAWL:
        setCurrentStep(STEPS.SELECT_ATTACKS);
        break;
      case STEPS.SELECT_ATTACKS:
        setCurrentStep(STEPS.SELECT_URLS);
        break;
      case STEPS.SELECT_URLS:
        handleScan();
        setCurrentStep(STEPS.RESULTS);
        break;
      default:
        break;
    }
  };

  // Toggle vulnerability selection
  const toggleVulnerability = (id) => {
    if (id === 'all') {
      setSelectedVulnerabilities(
        selectedVulnerabilities.length === vulnerabilitiesList.length ? [] : allIds
      );
    } else {
      setSelectedVulnerabilities(prev =>
        prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
      );
    }
  };

  const isChecked = (id) => {
    if (id === 'all') return selectedVulnerabilities.length === vulnerabilitiesList.length;
    return selectedVulnerabilities.includes(id);
  };

  // Crawler functions
  const handleCrawl = async () => {
    if (!url) return;
    
    setCrawlerLoading(true);
    setCrawlerResults(null);
    
    try {
      const response = await fetch('http://localhost:5000/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          maxPages: crawlerMaxPages, 
          maxDepth: crawlerMaxDepth 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCrawlerResults(data);
        
        // Automatically select all URLs with 200 status code
        if (data.pages) {
          const validUrls = data.pages
            .filter(page => page.status_code === 200)
            .map(page => page.url);
          setSelectedUrls(validUrls);
        }
      } else {
        alert('Erreur lors du crawl');
      }
    } catch (error) {
      console.error('Erreur de requête de crawl:', error);
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setCrawlerLoading(false);
    }
  };
  
  const toggleUrlSelection = (url) => {
    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url) 
        : [...prev, url]
    );
  };
  
  const selectAllUrls = () => {
    if (crawlerResults && crawlerResults.pages) {
      const allUrls = crawlerResults.pages.map(page => page.url);
      setSelectedUrls([...allUrls]);
    }
  };
  
  const deselectAllUrls = () => {
    setSelectedUrls([]);
  };

  // Perform the scan with selected attacks and URLs
  const handleScan = async () => {
    if (selectedVulnerabilities.length === 0) {
      alert("Please select at least one vulnerability.");
      return;
    }

    if (selectedUrls.length === 0) {
      alert("Please select at least one URL to scan.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/scan-multiple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          urls: selectedUrls, 
          vulnerabilities: selectedVulnerabilities,
          options: {
            intensity: scanIntensity
          }
        }),
          });

          if (response.ok) {
            const data = await response.json();
        if (data.results) {
          // Flatten the results from all URLs
          const flattenedResults = [];
          data.results.forEach(urlResult => {
            urlResult.results.forEach(vulnResult => {
              flattenedResults.push({
                ...vulnResult,
                targetUrl: urlResult.url
              });
            });
          });
          setReportData(flattenedResults);
        }
      } else {
        alert('Erreur lors du scan multiple');
      }
    } catch (error) {
      console.error('Erreur de requête:', error);
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filter unique URLs from the report data
  const getUniqueUrls = () => {
    if (!reportData || reportData.length === 0) return [];
    const urls = [...new Set(reportData.map(item => item.targetUrl || item.url))];
    return urls;
  };

  // Filter report data based on selected URL
  const getFilteredReportData = () => {
    if (selectedUrlFilter === 'all') return reportData;
    return reportData.filter(item => (item.targetUrl || item.url) === selectedUrlFilter);
  };

  // Render the progress bar
  const renderProgressBar = () => {
    const steps = [
      { key: STEPS.CRAWL, label: "Crawl", icon: faSpider },
      { key: STEPS.SELECT_ATTACKS, label: "Select Attacks", icon: faShieldAlt },
      { key: STEPS.SELECT_URLS, label: "Select URLs", icon: faLink },
      { key: STEPS.RESULTS, label: "Results", icon: faListAlt }
    ];

    return (
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.key} 
              className={`flex flex-col items-center w-1/4 ${
                currentStep === step.key 
                  ? 'text-cyan-500' 
                  : index < steps.findIndex(s => s.key === currentStep) 
                    ? 'text-green-500' 
                    : 'text-gray-400'
              }`}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
                currentStep === step.key 
                  ? 'border-cyan-500 bg-cyan-100' 
                  : index < steps.findIndex(s => s.key === currentStep)
                    ? 'border-green-500 bg-green-100' 
                    : 'border-gray-300 bg-white'
              }`}>
                <FontAwesomeIcon icon={step.icon} />
              </div>
              <span className="mt-2 text-xs text-center font-medium">{step.label}</span>
            </div>
          ))}
        </div>
        
        <div className="relative mt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="h-1 w-full bg-gray-200 rounded"></div>
          </div>
          <div className="absolute inset-0 flex items-center">
            <div 
              className="h-1 bg-cyan-400 rounded" 
              style={{ 
                width: `${(steps.findIndex(s => s.key === currentStep) / (steps.length - 1)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat text-gray-800 py-10" style={{ backgroundImage: "url('/pexels-photo-3861976.webp')" }}>
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-center mb-4 text-slate-50" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
          Website Security Scanner
        </h1>

        {url && (
          <div className="text-center mb-6">
            <h2 className="text-xl text-slate-100" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              Target URL: <span className="text-cyan-400">"</span>
              <span className="font-semibold text-white">{url}</span>
              <span className="text-cyan-400">"</span>
            </h2>
          </div>
        )}

        {/* Progress bar */}
        {renderProgressBar()}

        {/* STEP 1: CRAWLER */}
        {currentStep === STEPS.CRAWL && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-10">
            <h3 className="text-xl font-medium text-gray-800 flex items-center mb-4">
              <FontAwesomeIcon icon={faSpider} className="mr-2 text-cyan-400" />
              Web Crawler
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Pages
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={crawlerMaxPages}
                  onChange={(e) => setCrawlerMaxPages(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Depth
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={crawlerMaxDepth}
                  onChange={(e) => setCrawlerMaxDepth(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <button
              onClick={handleCrawl}
              className="bg-cyan-400 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg shadow-md transition mr-2"
              disabled={crawlerLoading}
            >
              {crawlerLoading ? (
                <div className="flex justify-center items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Crawling...</span>
                </div>
              ) : (
                'Start Crawling'
              )}
            </button>
            
            {crawlerResults && (
              <div className="mt-6">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-lg font-medium text-green-800 mb-2">
                    Crawling Complete!
                  </h4>
                  <p className="text-green-700">
                    Found {crawlerResults.found_pages} pages by crawling {crawlerResults.crawled_urls} URLs
                  </p>
                </div>
                
                <button
                  onClick={nextStep}
                  className="bg-cyan-400 hover:bg-cyan-500 text-white py-2 px-6 rounded-lg shadow-md transition flex items-center"
                >
                  <span>Next: Select Attacks</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SELECT ATTACKS */}
        {currentStep === STEPS.SELECT_ATTACKS && (
          <div className="mb-10">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-xl font-medium text-gray-800 flex items-center mb-4">
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-cyan-400" />
                Select Attacks to Test
              </h3>
              
              <div className="mb-4 flex justify-end">
          <label className="inline-flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked('all')}
              onChange={() => toggleVulnerability('all')}
              className="accent-cyan-400 w-5 h-5"
            />
                  <span className="text-sm font-medium">Select All</span>
          </label>
        </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {vulnerabilitiesList.map(({ id, label, icon, description }) => (
            <label
              key={id}
                    className={`flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all ${selectedVulnerabilities.includes(id) ? 'border-cyan-400 ring-1 ring-cyan-400 bg-cyan-50' : 'border-gray-300 bg-white'}`}
            >
              <input
                type="checkbox"
                checked={isChecked(id)}
                onChange={() => toggleVulnerability(id)}
                className="accent-cyan-400 mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <FontAwesomeIcon icon={icon} className="text-cyan-400" />
                  <span className="font-semibold text-gray-800">{label}</span>
                </div>
                <p className="text-sm text-slate-600">{description}</p>
              </div>
            </label>
          ))}
        </div>

              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-2">Scan Intensity</h4>
          <div className="space-x-4">
            {['fast', 'medium', 'thorough'].map(level => (
              <label key={level} className="inline-flex items-center space-x-1">
                <input
                  type="radio"
                  name="scanIntensity"
                  value={level}
                  checked={scanIntensity === level}
                  onChange={(e) => setScanIntensity(e.target.value)}
                  className="accent-cyan-400"
                />
                      <span className="capitalize text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        </div>

              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center py-2 px-6 rounded-lg shadow-md transition ${
                  canProceed() 
                    ? 'bg-cyan-400 hover:bg-cyan-500 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Next: Select URLs</span>
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT URLS */}
        {currentStep === STEPS.SELECT_URLS && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-10">
            <h3 className="text-xl font-medium text-gray-800 flex items-center mb-4">
              <FontAwesomeIcon icon={faLink} className="mr-2 text-cyan-400" />
              Select URLs to Test
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Select the URLs you want to test with the selected attacks. 
                Each URL will be tested against all selected vulnerabilities.
              </p>
              
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedUrls.length} of {crawlerResults?.pages?.length || 0} URLs selected
                  </span>
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={selectAllUrls}
                    className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded-md"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={deselectAllUrls}
                    className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded-md"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md mb-4">
                {crawlerResults?.pages && crawlerResults.pages.map((page, index) => (
                  <div key={index} className={`flex items-center p-2 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={selectedUrls.includes(page.url)}
                      onChange={() => toggleUrlSelection(page.url)}
                      className="accent-cyan-400 mr-2"
                    />
                    <div className="flex-1 truncate text-sm">
                      <span className={page.status_code === 200 
                        ? 'font-medium text-cyan-600' 
                        : 'text-gray-700'
                      }>
                        {page.url} 
                        {page.status_code !== 200 && (
                          <span className="text-gray-500 ml-2">({page.status_code})</span>
                        )}
                      </span>
                    </div>
                    {page.forms && page.forms.length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">
                        {page.forms.length} forms
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-xs text-gray-500 mb-4">
                <FontAwesomeIcon icon={faLink} className="mr-1" /> 
                URLs in <span className="text-cyan-600">blue</span> returned HTTP 200 status code
              </div>
              
          <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center py-2 px-6 rounded-lg shadow-md transition ${
                  canProceed() 
                    ? 'bg-cyan-400 hover:bg-cyan-500 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Start Scanning {selectedUrls.length} URLs</span>
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {currentStep === STEPS.RESULTS && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-10">
            <h3 className="text-xl font-medium text-gray-800 flex items-center mb-4">
              <FontAwesomeIcon icon={faListAlt} className="mr-2 text-cyan-400" />
              Scan Results
            </h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700">Scanning selected URLs...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
              </div>
            ) : (
              <>
                {reportData.length > 0 ? (
                  <>
                    {/* Add URL filter dropdown */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter Results by URL:
                      </label>
                      <select
                        value={selectedUrlFilter}
                        onChange={(e) => setSelectedUrlFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">Show All URLs</option>
                        {getUniqueUrls().map((url, index) => (
                          <option key={index} value={url}>
                            {url}
                          </option>
                        ))}
                      </select>
        </div>

            <div className="space-y-6">
                      {getFilteredReportData().map((scan, idx) => (
                        <div 
                          key={idx} 
                          className={`bg-white shadow-md rounded-lg overflow-hidden ${
                            scan.isVulnerable 
                              ? 'border-l-4 border-red-500' 
                              : 'border-l-4 border-green-500'
                          }`}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                <FontAwesomeIcon 
                                  icon={faSearch} 
                                  className="mr-2 text-cyan-500"
                                />
                                {scan.vulnerability}
                                
                                {/* Show target URL */}
                                <div className="ml-2 text-sm font-normal text-gray-500 flex items-center">
                                  <FontAwesomeIcon icon={faAngleRight} className="mx-1" />
                                  <span className="truncate max-w-xs">{scan.targetUrl || scan.url}</span>
                                </div>
                              </h4>
                              <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                scan.error 
                                  ? 'bg-gray-100 text-gray-600'
                                  : scan.isVulnerable 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                <FontAwesomeIcon 
                                  icon={scan.error ? faSearch : scan.isVulnerable ? faTimesCircle : faCheckCircle} 
                                  className="mr-1" 
                                />
                                {scan.error ? "NOT FOUND" : scan.status}
                              </div>
                            </div>
                            
                            {scan.isVulnerable && (
                              <div>
                                {scan.location && (
                                  <div className="mb-2 border-b border-gray-200 pb-2">
                                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-sm">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-cyan-500" />
                                      Vulnerable Points
                                    </h5>
                                    <p className="text-gray-600 text-sm pl-6">{decodeText(scan.location)}</p>
                                  </div>
                                )}
                                
                                {scan.prevention && scan.prevention.length > 0 && (
                                  <div className="mb-2 border-b border-gray-200 pb-2">
                                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-sm">
                                      <FontAwesomeIcon icon={faShieldVirus} className="mr-2 text-cyan-500" />
                                      Fixes
                                    </h5>
                                    <ul className="list-disc pl-8 text-gray-600 space-y-1 text-sm">
                                      {scan.prevention.map((tip, i) => (
                                        <li key={i}>{decodeText(tip)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {scan.reference && (
                                  <div>
                                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-sm">
                                      <FontAwesomeIcon icon={faBook} className="mr-2 text-cyan-500" />
                                      Learn More
                                    </h5>
                                    <a 
                                      href={scan.reference} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-cyan-500 hover:text-cyan-700 transition flex items-center pl-6 text-sm"
                                    >
                                      Documentation
                                      <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!scan.isVulnerable && !scan.error && (
                              <div className="text-gray-600 text-sm">
                                <p className="flex items-center">
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                                  No {scan.vulnerability} vulnerabilities detected
                                </p>
                              </div>
                            )}
                            
                            {scan.error && (
                              <div className="text-gray-600 text-sm">
                                <p className="flex items-center text-gray-500">
                                  <FontAwesomeIcon icon={faTimesCircle} className="text-gray-500 mr-2" />
                                  Not found
                                </p>
                              </div>
                            )}
                          </div>
                </div>
              ))}
            </div>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-md text-yellow-800">
                    No results available. The scan may have failed or found no vulnerabilities.
                  </div>
                )}
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(STEPS.CRAWL)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
                  >
                    Start Over
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep(STEPS.SELECT_URLS)}
                    className="bg-cyan-400 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg"
                  >
                    Scan Different URLs
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttaquesPage;
