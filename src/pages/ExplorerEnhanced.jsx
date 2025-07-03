import React, { useState, useEffect, useCallback } from 'react';
import Header from '../partials/Header';
import Sidebar from '../partials/Sidebar';
import { 
  Search, TrendingUp, Package, BarChart3, Settings, Filter, Download, 
  AlertCircle, Brain, Key, Eye, FileText, Upload, Zap, Database,
  LineChart, Layers, ArrowUpDown, Globe, DollarSign
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ExplorerProvider, useExplorer } from '../contexts/ExplorerContext';
import { fetchProductDatabaseQuery, fetchDataForKeywords } from '../utils/explorer/junglescout';
import { processData, updateSummary, formatNumberWithCommas } from '../utils/explorer/dataProcessing';
import { ScatterPlot } from '../components/explorer/ScatterPlot';
import { PieCharts } from '../components/explorer/PieCharts';
import { TimelineChart } from '../components/explorer/TimelineChart';
import { PriceSegmentAnalysis } from '../components/explorer/PriceSegmentAnalysis';
import { KeywordResearch } from '../components/explorer/KeywordResearch';
import { FeatureSegmentation } from '../components/explorer/FeatureSegmentation';
import { ProductComparison } from '../components/explorer/ProductComparison';
import { AdCreativesAnalysis } from '../components/explorer/AdCreativesAnalysis';
import { MarketTrends } from '../components/explorer/MarketTrends';
import { DataImportExport } from '../components/explorer/DataImportExport';
import Papa from 'papaparse';

function ExplorerContent() {
  const { settings, isLoading, setIsLoading, error, setError } = useExplorer();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [salesRange, setSalesRange] = useState([0, 10000]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [keywordData, setKeywordData] = useState(null);

  // Smart caching system
  const cache = useCallback(() => {
    const CACHE_PREFIX = 'explorer_cache_';
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

    const get = (key) => {
      try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;
        
        const { data, timestamp } = JSON.parse(item);
        if (Date.now() - timestamp > CACHE_DURATION) {
          localStorage.removeItem(CACHE_PREFIX + key);
          return null;
        }
        
        return data;
      } catch (e) {
        return null;
      }
    };

    const set = (key, data) => {
      try {
        const item = JSON.stringify({ data, timestamp: Date.now() });
        
        // Check cache size
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(CACHE_PREFIX)) {
            totalSize += localStorage.getItem(k).length;
          }
        }
        
        // Clear old cache if size exceeds limit
        if (totalSize + item.length > MAX_CACHE_SIZE) {
          const cacheKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(CACHE_PREFIX)) {
              cacheKeys.push(k);
            }
          }
          
          // Remove oldest items
          cacheKeys.sort().slice(0, Math.floor(cacheKeys.length / 2)).forEach(k => {
            localStorage.removeItem(k);
          });
        }
        
        localStorage.setItem(CACHE_PREFIX + key, item);
      } catch (e) {
        console.warn('Cache storage failed:', e);
      }
    };

    const clear = () => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    };

    return { get, set, clear };
  }, []);

  // Handle product search with caching
  const handleSearch = useCallback(async () => {
    if (!keywords.trim()) {
      setError('Please enter keywords to search');
      return;
    }
    
    const cacheKey = `search_${keywords}_${settings.marketplace}`;
    const cachedData = cache().get(cacheKey);
    
    if (cachedData) {
      setSearchResults(cachedData.processedData);
      setSummaryData(cachedData.summary);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const keywordList = keywords.split(',').map(k => k.trim());
      const searchParams = {
        marketplace: settings.marketplace,
        includeKeywords: keywordList,
        pageSize: 50
      };
      
      const response = await fetchProductDatabaseQuery(searchParams);
      
      if (response && response.data) {
        const processedData = processData(response.data);
        const summary = updateSummary(processedData);
        
        setSearchResults(processedData);
        setSummaryData(summary);
        
        // Cache the results
        cache().set(cacheKey, { processedData, summary });
      } else {
        setError('No results found for your search');
      }
    } catch (err) {
      console.error('Search error:', err);
      if (err.message === 'JungleScout API key not configured') {
        setError('JungleScout API credentials not configured. Please add VITE_JUNGLE_SCOUT_API_KEY and VITE_JUNGLE_SCOUT_KEY_NAME to your environment variables.');
      } else {
        setError('Failed to search products. Please check your API credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [keywords, settings.marketplace, setIsLoading, setError, cache]);

  // Handle CSV file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const processedData = processData(results.data);
        const summary = updateSummary(processedData);
        
        setSearchResults(processedData);
        setSummaryData(summary);
        setActiveTab('search');
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      }
    });
  }, [setError]);

  // Handle product selection
  const handleProductSelect = useCallback((asin) => {
    setSelectedProducts(prev => {
      if (prev.includes(asin)) {
        return prev.filter(a => a !== asin);
      }
      return [...prev, asin];
    });
  }, []);

  // Filter products based on ranges
  const filteredResults = searchResults.filter(product => {
    if (product.asin === 'Summary') return false;
    return product.price >= priceRange[0] && 
           product.price <= priceRange[1] &&
           product.sales >= salesRange[0] && 
           product.sales <= salesRange[1];
  });

  // Handle product deletion
  const handleDeleteProduct = useCallback((asin) => {
    setSearchResults(prev => {
      const updatedResults = prev.filter(item => item.asin !== asin);
      if (updatedResults.length > 0) {
        const summary = updateSummary(updatedResults);
        setSummaryData(summary);
        return updatedResults;
      }
      return [];
    });
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Export filtered results to CSV
  const exportToCSV = useCallback(() => {
    const csv = Papa.unparse(filteredResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `explorer-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [filteredResults]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Market Explorer Pro</h1>
              <p className="text-gray-600 dark:text-gray-400">Advanced Amazon FBA market research and analysis tools</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter keywords to search Amazon products (comma-separated)..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-violet-500 text-white rounded-md hover:bg-violet-600 disabled:opacity-50"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Summary Statistics */}
            {summaryData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {filteredResults.length}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    ${formatNumberWithCommas(summaryData.revenue)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {formatNumberWithCommas(summaryData.sales)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Price</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {summaryData.price}
                  </p>
                </div>
              </div>
            )}

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 flex-wrap">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="keywords" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Keywords
                </TabsTrigger>
                <TabsTrigger value="segmentation" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Segmentation
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Compare
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="ads" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ad Creatives
                </TabsTrigger>
                <TabsTrigger value="import-export" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Import/Export
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search">
                {isLoading ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Search Results</h3>
                      <button
                        onClick={exportToCSV}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Select
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Sales
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Revenue
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Reviews
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Rating
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Category
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredResults.map((product) => (
                            <tr key={product.asin} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.includes(product.asin)}
                                  onChange={() => handleProductSelect(product.asin)}
                                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <img 
                                    src={product.imageUrl || 'https://via.placeholder.com/50'} 
                                    alt={product.title}
                                    className="w-12 h-12 rounded object-cover mr-3"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/50';
                                    }}
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                      {product.title}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      ASIN: <a 
                                        href={product.amazonUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-violet-600 hover:text-violet-800"
                                      >
                                        {product.asin}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                ${product.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                {formatNumberWithCommas(product.sales)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                ${formatNumberWithCommas(product.revenue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                {formatNumberWithCommas(product.reviews)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                ⭐ {product.rating.toFixed(1)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {product.category || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchResults.length > 0 
                        ? 'No products match your current filters' 
                        : 'Enter keywords above to search for Amazon products'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="keywords">
                <KeywordResearch 
                  initialKeywords={keywords}
                  onKeywordSelect={(keyword) => setKeywords(keyword)}
                  products={filteredResults}
                />
              </TabsContent>

              <TabsContent value="segmentation">
                <FeatureSegmentation 
                  products={filteredResults}
                  onSegmentsUpdate={setSegments}
                  segments={segments}
                />
              </TabsContent>

              <TabsContent value="comparison">
                <ProductComparison 
                  products={filteredResults}
                  selectedProducts={selectedProducts}
                  onProductSelect={handleProductSelect}
                />
              </TabsContent>

              <TabsContent value="analysis">
                {filteredResults.length > 0 ? (
                  <div className="space-y-6">
                    <PriceSegmentAnalysis
                      data={filteredResults}
                      summaryData={summaryData}
                      onDeleteProduct={handleDeleteProduct}
                      onProductSelect={handleProductSelect}
                      selectedProducts={selectedProducts}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ScatterPlot data={filteredResults} />
                      <TimelineChart data={filteredResults} />
                    </div>
                    <PieCharts data={filteredResults} />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Price Segment Analysis</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Search for products to see detailed analysis and visualizations
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trends">
                <MarketTrends 
                  products={filteredResults}
                  keywords={keywords}
                  keywordData={keywordData}
                />
              </TabsContent>

              <TabsContent value="ads">
                <AdCreativesAnalysis 
                  keywords={keywords}
                  products={filteredResults}
                />
              </TabsContent>

              <TabsContent value="import-export">
                <DataImportExport 
                  onDataImport={(data) => {
                    const processedData = processData(data);
                    const summary = updateSummary(processedData);
                    setSearchResults(processedData);
                    setSummaryData(summary);
                    setActiveTab('search');
                  }}
                  exportData={filteredResults}
                  segments={segments}
                />
              </TabsContent>

              <TabsContent value="filters">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Search Filters</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                          placeholder="Min"
                        />
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sales Range: {salesRange[0]} - {salesRange[1]}
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={salesRange[0]}
                          onChange={(e) => setSalesRange([Number(e.target.value), salesRange[1]])}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                          placeholder="Min"
                        />
                        <input
                          type="range"
                          min="0"
                          max="50000"
                          value={salesRange[1]}
                          onChange={(e) => setSalesRange([salesRange[0], Number(e.target.value)])}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={salesRange[1]}
                          onChange={(e) => setSalesRange([salesRange[0], Number(e.target.value)])}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                          placeholder="Max"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Marketplace
                      </label>
                      <select 
                        value={settings.marketplace}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                        disabled
                      >
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="ca">Canada</option>
                      </select>
                    </div>

                    <div>
                      <button
                        onClick={() => cache().clear()}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function ExplorerEnhanced() {
  return (
    <ExplorerProvider>
      <ExplorerContent />
    </ExplorerProvider>
  );
}

export default ExplorerEnhanced;