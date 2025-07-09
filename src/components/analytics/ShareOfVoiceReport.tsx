import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { 
  Trophy, TrendingUp, Package, Star, Search, 
  BarChart3, PieChart as PieChartIcon, AlertCircle, Table
} from 'lucide-react';
import { 
  BrandShareOfVoice, 
  ShareOfVoiceReport, 
  generateBrandShareOfVoiceReport,
  generateShareOfVoiceReportFromStoreURL 
} from '../../utils/shareOfVoiceAnalysis';

interface ShareOfVoiceReportProps {
  brandName?: string;
  storeUrl?: string;
  category?: string;
  onComplete?: (report: ShareOfVoiceReport, storeName?: string) => void;
}

// Custom label for pie chart
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, index, name
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for very small slices

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ShareOfVoiceReportComponent({ brandName, storeUrl, category, onComplete }: ShareOfVoiceReportProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ShareOfVoiceReport | null>(null);
  const [brandData, setBrandData] = useState<BrandShareOfVoice | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'competitors'>('overview');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    loadShareOfVoiceData();
  }, [brandName, storeUrl, category]);

  const loadShareOfVoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result: any;
      let storeName: string | undefined;
      
      if (brandName) {
        result = await generateBrandShareOfVoiceReport(brandName, category);
        setDisplayName(brandName);
      } else if (storeUrl) {
        result = await generateShareOfVoiceReportFromStoreURL(storeUrl, category);
        setDisplayName(result.storeName || result.brandData.brand);
        storeName = result.storeName;
      } else {
        throw new Error('Either brandName or storeUrl must be provided');
      }
      
      setBrandData(result.brandData);
      setReport(result.marketReport);
      
      if (onComplete) {
        onComplete(result.marketReport, storeName);
      }
    } catch (err: any) {
      console.error('Error loading share of voice data:', err);
      setError(err.message || 'Failed to load share of voice data');
    } finally {
      setLoading(false);
    }
  };

  const formatRevenue = (value: number) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (!value || isNaN(value)) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  // Color palette for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6B7280'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!report || !brandData) {
    return <div>No data available</div>;
  }

  // Prepare data for market share pie chart - ensure valid data
  const validTopBrands = report.topBrands.filter(brand => 
    brand.marketShare > 0 && !isNaN(brand.marketShare)
  );
  
  const marketShareData = validTopBrands.slice(0, 8).map(brand => ({
    name: brand.brand,
    value: parseFloat(brand.marketShare.toFixed(2)),
    revenue: brand.totalRevenue
  }));

  // Add "Others" if there are more brands
  if (report.competitiveLandscape.totalBrands > 8) {
    const othersShare = Math.max(0, 100 - marketShareData.reduce((sum, b) => sum + b.value, 0));
    if (othersShare > 0) {
      marketShareData.push({
        name: 'Others',
        value: parseFloat(othersShare.toFixed(2)),
        revenue: 0
      });
    }
  }

  // Prepare keyword performance data - ensure valid data
  const keywordPerformanceData = (brandData.topKeywords || [])
    .filter(kw => kw.searchVolume > 0)
    .slice(0, 10)
    .map(kw => ({
      keyword: kw.keyword,
      searchVolume: kw.searchVolume,
      brandShare: parseFloat(kw.sharePercentage.toFixed(1)),
      competitorShare: parseFloat((100 - kw.sharePercentage).toFixed(1))
    }));

  // Prepare revenue comparison data
  const revenueComparisonData = validTopBrands
    .slice(0, 10)
    .map(brand => ({
      brand: brand.brand === displayName ? `${brand.brand} (You)` : brand.brand,
      revenue: brand.totalRevenue,
      units: brand.totalUnits,
      isTarget: brand.brand === displayName
    }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Market Share</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brandData.marketShare?.toFixed(1) || '0'}%
              </p>
            </div>
            <Trophy className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Rank #{report.topBrands.findIndex(b => b.brand === brandData.brand) + 1} of {report.competitiveLandscape.totalBrands}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue Share</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatRevenue(brandData.totalRevenue)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            of {formatRevenue(report.totalMarketRevenue)} total
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Product Count</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brandData.productCount || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Avg {report.competitiveLandscape.avgProductsPerBrand?.toFixed(0) || 0} per brand
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brandData.avgRating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatNumber(brandData.avgReviews || 0)} avg reviews
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />
              Market Overview
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'keywords'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Search className="inline-block w-4 h-4 mr-2" />
              Keyword Analysis
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'competitors'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Table className="inline-block w-4 h-4 mr-2" />
              Competitive Landscape
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Market Share Distribution */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Market Share Distribution</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Market Share by Brand (%)
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marketShareData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {marketShareData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                stroke={entry.name === displayName ? '#1F2937' : 'none'}
                                strokeWidth={entry.name === displayName ? 2 : 0}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `${value.toFixed(1)}%`}
                            contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value) => value === displayName ? `${value} (You)` : value}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Bar Chart */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Revenue Comparison (30 days)
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueComparisonData} margin={{ bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="brand" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatRevenue(value).replace('$', '')}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatRevenue(value)}
                            contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar 
                            dataKey="revenue" 
                            fill="#3B82F6"
                            radius={[8, 8, 0, 0]}
                          >
                            {revenueComparisonData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isTarget ? '#10B981' : '#3B82F6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Share Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Competitive Landscape Table</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Market Share
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Revenue (30d)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Units Sold
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {validTopBrands.slice(0, 15).map((brand, index) => (
                        <tr 
                          key={index} 
                          className={brand.brand === displayName ? 'bg-green-50 dark:bg-green-900/20' : ''}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {brand.brand}
                            {brand.brand === displayName && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">You</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(brand.marketShare, 100)}%` }}
                                ></div>
                              </div>
                              <span>{brand.marketShare.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatRevenue(brand.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(brand.totalUnits)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {brand.productCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              {brand.avgRating.toFixed(1)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Market Concentration */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Market Concentration Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Total Brands</p>
                    <p className="font-semibold">{report.competitiveLandscape.totalBrands}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Total Products</p>
                    <p className="font-semibold">{report.competitiveLandscape.totalProducts}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Avg Products/Brand</p>
                    <p className="font-semibold">{report.competitiveLandscape.avgProductsPerBrand?.toFixed(1) || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">HHI Index</p>
                    <p className="font-semibold">{((report.competitiveLandscape.concentrationIndex || 0) * 10000).toFixed(0)}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>Market Type: {
                    report.competitiveLandscape.concentrationIndex > 0.25 ? 
                      <span className="text-red-600 font-medium">Highly Concentrated</span> : 
                    report.competitiveLandscape.concentrationIndex > 0.15 ? 
                      <span className="text-yellow-600 font-medium">Moderately Concentrated</span> : 
                      <span className="text-green-600 font-medium">Competitive</span>
                  }</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-6">
              {/* Keyword Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Keyword Performance</h3>
                {keywordPerformanceData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={keywordPerformanceData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="keyword" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="brandShare" stackId="a" fill="#3B82F6" name="Brand Share %" />
                        <Bar dataKey="competitorShare" stackId="a" fill="#E5E7EB" name="Competitor Share %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No keyword data available
                  </div>
                )}
              </div>

              {/* Keyword Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Keyword Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Keyword
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Search Volume
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Brand Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Share %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {(report.keywordAnalysis || []).map((kw, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {kw.keyword}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(kw.searchVolume)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {kw.brandProductCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {kw.totalProductCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {kw.sharePercentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competitors' && (
            <div className="space-y-6">
              {/* Top Competitors Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">Top Competitor</h4>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {validTopBrands[0]?.brand || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {validTopBrands[0]?.marketShare.toFixed(1) || 0}% market share
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-300">Your Position</h4>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    #{report.topBrands.findIndex(b => b.brand === brandData.brand) + 1}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    out of {report.competitiveLandscape.totalBrands} brands
                  </p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300">Market Leader</h4>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {formatRevenue(validTopBrands[0]?.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    monthly revenue
                  </p>
                </div>
              </div>

              {/* Competitor Comparison */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Competitors Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Market Share
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Keyword Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {validTopBrands.map((brand, index) => (
                        <tr key={index} className={brand.brand === displayName ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {brand.brand}
                            {brand.brand === displayName && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatRevenue(brand.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {brand.marketShare.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {brand.productCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {brand.avgRating.toFixed(1)} ({formatNumber(brand.avgReviews)})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {brand.keywordShare.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Distribution */}
              {brandData.categoryDistribution && Object.keys(brandData.categoryDistribution).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Distribution - {displayName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(brandData.categoryDistribution).map(([category, count]) => (
                      <div key={category} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-gray-500">{count} products</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}