import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Star, TrendingUp, TrendingDown, Package, Search, Filter, Download, Store, AlertCircle, CheckCircle } from 'lucide-react';
import ASINImage from '../../components/ASINImage';
import { ASINService } from '../../services/ASINService';
import { KeywordService } from '../../services/KeywordService';

function DealASINsTable({ dealId }) {
  const [asins, setAsins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('monthly_revenue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterPrimary, setFilterPrimary] = useState('all'); // 'all', 'primary', 'secondary'
  
  // Store URL lookup states
  const [storeUrl, setStoreUrl] = useState('');
  const [lookupStatus, setLookupStatus] = useState(null); // null, 'detecting', 'found', 'fetching', 'completed'
  const [foundASINs, setFoundASINs] = useState([]);
  const [lookupMessage, setLookupMessage] = useState('');
  
  // Selection and delete states
  const [selectedASINs, setSelectedASINs] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Keyword fetching states
  const [isFetchingKeywords, setIsFetchingKeywords] = useState(false);
  const [keywordFetchMessage, setKeywordFetchMessage] = useState('');
  
  // Removed image fetching states - images now load automatically

  // Load ASINs when component mounts or dealId changes
  useEffect(() => {
    if (!dealId) return;

    const loadASINs = async () => {
      try {
        setLoading(true);
        setError(null);
        const dealASINs = await ASINService.fetchDealASINs(dealId);
        setAsins(dealASINs);
      } catch (err) {
        console.error('Error loading ASINs:', err);
        setError('Failed to load ASINs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadASINs();
  }, [dealId]);

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatRank = (rank) => {
    return `#${rank.toLocaleString()}`;
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <span className="w-4 h-4"></span>;
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Poor': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCompetitionColor = (level) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedASINs = asins
    .filter(asin => {
      const matchesSearch = asin.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asin.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asin.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterPrimary === 'all' ||
                           (filterPrimary === 'primary' && asin.is_primary) ||
                           (filterPrimary === 'secondary' && !asin.is_primary);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (typeof a[sortField] === 'number') {
        return (a[sortField] - b[sortField]) * direction;
      }
      return a[sortField].localeCompare(b[sortField]) * direction;
    });

  // Calculate summary stats using the service
  const summary = ASINService.calculateSummary(asins);

  // Handle checkbox selection
  const handleSelectASIN = (asinId) => {
    setSelectedASINs(prev => {
      if (prev.includes(asinId)) {
        return prev.filter(id => id !== asinId);
      } else {
        return [...prev, asinId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedASINs.length === filteredAndSortedASINs.length) {
      setSelectedASINs([]);
    } else {
      setSelectedASINs(filteredAndSortedASINs.map(asin => asin.id));
    }
  };

  // Handle delete selected ASINs
  const handleDeleteSelected = async () => {
    if (selectedASINs.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${selectedASINs.length} ASIN${selectedASINs.length > 1 ? 's' : ''} from this deal?`
    );
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await ASINService.removeMultipleASINsFromDeal(dealId, selectedASINs);
      
      if (success) {
        // Refresh the ASIN list
        const updatedASINs = await ASINService.fetchDealASINs(dealId);
        setAsins(updatedASINs);
        setSelectedASINs([]);
      } else {
        alert('Failed to remove ASINs. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting ASINs:', error);
      alert('An error occurred while removing ASINs.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle batch keyword fetching
  const handleFetchKeywords = async () => {
    if (selectedASINs.length === 0) {
      alert('Please select ASINs to fetch keywords for');
      return;
    }
    
    if (selectedASINs.length > 10) {
      alert('You can only fetch keywords for up to 10 ASINs at a time');
      return;
    }
    
    setIsFetchingKeywords(true);
    setKeywordFetchMessage(`Fetching keywords for ${selectedASINs.length} ASINs...`);
    
    try {
      const selectedAsinObjects = asins.filter(asin => selectedASINs.includes(asin.id));
      let successCount = 0;
      let totalKeywords = 0;
      
      // Process ASINs in parallel but with a small delay to avoid rate limiting
      const promises = selectedAsinObjects.map(async (asin, index) => {
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, index * 500));
        
        try {
          const keywords = await KeywordService.fetchKeywordsForASIN(asin.asin);
          if (keywords.length > 0) {
            const saved = await KeywordService.saveKeywordsForASIN(asin.asin, keywords);
            if (saved) {
              successCount++;
              totalKeywords += keywords.length;
            }
          }
          return { success: true, asin: asin.asin, keywordCount: keywords.length };
        } catch (error) {
          console.error(`Error fetching keywords for ASIN ${asin.asin}:`, error);
          return { success: false, asin: asin.asin, error };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Check for API errors
      const apiErrors = results.filter(r => !r.success && r.error?.response?.status === 403);
      if (apiErrors.length > 0) {
        setKeywordFetchMessage(
          `JungleScout API access denied. Please check your API credentials and subscription plan.`
        );
      } else if (successCount === 0) {
        setKeywordFetchMessage(
          `Failed to fetch keywords. Please check your API configuration.`
        );
      } else {
        setKeywordFetchMessage(
          `Completed! Fetched ${totalKeywords} keywords for ${successCount} out of ${selectedASINs.length} ASINs`
        );
      }
      
      // Dispatch event to refresh keywords tab
      const event = new CustomEvent('keywords-updated', { detail: { dealId } });
      window.dispatchEvent(event);
      
      // Clear selection and message after 5 seconds
      setTimeout(() => {
        setSelectedASINs([]);
        setKeywordFetchMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('Error in batch keyword fetch:', error);
      setKeywordFetchMessage('Error fetching keywords. Please try again.');
      setTimeout(() => setKeywordFetchMessage(''), 5000);
    } finally {
      setIsFetchingKeywords(false);
    }
  };

  // Handle store URL input
  const handleStoreUrlChange = (e) => {
    const url = e.target.value;
    setStoreUrl(url);
    
    // Detect if it's a valid Amazon store URL
    if (url && ASINService.extractSellerIdFromURL(url)) {
      setLookupStatus('found');
      setLookupMessage('Store URL found, find ASINs?');
    } else {
      setLookupStatus(null);
      setLookupMessage('');
    }
  };

  // Handle finding ASINs from store URL
  const handleFindASINs = async () => {
    try {
      setLookupStatus('detecting');
      setLookupMessage('Looking up ASINs from store...');
      
      const result = await ASINService.lookupASINsFromStoreURL(storeUrl);
      
      setFoundASINs(result.asins);
      setLookupStatus('found');
      setLookupMessage(`${result.totalFound} ASINs found`);
    } catch (error) {
      console.error('Error looking up ASINs:', error);
      setLookupStatus(null);
      setLookupMessage('Failed to lookup ASINs. Please try again.');
    }
  };

  // Handle fetching ASIN details
  const handleFetchASINDetails = async () => {
    try {
      setLookupStatus('fetching');
      setLookupMessage('Fetching ASIN details from JungleScout...');
      
      // Fetch detailed data for the found ASINs
      const detailedASINs = await ASINService.fetchBulkASINData(foundASINs);
      
      // Add the ASINs to the deal
      const { success, failed } = await ASINService.addStoreASINsToDeal(
        dealId,
        detailedASINs,
        asins.length === 0 // Mark first as primary if no ASINs exist
      );
      
      setLookupStatus('completed');
      setLookupMessage(`Successfully added ${success} ASINs${failed > 0 ? `, ${failed} failed` : ''}`);
      
      // Reload ASINs
      const dealASINs = await ASINService.fetchDealASINs(dealId);
      setAsins(dealASINs);
      
      // Reset form after a delay
      setTimeout(() => {
        setStoreUrl('');
        setLookupStatus(null);
        setLookupMessage('');
        setFoundASINs([]);
      }, 3000);
    } catch (error) {
      console.error('Error fetching ASIN details:', error);
      setLookupStatus('error');
      
      // Check if it's a JungleScout API error
      if (error.response && error.response.status === 400) {
        setLookupMessage('JungleScout API error. ASINs will be imported with basic data. You can update details later.');
      } else {
        setLookupMessage('Failed to fetch ASIN details. ASINs will be imported with basic data.');
      }
      
      // Still try to proceed with basic data
      setTimeout(() => {
        setLookupStatus(null);
        setLookupMessage('');
      }, 5000);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ASINs...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error Loading ASINs
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total ASINs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalASINs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Margin</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.avgMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalInventoryValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store URL Lookup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Import Store Products</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Enter Amazon store URL..."
                value={storeUrl}
                onChange={handleStoreUrlChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            {lookupStatus === 'found' && foundASINs.length === 0 && (
              <button
                onClick={handleFindASINs}
                className="btn bg-violet-500 hover:bg-violet-600 text-white"
              >
                Find ASINs
              </button>
            )}
            
            {lookupStatus === 'found' && foundASINs.length > 0 && (
              <button
                onClick={handleFetchASINDetails}
                className="btn bg-green-500 hover:bg-green-600 text-white"
              >
                Fetch ASIN Details
              </button>
            )}
          </div>
          
          {lookupMessage && (
            <div className={`flex items-center space-x-2 text-sm ${
              lookupStatus === 'completed' ? 'text-green-600 dark:text-green-400' : 
              lookupStatus === 'detecting' || lookupStatus === 'fetching' ? 'text-blue-600 dark:text-blue-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>
              {lookupStatus === 'detecting' || lookupStatus === 'fetching' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : lookupStatus === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : lookupStatus === 'found' ? (
                <AlertCircle className="w-4 h-4" />
              ) : null}
              <span>{lookupMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ASINs, products, brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <select
            value={filterPrimary}
            onChange={(e) => setFilterPrimary(e.target.value)}
            className="form-select"
          >
            <option value="all">All ASINs</option>
            <option value="primary">Primary Only</option>
            <option value="secondary">Secondary Only</option>
          </select>
          <button className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          {selectedASINs.length > 0 && (
            <>
              <button 
                onClick={handleFetchKeywords}
                disabled={isFetchingKeywords || selectedASINs.length > 10}
                className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
              >
                {isFetchingKeywords ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Get Keywords ({selectedASINs.length})
                  </>
                )}
              </button>
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete ({selectedASINs.length})
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Keyword Fetch Message */}
      {keywordFetchMessage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className={`flex items-center space-x-2 text-sm ${
            keywordFetchMessage.includes('Completed') ? 'text-green-600 dark:text-green-400' : 
            keywordFetchMessage.includes('Error') ? 'text-red-600 dark:text-red-400' :
            'text-blue-600 dark:text-blue-400'
          }`}>
            {keywordFetchMessage.includes('Fetching') ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : keywordFetchMessage.includes('Completed') ? (
              <CheckCircle className="w-4 h-4" />
            ) : keywordFetchMessage.includes('Error') ? (
              <AlertCircle className="w-4 h-4" />
            ) : null}
            <span>{keywordFetchMessage}</span>
          </div>
        </div>
      )}
      

      {/* ASINs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={selectedASINs.length === filteredAndSortedASINs.length && filteredAndSortedASINs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center">
                    Product
                    {sortField === 'product_name' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('monthly_revenue')}
                >
                  <div className="flex items-center">
                    Revenue
                    {sortField === 'monthly_revenue' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('monthly_units')}
                >
                  <div className="flex items-center">
                    Units Sold
                    {sortField === 'monthly_units' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('rank_current')}
                >
                  <div className="flex items-center">
                    BSR Rank
                    {sortField === 'rank_current' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviews
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('profit_margin')}
                >
                  <div className="flex items-center">
                    Margin
                    {sortField === 'profit_margin' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedASINs.map((asin) => (
                <tr key={asin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 w-4">
                    <input
                      type="checkbox"
                      checked={selectedASINs.includes(asin.id)}
                      onChange={() => handleSelectASIN(asin.id)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="relative inline-flex mr-3 flex-shrink-0">
                        <ASINImage
                          className="w-16 h-16 rounded-lg object-cover"
                          src={asin.image_url}
                          asin={asin.asin}
                          alt={asin.product_name}
                          fallbackText={asin.asin.substring(0, 6)}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <Link 
                            to={`/deals/asins/${asin.asin}`}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-violet-500 dark:hover:text-violet-400 block truncate max-w-xs"
                            title={asin.product_name}
                          >
                            {asin.product_name.length > 40 ? `${asin.product_name.substring(0, 40)}...` : asin.product_name}
                          </Link>
                          {asin.is_primary && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ASIN: {asin.asin} | {asin.brand}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {asin.subcategory} | {asin.variations} variation{asin.variations > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(asin.monthly_revenue)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(asin.price)} each
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {asin.monthly_units.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatRank(asin.rank_current)}
                      </div>
                      <div className="ml-2 flex items-center">
                        {getRankChangeIcon(asin.rank_change)}
                        <span className={`text-xs ml-1 ${asin.rank_change > 0 ? 'text-red-500' : asin.rank_change < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                          {Math.abs(asin.rank_change)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {formatRank(asin.rank_average)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {asin.rating}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {asin.reviews.toLocaleString()} reviews
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      {asin.profit_margin}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getQualityColor(asin.listing_quality)}`}>
                        {asin.listing_quality}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCompetitionColor(asin.competition_level)}`}>
                        {asin.competition_level} Comp
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/deals/asins/${asin.asin}`}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                      <a
                        href={`https://amazon.com/dp/${asin.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="View on Amazon"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No results */}
      {filteredAndSortedASINs.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No ASINs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

export default DealASINsTable;