import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { Globe, Search, TrendingUp, Link, Users, BarChart3, Eye, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import LineChart01 from '../charts/LineChart01';
import BarChart03 from '../charts/BarChart03';
import { tailwindConfig } from '../utils/Utils';

interface SEOMetrics {
  domain_authority: number;
  organic_traffic: number;
  keywords_count: number;
  backlinks_count: number;
  visibility_score: number;
}

interface Keyword {
  keyword: string;
  position: number;
  search_volume: number;
  difficulty: number;
  trend: 'up' | 'down' | 'stable';
  url: string;
}

interface TopPage {
  url: string;
  traffic: number;
  bounce_rate: number;
  avg_time_on_page: string;
  keywords_count: number;
}

interface SEOData {
  website: string;
  metrics: SEOMetrics;
  keywords: Keyword[];
  topPages: TopPage[];
  trafficData: {
    labels: string[];
    organic: number[];
    paid: number[];
  };
  lastUpdated: string;
}

function SEODashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch SEO data from DataForSEO API
  const fetchSEOData = async (domain: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call your backend API that integrates with DataForSEO
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/seo/domain-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SEO data');
      }

      const data = await response.json();
      
      // Transform the data to match our interface
      const transformedData: SEOData = {
        website: domain,
        metrics: {
          domain_authority: data.domain_authority || 0,
          organic_traffic: data.organic_traffic || 0,
          keywords_count: data.keywords_count || 0,
          backlinks_count: data.backlinks_count || 0,
          visibility_score: data.visibility_score || 0,
        },
        keywords: data.keywords || [],
        topPages: data.top_pages || [],
        trafficData: data.traffic_data || {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          organic: [0, 0, 0, 0, 0, 0],
          paid: [0, 0, 0, 0, 0, 0],
        },
        lastUpdated: new Date().toISOString(),
      };

      setSeoData(transformedData);
    } catch (err) {
      console.error('Error fetching SEO data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SEO data');
      
      // Set mock data for development
      setSeoData({
        website: domain,
        metrics: {
          domain_authority: 42,
          organic_traffic: 45200,
          keywords_count: 1234,
          backlinks_count: 3456,
          visibility_score: 68,
        },
        keywords: [
          { keyword: 'amazon fba business', position: 3, search_volume: 12100, difficulty: 45, trend: 'up', url: '/blog/fba-guide' },
          { keyword: 'buy amazon business', position: 5, search_volume: 8900, difficulty: 38, trend: 'up', url: '/marketplace' },
          { keyword: 'fba acquisition', position: 8, search_volume: 22300, difficulty: 62, trend: 'stable', url: '/how-it-works' },
          { keyword: 'amazon seller tools', position: 12, search_volume: 5600, difficulty: 35, trend: 'up', url: '/tools' },
          { keyword: 'ecommerce valuation', position: 15, search_volume: 7800, difficulty: 41, trend: 'down', url: '/valuation' },
        ],
        topPages: [
          { url: '/marketplace', traffic: 8500, bounce_rate: 32, avg_time_on_page: '3:45', keywords_count: 45 },
          { url: '/blog/fba-guide', traffic: 6200, bounce_rate: 28, avg_time_on_page: '4:12', keywords_count: 32 },
          { url: '/valuation-tool', traffic: 5800, bounce_rate: 35, avg_time_on_page: '2:56', keywords_count: 28 },
          { url: '/about', traffic: 4500, bounce_rate: 45, avg_time_on_page: '2:15', keywords_count: 15 },
          { url: '/contact', traffic: 3200, bounce_rate: 25, avg_time_on_page: '5:23', keywords_count: 8 },
        ],
        trafficData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          organic: [32000, 35000, 38000, 42000, 45000, 45200],
          paid: [8000, 8500, 9000, 9500, 10000, 10500],
        },
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle website submission
  const handleWebsiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWebsite.trim()) {
      fetchSEOData(selectedWebsite.trim());
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (seoData?.website) {
      setRefreshing(true);
      fetchSEOData(seoData.website);
    }
  };

  // Initial load with default website
  useEffect(() => {
    // You can set a default website here or wait for user input
    const defaultWebsite = 'amazon.com';
    setSelectedWebsite(defaultWebsite);
    fetchSEOData(defaultWebsite);
  }, []);

  const seoMetrics = seoData ? [
    {
      title: 'Domain Authority',
      value: `${seoData.metrics.domain_authority}/100`,
      change: '+3',
      icon: Globe,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Organic Traffic',
      value: seoData.metrics.organic_traffic > 1000 
        ? `${(seoData.metrics.organic_traffic / 1000).toFixed(1)}K` 
        : seoData.metrics.organic_traffic.toString(),
      change: '+12%',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Keywords Ranking',
      value: seoData.metrics.keywords_count.toLocaleString(),
      change: '+89',
      icon: Search,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Backlinks',
      value: seoData.metrics.backlinks_count.toLocaleString(),
      change: '+245',
      icon: Link,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ] : [];

  return (
    <div className="flex h-[100dvh] overflow-hidden">
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
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">SEO Dashboard</h1>
              
              {/* Website URL Input */}
              <form onSubmit={handleWebsiteSubmit} className="mt-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={selectedWebsite}
                      onChange={(e) => setSelectedWebsite(e.target.value)}
                      placeholder="Enter website domain (e.g., example.com)"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !selectedWebsite.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Analyze
                      </>
                    )}
                  </button>
                  {seoData && (
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-50"
                      title="Refresh data"
                    >
                      <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </form>

              {/* Current Website Display */}
              {seoData && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Showing data for:</span>
                  <a 
                    href={`https://${seoData.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    {seoData.website}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <span className="text-xs">
                    Last updated: {new Date(seoData.lastUpdated).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {loading && !seoData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Fetching SEO data...</p>
                </div>
              </div>
            ) : seoData ? (
              <div className="space-y-6">
                {/* SEO Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {seoMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                            <Icon className={`w-6 h-6 ${metric.color}`} />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                            <p className={`text-xs ${metric.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {metric.change} this month
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Traffic Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Traffic Overview</h3>
                  <LineChart01
                    data={{
                      labels: seoData.trafficData.labels,
                      datasets: [
                        {
                          label: 'Organic Traffic',
                          data: seoData.trafficData.organic,
                          borderColor: tailwindConfig().theme.colors.blue[500],
                          backgroundColor: tailwindConfig().theme.colors.blue[500] + '20',
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                        },
                        {
                          label: 'Paid Traffic',
                          data: seoData.trafficData.paid,
                          borderColor: tailwindConfig().theme.colors.purple[500],
                          backgroundColor: tailwindConfig().theme.colors.purple[500] + '20',
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    width={595}
                    height={248}
                  />
                </div>

                {/* Top Keywords & Pages */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Keywords */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Keywords</h3>
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="pb-3">Keyword</th>
                            <th className="pb-3">Position</th>
                            <th className="pb-3">Volume</th>
                            <th className="pb-3">KD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {seoData.keywords.map((kw, index) => (
                            <tr key={index}>
                              <td className="py-3">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-900 dark:text-gray-100">{kw.keyword}</span>
                                  {kw.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500 ml-2" />}
                                  {kw.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 ml-2 transform rotate-180" />}
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`text-sm font-medium ${kw.position <= 10 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                  #{kw.position}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                                {kw.search_volume.toLocaleString()}
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  kw.difficulty < 40 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  kw.difficulty < 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {kw.difficulty}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Pages */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Pages</h3>
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="pb-3">Page</th>
                            <th className="pb-3">Traffic</th>
                            <th className="pb-3">Bounce</th>
                            <th className="pb-3">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {seoData.topPages.map((page, index) => (
                            <tr key={index}>
                              <td className="py-3">
                                <span className="text-sm text-gray-900 dark:text-gray-100 truncate block max-w-xs">
                                  {page.url}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                                {page.traffic.toLocaleString()}
                              </td>
                              <td className="py-3">
                                <span className={`text-sm ${page.bounce_rate < 35 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {page.bounce_rate}%
                                </span>
                              </td>
                              <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                                {page.avg_time_on_page}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Visibility Score */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Visibility Score</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {seoData.metrics.visibility_score}/100
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Overall SEO visibility score
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Competitive Rank</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#4</p>
                      <p className="text-xs text-green-600 dark:text-green-400">↑ 2 positions this month</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <BarChart03
                      data={{
                        labels: ['Your Site', 'Competitor 1', 'Competitor 2', 'Competitor 3'],
                        datasets: [{
                          label: 'Visibility Score',
                          data: [seoData.metrics.visibility_score, 78, 65, 52],
                          backgroundColor: [
                            tailwindConfig().theme.colors.green[500],
                            tailwindConfig().theme.colors.red[500],
                            tailwindConfig().theme.colors.orange[500],
                            tailwindConfig().theme.colors.gray[500],
                          ],
                          borderRadius: 4,
                          maxBarThickness: 48,
                        }],
                      }}
                      width={595}
                      height={248}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SEODashboard;