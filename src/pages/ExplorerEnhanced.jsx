import React, { useState, useEffect, useCallback } from 'react';
import Header from '../partials/Header';
import Sidebar from '../partials/Sidebar';
import { 
  Search, TrendingUp, Package, BarChart3, Settings, Filter, Download, 
  AlertCircle, Brain, Key, Eye, FileText, Upload, Zap, Database,
  LineChart, Layers, ArrowUpDown, Globe, DollarSign
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ExplorerProvider, useExplorer } from '../contexts/ExplorerContext';
import { fetchProductDatabaseQuery, fetchDataForKeywords } from '../utils/explorer/junglescout';
import { processData, updateSummary, formatNumberWithCommas } from '../utils/explorer/dataProcessing';
import { KeywordResearch } from '../components/explorer/KeywordResearch';
import { FeatureSegmentation } from '../components/explorer/FeatureSegmentation';
import { ProductComparison } from '../components/explorer/ProductComparison';
import { AdCreativesAnalysis } from '../components/explorer/AdCreativesAnalysis';
import { MarketTrends } from '../components/explorer/MarketTrends';
import { DataImportExport } from '../components/explorer/DataImportExport';
import { ProductSearchTable } from '../components/explorer/ProductSearchTable';
import { PriceSegmentAnalysis } from '../components/explorer/PriceSegmentAnalysis';
import { ScatterPlot } from '../components/explorer/ScatterPlot';
import { PieCharts } from '../components/explorer/PieCharts';
import { TimelineChart } from '../components/explorer/TimelineChart';
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
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Enter keywords to search Amazon products (comma-separated)..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      size="sm"
                    >
                      {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Summary Statistics */}
            {summaryData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Products</CardDescription>
                    <CardTitle className="text-2xl">
                      {filteredResults.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl">
                      ${formatNumberWithCommas(summaryData.revenue)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Sales</CardDescription>
                    <CardTitle className="text-2xl">
                      {formatNumberWithCommas(summaryData.sales)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Avg Price</CardDescription>
                    <CardTitle className="text-2xl">
                      {summaryData.price}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex-wrap h-auto p-1">
                <TabsTrigger value="search" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="keywords" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Key className="w-4 h-4 mr-2" />
                  Keywords
                </TabsTrigger>
                <TabsTrigger value="segmentation" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Segmentation
                </TabsTrigger>
                <TabsTrigger value="comparison" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Layers className="w-4 h-4 mr-2" />
                  Compare
                </TabsTrigger>
                <TabsTrigger value="analysis" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="ads" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Ad Creatives
                </TabsTrigger>
                <TabsTrigger value="import-export" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Database className="w-4 h-4 mr-2" />
                  Import/Export
                </TabsTrigger>
                <TabsTrigger value="filters" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <ProductSearchTable
                  products={filteredResults}
                  selectedProducts={selectedProducts}
                  onProductSelect={handleProductSelect}
                  onDeleteProduct={handleDeleteProduct}
                  onExport={exportToCSV}
                  isLoading={isLoading}
                />
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Segment Analysis</CardTitle>
                      <CardDescription>
                        Search for products to see detailed analysis and visualizations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                      <Package className="w-12 h-12 text-gray-400" />
                    </CardContent>
                  </Card>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Search Filters</CardTitle>
                    <CardDescription>Refine your search results</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-24"
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
                        <Input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-24"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sales Range: {salesRange[0]} - {salesRange[1]}
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={salesRange[0]}
                          onChange={(e) => setSalesRange([Number(e.target.value), salesRange[1]])}
                          className="w-24"
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
                        <Input
                          type="number"
                          value={salesRange[1]}
                          onChange={(e) => setSalesRange([salesRange[0], Number(e.target.value)])}
                          className="w-24"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                        disabled
                      >
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="ca">Canada</option>
                      </select>
                    </div>

                    <div>
                      <Button
                        onClick={() => cache().clear()}
                        variant="outline"
                        className="w-full"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Clear Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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