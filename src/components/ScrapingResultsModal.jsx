import React from 'react';
import { X, CheckCircle, AlertCircle, Clock, Globe, Database, Zap, TrendingUp } from 'lucide-react';

const ScrapingResultsModal = ({ isOpen, onClose, results }) => {
  if (!isOpen || !results) return null;

  const {
    totalFound = 0,
    totalSaved = 0,
    duplicatesSkipped = 0,
    method = 'traditional',
    siteBreakdown = {},
    executionTime = 0,
    logs = [],
    errors = []
  } = results;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
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
                    Scraping Results - {method === 'scrapegraph' ? 'AI-Powered' : 'Traditional'}
                  </h3>
                  <p className="text-violet-100 text-sm">
                    Completed in {formatTime(executionTime)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {totalFound}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Total Found
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <Database className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {totalSaved}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      New Listings
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                      {duplicatesSkipped}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Duplicates Skipped
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {formatTime(executionTime)}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Execution Time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Breakdown */}
            {Object.keys(siteBreakdown).length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Results by Source
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(siteBreakdown).map(([site, data]) => (
                    <div key={site} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {site}
                        </h5>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {data.found || 0} found
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          {data.saved || 0} new
                        </span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {data.duplicates || 0} duplicates
                        </span>
                      </div>
                      {data.executionTime && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Completed in {formatTime(data.executionTime)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Rate */}
            {totalFound > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Metrics
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Success Rate
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {Math.round((totalSaved / totalFound) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(totalSaved / totalFound) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {totalSaved} new listings out of {totalFound} total found
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Logs */}
            {logs.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Detailed Logs
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">
                          [{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]
                        </span>
                        <span className={`${
                          log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                          log.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          log.level === 'success' ? 'text-green-600 dark:text-green-400' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Errors ({errors.length})
                </h4>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-red-800 dark:text-red-200 font-medium">
                          {error.source || 'Unknown Source'}
                        </p>
                        <p className="text-red-600 dark:text-red-400 ml-4">
                          {error.message || error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={onClose}
                className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Close
              </button>
              {totalSaved > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    window.location.reload(); // Refresh to show new listings
                  }}
                  className="btn bg-violet-600 text-white hover:bg-violet-700"
                >
                  View New Listings
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrapingResultsModal;