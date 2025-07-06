import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { Globe, Search, TrendingUp, Link, Users, BarChart3, Eye, AlertCircle, Loader2, RefreshCw, Smartphone, Zap, Target, Shield } from 'lucide-react';
import LineChart01 from '../charts/LineChart01';
import BarChart03 from '../charts/BarChart03';
import { tailwindConfig } from '../utils/Utils';

interface SEOMetrics {
  domain_authority: number;
  page_authority: number;
  trust_flow: number;
  citation_flow: number;
  organic_traffic: number;
  paid_traffic: number;
  direct_traffic: number;
  referral_traffic: number;
  keywords_count: number;
  keywords_top_3: number;
  keywords_top_10: number;
  keywords_top_100: number;
  backlinks_count: number;
  referring_domains: number;
  dofollow_backlinks: number;
  page_speed_score: number;
  mobile_score: number;
  visibility_score: number;
  content_quality_score: number;
  organic_competitors: number;
}

interface Keyword {
  keyword: string;
  position: number;
  search_volume: number;
  difficulty: number;
  trend: 'up' | 'down' | 'stable';
  url: string;
  traffic_value?: number;
}

interface TopPage {
  url: string;
  traffic: number;
  bounce_rate: number;
  avg_time_on_page: string;
  keywords_count: number;
  page_value?: number;
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
    direct?: number[];
    referral?: number[];
    current_breakdown?: {
      organic: number;
      paid: number;
      direct: number;
      referral: number;
      social: number;
    };
  };
  lastUpdated: string;
  api_errors?: string[];
  data_completeness?: number;
}

function SEODashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
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
          page_authority: data.page_authority || 0,
          trust_flow: data.trust_flow || 0,
          citation_flow: data.citation_flow || 0,
          organic_traffic: data.organic_traffic || 0,
          paid_traffic: data.paid_traffic || 0,
          direct_traffic: data.direct_traffic || 0,
          referral_traffic: data.referral_traffic || 0,
          keywords_count: data.keywords_count || 0,
          keywords_top_3: data.keywords_top_3 || 0,
          keywords_top_10: data.keywords_top_10 || 0,
          keywords_top_100: data.keywords_top_100 || 0,
          backlinks_count: data.backlinks_count || 0,
          referring_domains: data.referring_domains || 0,
          dofollow_backlinks: data.dofollow_backlinks || 0,
          page_speed_score: data.page_speed_score || 0,
          mobile_score: data.mobile_score || 0,
          visibility_score: data.visibility_score || 0,
          content_quality_score: data.content_quality_score || 0,
          organic_competitors: data.organic_competitors || 0,
        },
        keywords: data.keywords || [],
        topPages: data.top_pages || [],
        trafficData: data.traffic_data || {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          organic: [0, 0, 0, 0, 0, 0],
          paid: [0, 0, 0, 0, 0, 0],
        },
        lastUpdated: data.last_updated || new Date().toISOString(),
        api_errors: data.api_errors || [],
        data_completeness: data.data_completeness || 0,
      };

      setSeoData(transformedData);
    } catch (err) {
      console.error('Error fetching SEO data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SEO data');
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
    // Don't auto-fetch any data - wait for user input
  }, []);

  const seoMetrics = seoData ? [
    {
      title: 'Domain Authority',
      value: `${seoData.metrics.domain_authority}/100`,
      change: '+3',
      icon: Globe,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Overall domain strength'
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
      description: 'Monthly organic visitors'
    },
    {
      title: 'Keywords Ranking',
      value: seoData.metrics.keywords_count.toLocaleString(),
      change: '+89',
      icon: Search,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Total ranking keywords'
    },
    {
      title: 'Total Backlinks',
      value: seoData.metrics.backlinks_count.toLocaleString(),
      change: '+245',
      icon: Link,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      description: 'Total backlink count'
    },
  ] : [];

  // Additional metrics for the expanded view
  const advancedMetrics = seoData ? [
    {
      title: 'Page Authority',
      value: `${seoData.metrics.page_authority}/100`,
      icon: Target,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'Page Speed Score',
      value: `${seoData.metrics.page_speed_score}/100`,
      icon: Zap,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Mobile Score',
      value: `${seoData.metrics.mobile_score}/100`,
      icon: Smartphone,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    },
    {
      title: 'Referring Domains',
      value: seoData.metrics.referring_domains.toLocaleString(),
      icon: Shield,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
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
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                  
                  {/* Data Quality Indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      (seoData.data_completeness || 0) >= 80 ? 'bg-green-500' :
                      (seoData.data_completeness || 0) >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                      Data: {seoData.data_completeness || 0}% complete
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* API Errors Warning */}
            {seoData?.api_errors && seoData.api_errors.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-800 dark:text-yellow-200 font-medium">
                      Partial Data Warning
                    </h4>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                      Some SEO data could not be retrieved. Missing: {seoData.api_errors.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  <p className="text-gray-600 dark:text-gray-400">Fetching comprehensive SEO data...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Analyzing domain metrics, keywords, backlinks, and performance data
                  </p>
                </div>
              </div>
            ) : !loading && !seoData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Ready to Analyze SEO Performance
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Enter a domain name above to get comprehensive SEO insights including rankings, traffic, and technical performance.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    <p>We'll analyze:</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Domain Authority</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Keyword Rankings</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Traffic Sources</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Backlinks</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Technical SEO</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : seoData ? (
              <div className="space-y-6">
                {/* Primary SEO Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {seoMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                            <Icon className={`w-6 h-6 ${metric.color}`} />
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                            <p className={`text-xs ${metric.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {metric.change} this month
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{metric.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Secondary SEO Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {advancedMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                            <Icon className={`w-5 h-5 ${metric.color}`} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Keyword Performance Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Keyword Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {seoData.metrics.keywords_top_3.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Top 3 Rankings</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {seoData.metrics.keywords_top_10.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Top 10 Rankings</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {seoData.metrics.keywords_top_100.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Top 100 Rankings</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {seoData.metrics.keywords_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Keywords</p>
                    </div>
                  </div>
                </div>

                {/* Traffic Overview with Source Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Traffic Overview</h3>
                  
                  {/* Current Traffic Breakdown */}
                  {seoData.trafficData.current_breakdown && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {(seoData.trafficData.current_breakdown.organic / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-gray-500">Organic</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {(seoData.trafficData.current_breakdown.paid / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-gray-500">Paid</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {(seoData.trafficData.current_breakdown.direct / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-gray-500">Direct</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {(seoData.trafficData.current_breakdown.referral / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-gray-500">Referral</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                          {(seoData.trafficData.current_breakdown.social / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-gray-500">Social</p>
                      </div>
                    </div>
                  )}

                  <div className="relative" style={{ height: '300px' }}>
                    <LineChart01
                      data={{
                        labels: seoData.trafficData.labels,
                        datasets: [
                          {
                            label: 'Organic Traffic',
                            data: seoData.trafficData.organic,
                            borderColor: tailwindConfig().theme.colors.green[500],
                            backgroundColor: tailwindConfig().theme.colors.green[500] + '20',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                          },
                          {
                            label: 'Paid Traffic',
                            data: seoData.trafficData.paid,
                            borderColor: tailwindConfig().theme.colors.blue[500],
                            backgroundColor: tailwindConfig().theme.colors.blue[500] + '20',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                          },
                          ...(seoData.trafficData.direct ? [{
                            label: 'Direct Traffic',
                            data: seoData.trafficData.direct,
                            borderColor: tailwindConfig().theme.colors.purple[500],
                            backgroundColor: tailwindConfig().theme.colors.purple[500] + '20',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                          }] : []),
                          ...(seoData.trafficData.referral ? [{
                            label: 'Referral Traffic',
                            data: seoData.trafficData.referral,
                            borderColor: tailwindConfig().theme.colors.orange[500],
                            backgroundColor: tailwindConfig().theme.colors.orange[500] + '20',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                          }] : []),
                        ],
                      }}
                      width={389}
                      height={300}
                    />
                  </div>
                </div>

                {/* Top Keywords & Pages Grid */}
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
                            <th className="pb-3">Difficulty</th>
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

                {/* Comprehensive Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Visibility Score */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Visibility Score</h3>
                      <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {seoData.metrics.visibility_score}/100
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Overall SEO visibility in search results
                      </p>
                    </div>
                  </div>

                  {/* Content Quality Score */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Content Quality</h3>
                      <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {seoData.metrics.content_quality_score}/100
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Content performance and optimization
                      </p>
                    </div>
                  </div>

                  {/* Competitive Position */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Competitors</h3>
                      <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {seoData.metrics.organic_competitors}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Competing domains detected
                      </p>
                    </div>
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