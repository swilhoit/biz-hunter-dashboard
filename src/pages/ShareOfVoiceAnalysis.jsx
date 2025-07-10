import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Package, DollarSign, Hash, Search, Award, Users, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { ShareOfVoiceService } from '../services/ShareOfVoiceService';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart01 from '../charts/BarChart01';

function ShareOfVoiceAnalysis() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [availableBrands, setAvailableBrands] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [keywordLimit, setKeywordLimit] = useState(20);

  // Load available brands on mount
  useEffect(() => {
    loadAvailableBrands();
  }, []);

  const loadAvailableBrands = async () => {
    try {
      const brands = await ShareOfVoiceService.getAvailableBrands();
      setAvailableBrands(brands);
      if (brands.length > 0 && !selectedBrand) {
        setSelectedBrand(brands[0]);
      }
    } catch (err) {
      console.error('Error loading brands:', err);
      setError('Failed to load available brands');
    }
  };

  const runAnalysis = async () => {
    if (!selectedBrand) {
      setError('Please select a brand');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const data = await ShareOfVoiceService.analyzeShareOfVoiceFromRecommendedKeywords(
        selectedBrand,
        keywordLimit
      );
      setAnalysisData(data);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err.message || 'Failed to analyze share of voice');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const getSalesShareChartData = () => {
    if (!analysisData) return null;

    const labels = [analysisData.brand];
    const data = [analysisData.overallSalesShare];
    const backgroundColors = ['#8b5cf6'];

    // Add top 5 competitors
    analysisData.topCompetitors.slice(0, 5).forEach((competitor, index) => {
      labels.push(competitor.brand);
      data.push(competitor.salesShare);
      backgroundColors.push(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'][index % 5]);
    });

    // Add "Others"
    const othersShare = 100 - data.reduce((sum, val) => sum + val, 0);
    if (othersShare > 0) {
      labels.push('Others');
      data.push(othersShare);
      backgroundColors.push('#9ca3af');
    }

    return {
      labels,
      datasets: [{
        label: 'Sales Share %',
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0
      }]
    };
  };

  const getKeywordPerformanceData = () => {
    if (!analysisData) return null;

    const sortedKeywords = [...analysisData.keywords]
      .sort((a, b) => b.salesShare - a.salesShare)
      .slice(0, 10);

    return {
      labels: sortedKeywords.map(k => k.keyword.length > 20 ? k.keyword.substring(0, 20) + '...' : k.keyword),
      datasets: [
        {
          label: 'Sales Share %',
          data: sortedKeywords.map(k => k.salesShare),
          backgroundColor: '#8b5cf6',
          barPercentage: 0.4
        },
        {
          label: 'Listing Share %',
          data: sortedKeywords.map(k => k.listingShare),
          backgroundColor: '#3b82f6',
          barPercentage: 0.4
        }
      ]
    };
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                Share of Voice Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Analyze brand market share using AI-recommended keywords
              </p>
            </div>

            {/* Selection and Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Brand
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="form-select w-full"
                    disabled={loading}
                  >
                    <option value="">Choose a brand...</option>
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keyword Limit
                  </label>
                  <input
                    type="number"
                    value={keywordLimit}
                    onChange={(e) => setKeywordLimit(Math.max(1, Math.min(50, parseInt(e.target.value) || 20)))}
                    min="1"
                    max="50"
                    className="form-input w-full"
                    disabled={loading}
                  />
                </div>
                
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={runAnalysis}
                    disabled={loading || !selectedBrand}
                    className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50 mr-4"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Run Analysis
                      </>
                    )}
                  </button>
                  
                  {availableBrands.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No brands with recommended keywords found. Generate keywords first.
                    </p>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisData && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sales Share</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analysisData.overallSalesShare.toFixed(1)}%
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-violet-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Listing Share</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analysisData.overallListingShare.toFixed(1)}%
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Keywords Covered</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analysisData.keywordsCovered}/{analysisData.totalKeywords}
                        </p>
                      </div>
                      <Hash className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Position</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          #{analysisData.avgPosition}
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Sales Share Pie Chart */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Market Sales Share
                    </h3>
                    <div className="h-64">
                      <DoughnutChart data={getSalesShareChartData()} />
                    </div>
                  </div>

                  {/* Keyword Performance */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Top Keyword Performance
                    </h3>
                    <div className="h-64">
                      <BarChart01 
                        data={getKeywordPerformanceData()} 
                        width={389} 
                        height={256} 
                      />
                    </div>
                  </div>
                </div>

                {/* Top Competitors Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Top Competitors
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Brand
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Sales Share
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Listing Share
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Keyword Overlap
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            # of ASINs
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {analysisData.topCompetitors.map((competitor, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {competitor.brand}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {competitor.salesShare.toFixed(1)}%
                                </div>
                                <div 
                                  className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2"
                                  title={`${competitor.salesShare.toFixed(1)}%`}
                                >
                                  <div 
                                    className="bg-violet-500 h-2 rounded-full" 
                                    style={{ width: `${Math.min(100, competitor.salesShare)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {competitor.listingShare.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {competitor.keywordOverlap} keywords
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {competitor.uniqueASINs}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Keyword Details Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Keyword Analysis Details
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Keyword
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Search Volume
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Brand Products
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total Products
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Sales Share
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Listing Share
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {analysisData.keywords.map((keyword, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {keyword.keyword}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {keyword.searchVolume.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {keyword.brandProducts}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {keyword.totalProducts}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {keyword.salesShare.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {keyword.listingShare.toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ShareOfVoiceAnalysis;