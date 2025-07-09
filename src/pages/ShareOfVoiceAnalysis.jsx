import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import ShareOfVoiceReport from '../components/analytics/ShareOfVoiceReport';
import { Search, BarChart3, Building2, ArrowLeft } from 'lucide-react';

function ShareOfVoiceAnalysis() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [inputType, setInputType] = useState('brand'); // 'brand' or 'store'
  const [category, setCategory] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [storeName, setStoreName] = useState(null);

  const handleAnalyze = () => {
    if (inputType === 'brand' && brandName.trim()) {
      setShowReport(true);
    } else if (inputType === 'store' && storeUrl.trim()) {
      setShowReport(true);
    }
  };

  const handleReportComplete = (report, name) => {
    setReportData(report);
    if (name) {
      setStoreName(name);
    }
  };

  const handleExportReport = () => {
    if (!reportData) return;

    // Create CSV content
    const headers = ['Brand', 'Revenue', 'Market Share %', 'Products', 'Avg Rating', 'Keyword Share %'];
    const rows = reportData.topBrands.map(brand => [
      brand.brand,
      brand.totalRevenue,
      brand.marketShare.toFixed(2),
      brand.productCount,
      brand.avgRating.toFixed(2),
      brand.keywordShare.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share-of-voice-${brandName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Share of Voice Analysis
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Analyze brand dominance across categories and keywords
              </p>
            </div>

            {/* Search Form */}
            {!showReport && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Brand Analysis Setup
                </h2>
                
                <div className="space-y-4">
                  {/* Input Type Toggle */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Input Type</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="brand"
                          checked={inputType === 'brand'}
                          onChange={(e) => setInputType(e.target.value)}
                          className="mr-2"
                        />
                        <span>Brand Name</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="store"
                          checked={inputType === 'store'}
                          onChange={(e) => setInputType(e.target.value)}
                          className="mr-2"
                        />
                        <span>Store URL</span>
                      </label>
                    </div>
                  </div>

                  {/* Brand Name Input */}
                  {inputType === 'brand' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Brand Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g., Anker, AmazonBasics"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the exact brand name as it appears on Amazon
                      </p>
                    </div>
                  )}

                  {/* Store URL Input */}
                  {inputType === 'store' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Amazon Store URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={storeUrl}
                        onChange={(e) => setStoreUrl(e.target.value)}
                        placeholder="e.g., https://www.amazon.com/stores/page/12345..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the Amazon store URL to analyze all products from that seller
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category (Optional)
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Electronics, Home & Kitchen"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-detect from brand's products
                    </p>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={inputType === 'brand' ? !brandName.trim() : !storeUrl.trim()}
                    className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      (inputType === 'brand' ? brandName.trim() : storeUrl.trim())
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analyze Share of Voice
                  </button>
                </div>
              </div>
            )}

            {/* Example Brands */}
            {!showReport && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Brands to Analyze</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Anker', 'AmazonBasics', 'RENPHO', 'Utopia Bedding', 'Simple Modern', 'Carhartt', 'YETI', 'Instant Pot'].map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setBrandName(brand)}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <Building2 className="h-4 w-4 inline-block mr-2" />
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Report Display */}
            {showReport && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setShowReport(false);
                        setReportData(null);
                      }}
                      className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-semibold">
                      Share of Voice Report: {inputType === 'brand' ? brandName : (storeName || 'Store')}
                      {category && <span className="text-gray-500 text-base ml-2">in {category}</span>}
                    </h2>
                  </div>
                  
                  {reportData && (
                    <button
                      onClick={handleExportReport}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Export Report
                    </button>
                  )}
                </div>

                <ShareOfVoiceReport
                  brandName={inputType === 'brand' ? brandName : undefined}
                  storeUrl={inputType === 'store' ? storeUrl : undefined}
                  category={category || undefined}
                  onComplete={handleReportComplete}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ShareOfVoiceAnalysis;