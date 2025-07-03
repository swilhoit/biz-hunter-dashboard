import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Globe, DollarSign, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';

interface MarketTrendsProps {
  products: any[];
  keywords: string;
  keywordData: any;
}

export function MarketTrends({ products, keywords, keywordData }: MarketTrendsProps) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Generate trend data based on products
    if (products.length > 0) {
      const months = timeRange === '30d' ? 1 : timeRange === '90d' ? 3 : 12;
      const data = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const randomVariation = 0.8 + Math.random() * 0.4; // 80% to 120% variation
        const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0) * randomVariation;
        const totalSales = products.reduce((sum, p) => sum + p.sales, 0) * randomVariation;
        const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: Math.round(totalRevenue),
          sales: Math.round(totalSales),
          avgPrice: Math.round(avgPrice * 100) / 100,
          products: Math.round(products.length * (0.9 + Math.random() * 0.2))
        });
      }
      
      setTrendData(data);
    }
  }, [products, timeRange]);

  // Market insights calculations
  const insights = {
    growthRate: trendData.length > 1 
      ? ((trendData[trendData.length - 1]?.revenue - trendData[0]?.revenue) / trendData[0]?.revenue * 100).toFixed(1)
      : 0,
    avgMonthlyRevenue: trendData.length > 0
      ? Math.round(trendData.reduce((sum, d) => sum + d.revenue, 0) / trendData.length)
      : 0,
    topCategory: products.length > 0
      ? Object.entries(products.reduce((acc, p) => {
          const cat = p.category || 'Unknown';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
      : 'N/A',
    marketConcentration: products.length > 0
      ? (products.slice(0, 5).reduce((sum, p) => sum + p.revenue, 0) / 
         products.reduce((sum, p) => sum + p.revenue, 0) * 100).toFixed(1)
      : 0
  };

  const seasonalData = [
    { month: 'Jan', index: 95 },
    { month: 'Feb', index: 92 },
    { month: 'Mar', index: 98 },
    { month: 'Apr', index: 102 },
    { month: 'May', index: 105 },
    { month: 'Jun', index: 108 },
    { month: 'Jul', index: 110 },
    { month: 'Aug', index: 107 },
    { month: 'Sep', index: 103 },
    { month: 'Oct', index: 106 },
    { month: 'Nov', index: 118 },
    { month: 'Dec', index: 125 }
  ];

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Market Growth</p>
            <TrendingUp className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {insights.growthRate > 0 ? '+' : ''}{insights.growthRate}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            vs. {timeRange === '30d' ? 'last month' : timeRange === '90d' ? 'last quarter' : 'last year'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Monthly Revenue</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            ${formatNumberWithCommas(insights.avgMonthlyRevenue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Across all products
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
            <Globe className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-2">
            {insights.topCategory}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Market Concentration</p>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {insights.marketConcentration}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Top 5 products
          </p>
        </div>
      </div>

      {/* Revenue & Sales Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Revenue & Sales Trend</h3>
          <div className="flex gap-2">
            {(['30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  timeRange === range
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Revenue ($)"
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sales" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Sales (units)"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonal Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Seasonal Index</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="index" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Seasonal Index"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            100 = Average, Higher values indicate peak seasons
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Price Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { range: '$0-25', count: products.filter(p => p.price < 25).length },
                  { range: '$25-50', count: products.filter(p => p.price >= 25 && p.price < 50).length },
                  { range: '$50-100', count: products.filter(p => p.price >= 50 && p.price < 100).length },
                  { range: '$100-200', count: products.filter(p => p.price >= 100 && p.price < 200).length },
                  { range: '$200+', count: products.filter(p => p.price >= 200).length },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Top Performing Segments</h4>
            <div className="space-y-2">
              {products
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                      {product.title}
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 ml-2">
                      ${formatNumberWithCommas(product.revenue)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Market Opportunities</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>High-growth segments showing {insights.growthRate}% increase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Peak season approaching in Q4 with 25% higher demand</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-0.5">•</span>
                <span>Premium segment ($100+) showing strong margins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Emerging brands capturing market share from incumbents</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            Search for products to see market trends and insights
          </p>
        </div>
      )}
    </div>
  );
}