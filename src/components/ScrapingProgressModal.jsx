import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Clock, Globe, Database, Zap, TrendingUp, Loader2, AlertTriangle, Activity, Copy, Check } from 'lucide-react';

const ScrapingProgressModal = ({ isOpen, onClose, method = 'traditional', onComplete, selectedSites, onSitesChange }) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('Initializing...');
  const [logs, setLogs] = useState([]);
  const [siteStatuses, setSiteStatuses] = useState({});
  const [totalSites, setTotalSites] = useState(0);
  const [completedSites, setCompletedSites] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalResults, setFinalResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showSiteSelection, setShowSiteSelection] = useState(true);
  const [localSelectedSites, setLocalSelectedSites] = useState(selectedSites || ['quietlight', 'bizbuysell']);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logContainerRef = useRef(null);
  const eventSourceRef = useRef(null);
  
  // Available sites configuration
  const availableSites = [
    { id: 'quietlight', name: 'QuietLight', description: 'Premium FBA businesses', default: true },
    { id: 'bizbuysell', name: 'BizBuySell', description: 'Large marketplace', default: true },
    { id: 'empireflippers', name: 'Empire Flippers', description: 'Vetted online businesses', default: false },
    { id: 'flippa', name: 'Flippa', description: 'Digital assets marketplace', default: false }
  ];

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (start, end = currentTime) => {
    if (!start) return '00:00';
    const duration = Math.floor((end - start) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addLog = (level, message, site = null) => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
      site
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateSiteStatus = (site, status, data = {}) => {
    setSiteStatuses(prev => ({
      ...prev,
      [site]: {
        ...prev[site],
        status,
        ...data
      }
    }));
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!scraping) {
        setStartTime(null);
        setProgress(0);
        setCurrentStage('Select sites to scrape...');
        setLogs([]);
        setSiteStatuses({});
        setCompletedSites(0);
        setIsComplete(false);
        setFinalResults(null);
        setErrors([]);
        setShowSiteSelection(true);
        setLocalSelectedSites(selectedSites || ['quietlight', 'bizbuysell']);
      }
    }
  }, [isOpen, scraping, selectedSites]);

  // Cleanup on close
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleStartScraping = () => {
    if (localSelectedSites.length === 0) {
      addLog('error', 'Please select at least one site to scrape');
      return;
    }
    
    setShowSiteSelection(false);
    setScraping(true);
    setIsComplete(false);
    setLogs([]);
    setErrors([]);
    setCompletedSites(0);
    setStartTime(Date.now());
    setCurrentTime(Date.now());
    setCurrentStage('Initializing scraper...');
    
    if (onSitesChange) {
      onSitesChange(localSelectedSites);
    }
    
    setTotalSites(localSelectedSites.length);
    const initialSiteStatuses = localSelectedSites.reduce((acc, site) => {
      acc[site] = { status: 'running', found: 0, saved: 0, errors: 0 };
      return acc;
    }, {});
    setSiteStatuses(initialSiteStatuses);
    
    addLog('info', `Starting ${method === 'scrapegraph' ? 'AI-powered' : 'traditional'} scraping...`);
    addLog('info', `Selected sites: ${localSelectedSites.join(', ')}`);
    
    startScraping(localSelectedSites);
  };
  
  const toggleSite = (siteId) => {
    setLocalSelectedSites(prev => {
      if (prev.includes(siteId)) {
        return prev.filter(id => id !== siteId);
      } else {
        return [...prev, siteId];
      }
    });
  };
  
  const startScraping = (sites) => {
    addLog('info', '🚀 Connecting to real-time log stream...');

    const siteParams = sites.join(',');
    
    // Use environment variable for API URL, fallback to current origin in production
    const apiUrl = import.meta.env.VITE_SCRAPING_API_URL || 
                   (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    const eventSourceUrl = `${apiUrl}/api/scrape/stream?selectedSites=${siteParams}`;
    
    console.log('🔌 [SSE] Connecting to:', eventSourceUrl);
    
    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onopen = () => {
      addLog('success', '✅ Log stream connected. Scraping has started...');
      setCurrentStage('Scraping sites...');
      addLog('warning', '⏳ Scraping can take up to 2 minutes per site...');
    };

    eventSource.onmessage = (event) => {
      const log = JSON.parse(event.data);
      const source = log.data?.source;

      addLog(log.level.toLowerCase(), log.message, source || null);

      switch (log.level) {
        case 'COMPLETE':
          addLog('success', '🎉 Scraping process complete on server.');
          applyFinalResults(log.data);
          eventSource.close();
          break;

        case 'SITE_COMPLETED':
          if (source) {
            updateSiteStatus(source, 'completed', {
              found: log.data.listingsFound,
              saved: log.data.listingsSaved,
              errors: siteStatuses[source]?.errors || 0,
            });
            setCompletedSites(prev => prev + 1);
          }
          break;

        case 'SCRAPING_ERROR':
          if (source) {
            const newError = { source, message: log.message, timestamp: new Date().toISOString() };
            setErrors(prev => [...prev, newError]);
            updateSiteStatus(source, 'error', {
              errors: (siteStatuses[source]?.errors || 0) + 1,
            });
          }
          break;

        case 'LISTING_FOUND':
          if (source) {
            updateSiteStatus(source, 'running', {
              found: (siteStatuses[source]?.found || 0) + 1,
            });
          }
          break;
        
        default:
          break;
      }
    };

    eventSource.onerror = (err) => {
      addLog('error', '❌ Log stream error. The connection may have been closed.');
      console.error("EventSource failed:", err);
      eventSource.close();
      setIsComplete(true);
      setScraping(false);
      setCurrentStage('Scraping failed');
    };
    
    eventSourceRef.current = eventSource;
  };

  const applyFinalResults = (result) => {
    setProgress(100);
    setCurrentStage('Scraping completed');
    setIsComplete(true);
    setScraping(false);
    setFinalResults(result);
    
    if (result.logs && result.logs.length > 0) {
      result.logs.forEach(log => {
        if (log.level === 'LISTING_FOUND') {
          addLog('success', `Found: "${log.data.title}" from ${log.data.source}`);
        } else if (log.level === 'SCRAPING_ERROR') {
          addLog('error', `${log.data.source}: ${log.data.error}`);
        } else if (log.level === 'INFO') {
          addLog('info', log.message);
        } else if (log.level === 'ERROR') {
          addLog('error', log.message);
        } else if (log.level === 'SUCCESS') {
          addLog('success', log.message);
        } else {
          addLog(log.level.toLowerCase(), log.message);
        }
      });
    }
    
    if (result.siteBreakdown) {
      Object.entries(result.siteBreakdown).forEach(([site, data]) => {
        updateSiteStatus(site, 'completed', {
          found: data.found || 0,
          saved: data.saved || 0,
          errors: data.errors || 0
        });
      });
    }
    
    const totalFound = result.totalFound || 0;
    const totalSaved = result.totalSaved || 0;
    const duplicatesSkipped = result.duplicatesSkipped || 0;
    
    addLog('success', `Scraping completed: ${totalSaved} new listings saved, ${totalFound} total found, ${duplicatesSkipped} duplicates skipped`);
    
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(error => {
        addLog('error', `${error.source || 'Error'}: ${error.message}`);
        setErrors(prev => [...prev, error]);
      });
    }
  };

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (isComplete && finalResults && onComplete) {
      onComplete(finalResults);
    }
    
    setScraping(false);
    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  const copyLogsToClipboard = async () => {
    const logText = logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const site = log.site ? `[${log.site}] ` : '';
      return `${timestamp} ${site}${log.message}`;
    }).join('\n');
    
    const summaryText = `
=== SCRAPING SUMMARY ===
Method: ${method === 'scrapegraph' ? 'AI-Powered' : 'Traditional'}
Duration: ${formatDuration(startTime)}
Sites: ${localSelectedSites.join(', ')}
${isComplete && finalResults ? `
Results:
- Total Found: ${finalResults.totalFound || 0}
- Total Saved: ${finalResults.totalSaved || 0}
- Duplicates Skipped: ${finalResults.duplicatesSkipped || 0}
` : 'Status: In Progress'}
=== ACTIVITY LOG ===
${logText}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
      addLog('error', 'Failed to copy logs to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {method === 'scrapegraph' ? (
                  <Zap className="w-6 h-6 text-white mr-3" />
                ) : (
                  <Database className="w-6 h-6 text-white mr-3" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Scraping Progress - {method === 'scrapegraph' ? 'AI-Powered' : 'Traditional'}
                  </h3>
                  <p className="text-violet-100 text-sm">
                    {startTime && formatDuration(startTime)} elapsed • {completedSites}/{totalSites} sites completed
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={scraping && !isComplete}
                className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {showSiteSelection ? (
              // Site Selection UI
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Select Sites to Scrape
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose which marketplaces to search for Amazon FBA businesses
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {availableSites.map(site => (
                    <div
                      key={site.id}
                      onClick={() => toggleSite(site.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${localSelectedSites.includes(site.id)
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <div className="flex items-start">
                        <div className={`
                          w-5 h-5 rounded border-2 mr-3 mt-0.5 flex-shrink-0
                          ${localSelectedSites.includes(site.id)
                            ? 'bg-violet-600 border-violet-600'
                            : 'border-gray-400 dark:border-gray-500'
                          }
                        `}>
                          {localSelectedSites.includes(site.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {site.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {site.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {localSelectedSites.length === 0 && 'Select at least one site to continue'}
                    {localSelectedSites.length === 1 && `1 site selected`}
                    {localSelectedSites.length > 1 && `${localSelectedSites.length} sites selected`}
                  </div>
                  <button
                    onClick={handleStartScraping}
                    disabled={localSelectedSites.length === 0}
                    className="btn bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Scraping
                  </button>
                </div>
              </div>
            ) : (
              // Progress UI
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Progress and Sites */}
              <div className="lg:col-span-1 space-y-4">
                {/* Overall Progress */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overall Progress
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {totalSites > 0 ? Math.round((completedSites / totalSites) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                    <div 
                      className="bg-violet-600 dark:bg-violet-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalSites > 0 ? (completedSites / totalSites) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {isComplete ? 'Completed' : (scraping ? currentStage : 'Ready to start')}
                  </p>
                </div>

                {/* Site Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Site Status
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(siteStatuses).map(([site, status]) => (
                      <div key={site} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(status.status)}
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {site}
                          </span>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {status.status === 'completed' && (
                            <span>{status.saved || 0} saved</span>
                          )}
                          {status.status === 'running' && status.found > 0 && (
                            <span>{status.found} found</span>
                          )}
                          {status.status === 'error' && (
                            <span className="text-red-500">{status.errors || 0} errors</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                {isComplete && finalResults && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                      Final Results
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Found:</span>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          {finalResults.totalFound || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Saved:</span>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          {finalResults.totalSaved || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Duplicates:</span>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          {finalResults.duplicatesSkipped || 0}
                        </span>
                      </div>
                      {errors.length > 0 && (
                         <div className="flex justify-between">
                           <span className="text-red-700 dark:text-red-300">Errors:</span>
                           <span className="font-medium text-red-800 dark:text-red-200">
                             {errors.length}
                           </span>
                         </div>
                       )}
                    </div>
                  </div>
                )}
                 {/* Errors */}
                 {errors.length > 0 && !isComplete && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Encountered Errors
                    </h4>
                    <div className="space-y-2 text-xs h-24 overflow-y-auto">
                      {errors.map((error, index) => (
                        <div key={index} className="text-red-700 dark:text-red-300">
                          <strong>[{error.source}]</strong>: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Live Logs */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Live Activity Log ({logs.length})
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={copyLogsToClipboard}
                        className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        title="Copy logs to clipboard"
                      >
                        {copiedLogs ? (
                          <>
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                            <span className="text-green-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        onClick={() => setLogs([])}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 h-96 overflow-y-auto bg-gray-900 rounded-lg p-4 font-mono text-xs" ref={logContainerRef}>
                    {logs.map((log) => (
                      <div key={log.id} className={`flex items-start ${getLogLevelColor(log.level)}`}>
                        <span className="w-20 shrink-0 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <p className="flex-1 whitespace-pre-wrap break-all">
                          {log.site && (
                            <span className="text-blue-400 mr-2 flex-shrink-0">
                              [{log.site}]
                            </span>
                          )}
                          {log.message}
                        </p>
                      </div>
                    ))}
                     {logs.length === 0 && !scraping && (
                       <div className="text-center text-gray-500 pt-16">
                         <p>Logs will appear here once scraping starts.</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Footer Actions - only show when not in site selection */}
            {!showSiteSelection && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              {!isComplete ? (
                <button
                  onClick={handleClose}
                  disabled={scraping}
                  className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50"
                >
                  {scraping ? 'Running...' : 'Cancel'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleClose}
                    className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    Close
                  </button>
                  {finalResults && finalResults.totalSaved > 0 && (
                    <button
                      onClick={() => {
                        handleClose();
                        window.location.reload();
                      }}
                      className="btn bg-violet-600 text-white hover:bg-violet-700"
                    >
                      View New Listings
                    </button>
                  )}
                </>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrapingProgressModal; 