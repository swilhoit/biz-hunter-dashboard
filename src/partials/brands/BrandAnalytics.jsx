import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Users, Package, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { Pie, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function BrandAnalytics({ brand, asins }) {
  const [activeView, setActiveView] = useState('overview');
  
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Calculate analytics data
  const calculateAnalytics = () => {
    const totalRevenue = asins.reduce((sum, a) => sum + (a.monthly_revenue || 0), 0);
    const totalProfit = asins.reduce((sum, a) => sum + (a.monthly_profit || 0), 0);
    const avgPrice = asins.reduce((sum, a) => sum + (a.current_price || 0), 0) / asins.length;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Price distribution
    const priceRanges = {
      'Under $20': asins.filter(a => a.current_price < 20).length,
      '$20-$50': asins.filter(a => a.current_price >= 20 && a.current_price < 50).length,
      '$50-$100': asins.filter(a => a.current_price >= 50 && a.current_price < 100).length,
      'Over $100': asins.filter(a => a.current_price >= 100).length
    };
    
    // Performance distribution
    const performanceDistribution = {
      'High Performers': asins.filter(a => a.monthly_revenue > 10000).length,
      'Mid Performers': asins.filter(a => a.monthly_revenue >= 5000 && a.monthly_revenue <= 10000).length,
      'Low Performers': asins.filter(a => a.monthly_revenue < 5000).length
    };
    
    // Category concentration
    const categoryData = asins.reduce((acc, asin) => {
      const category = asin.category || 'Uncategorized';
      if (!acc[category]) acc[category] = 0;
      acc[category] += asin.monthly_revenue || 0;
      return acc;
    }, {});
    
    return {
      totalRevenue,
      totalProfit,
      avgPrice,
      avgMargin,
      priceRanges,
      performanceDistribution,
      categoryData
    };
  };

  const analytics = calculateAnalytics();

  // Chart configurations
  const priceDistributionData = {
    labels: Object.keys(analytics.priceRanges),
    datasets: [{
      data: Object.values(analytics.priceRanges),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const performanceData = {
    labels: Object.keys(analytics.performanceDistribution),
    datasets: [{
      data: Object.values(analytics.performanceDistribution),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const categoryRevenueData = {
    labels: Object.keys(analytics.categoryData).slice(0, 5),
    datasets: [{
      data: Object.values(analytics.categoryData).slice(0, 5),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Competitive Analysis (mock data)
  const competitiveData = {
    labels: ['Price', 'Reviews', 'Rating', 'BSR', 'Revenue', 'Margin'],
    datasets: [
      {
        label: 'Your Brand',
        data: [80, 65, 85, 70, 90, 75],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)'
      },
      {
        label: 'Market Average',
        data: [70, 70, 70, 65, 75, 65],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        pointBackgroundColor: 'rgb(156, 163, 175)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(156, 163, 175)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  // Calculate insights
  const insights = [];
  
  if (analytics.avgMargin < 20) {
    insights.push({
      type: 'warning',
      title: 'Low Profit Margins',
      description: `Average margin of ${analytics.avgMargin.toFixed(1)}% is below industry standard`,
      action: 'Consider optimizing costs or pricing strategy'
    });
  }
  
  if (Object.values(analytics.performanceDistribution)['Low Performers'] > asins.length * 0.4) {
    insights.push({
      type: 'warning',
      title: 'High Percentage of Underperformers',
      description: 'Over 40% of products are generating less than $5K/month',
      action: 'Review and optimize underperforming ASINs'
    });
  }
  
  if (Object.keys(analytics.categoryData).length === 1) {
    insights.push({
      type: 'info',
      title: 'Single Category Focus',
      description: 'All products are in one category',
      action: 'Consider diversifying into related categories'
    });
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Analytics Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Avg Price Point</p>
                <p className="text-2xl font-bold mt-1">${analytics.avgPrice.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Profit Margin</p>
                <p className="text-2xl font-bold mt-1">{analytics.avgMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Active Products</p>
                <p className="text-2xl font-bold mt-1">{asins.length}</p>
              </div>
              <Package className="w-8 h-8 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Categories</p>
                <p className="text-2xl font-bold mt-1">{Object.keys(analytics.categoryData).length}</p>
              </div>
              <BarChart3 className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Price Distribution</h4>
          <div style={{ height: '250px' }}>
            <Pie data={priceDistributionData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Performance Distribution</h4>
          <div style={{ height: '250px' }}>
            <Doughnut data={performanceData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Revenue by Category</h4>
          <div style={{ height: '250px' }}>
            <Pie data={categoryRevenueData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Competitive Position</h4>
          <div style={{ height: '300px' }}>
            <Radar data={competitiveData} options={radarOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Key Insights</h4>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                insight.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-start">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">{insight.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                      Recommendation: {insight.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Your brand is performing well across all metrics!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Metrics</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Industry Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Revenue per Product
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {formatCurrency(analytics.totalRevenue / asins.length)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  $15K
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Above Average
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Average Profit Margin
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {analytics.avgMargin.toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  25%
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    analytics.avgMargin >= 25 ? 
                    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}>
                    {analytics.avgMargin >= 25 ? 'Good' : 'Needs Improvement'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Product Diversity
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {Object.keys(analytics.categoryData).length} categories
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  3-5 categories
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    Object.keys(analytics.categoryData).length >= 3 ? 
                    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}>
                    {Object.keys(analytics.categoryData).length >= 3 ? 'Good' : 'Consider Diversifying'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BrandAnalytics;