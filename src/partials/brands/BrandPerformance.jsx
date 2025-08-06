import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Star, Package, Hash, Calendar, Filter } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../../lib/supabase';

function BrandPerformance({ brandId }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('rank');
  
  useEffect(() => {
    loadPerformanceData();
  }, [brandId, timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // In production, this would fetch historical performance data
      // For now, we'll use the current data and simulate trends
      const { data: asins, error } = await supabase
        .from('user_asins')
        .select('*')
        .eq('brand_id', brandId);

      if (error) throw error;

      // Calculate performance metrics
      const avgRank = asins.reduce((sum, a) => sum + (a.current_rank || 0), 0) / asins.length;
      const avgRating = asins.reduce((sum, a) => sum + (a.rating || 0), 0) / asins.length;
      const totalReviews = asins.reduce((sum, a) => sum + (a.review_count || 0), 0);
      
      setPerformanceData({
        currentMetrics: {
          avgRank: Math.round(avgRank),
          avgRating: avgRating.toFixed(1),
          totalReviews,
          activeAsins: asins.filter(a => a.is_active).length,
          totalAsins: asins.length
        },
        asins,
        trends: generateTrends(asins)
      });
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrends = (asins) => {
    // Mock trend data - in production this would be historical data
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const labels = [];
    const rankData = [];
    const reviewData = [];
    const ratingData = [];
    
    for (let i = days; i >= 0; i -= Math.ceil(days / 7)) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Simulate trends
      rankData.push(50000 + Math.random() * 10000 - 5000);
      reviewData.push(asins.reduce((sum, a) => sum + (a.review_count || 0), 0) * (0.9 + Math.random() * 0.2));
      ratingData.push(4.2 + Math.random() * 0.3);
    }
    
    return { labels, rankData, reviewData, ratingData };
  };

  const getChartData = () => {
    if (!performanceData) return { labels: [], datasets: [] };
    
    const { trends } = performanceData;
    let dataset;
    
    switch (selectedMetric) {
      case 'rank':
        dataset = {
          label: 'Average BSR',
          data: trends.rankData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          yAxisID: 'y',
          fill: true,
          tension: 0.3
        };
        break;
      case 'reviews':
        dataset = {
          label: 'Total Reviews',
          data: trends.reviewData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          yAxisID: 'y',
          fill: true,
          tension: 0.3
        };
        break;
      case 'rating':
        dataset = {
          label: 'Average Rating',
          data: trends.ratingData,
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          yAxisID: 'y',
          fill: true,
          tension: 0.3
        };
        break;
    }
    
    return {
      labels: trends.labels,
      datasets: [dataset]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            switch (selectedMetric) {
              case 'rank':
                return `BSR: #${Math.round(value).toLocaleString()}`;
              case 'reviews':
                return `Reviews: ${Math.round(value).toLocaleString()}`;
              case 'rating':
                return `Rating: ${value.toFixed(1)}`;
              default:
                return value;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: selectedMetric === 'rating',
        reverse: selectedMetric === 'rank',
        ticks: {
          callback: (value) => {
            switch (selectedMetric) {
              case 'rank':
                return `#${Math.round(value).toLocaleString()}`;
              case 'reviews':
                return Math.round(value).toLocaleString();
              case 'rating':
                return value.toFixed(1);
              default:
                return value;
            }
          }
        }
      }
    }
  };

  if (loading || !performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading performance data...</div>
      </div>
    );
  }

  const { currentMetrics, asins } = performanceData;

  // Top performing products
  const topPerformers = [...asins]
    .sort((a, b) => (b.monthly_revenue || 0) - (a.monthly_revenue || 0))
    .slice(0, 5);

  // Underperforming products (low rating or high BSR)
  const underperformers = asins.filter(a => 
    (a.rating && a.rating < 4.0) || 
    (a.current_rank && a.current_rank > 100000)
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg BSR</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  #{currentMetrics.avgRank.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -12% better
                </p>
              </div>
              <Hash className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {currentMetrics.avgRating} ⭐
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all products</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Reviews</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {currentMetrics.totalReviews.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +156 this month
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active ASINs</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {currentMetrics.activeAsins}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {currentMetrics.totalAsins} total
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Health Score</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  85%
                </p>
                <p className="text-xs text-green-600 mt-1">Good</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Performance Trends</h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="rank">BSR Rank</option>
              <option value="reviews">Reviews</option>
              <option value="rating">Rating</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6" style={{ height: '300px' }}>
          <Line data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Performers</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BSR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topPerformers.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.product_name || 'Unnamed'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {product.asin}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      #{product.current_rank ? product.current_rank.toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      ${product.monthly_revenue ? (product.monthly_revenue / 1000).toFixed(0) + 'K' : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Needs Attention</h3>
          <div className="space-y-3">
            {underperformers.length > 0 ? (
              underperformers.map((product) => (
                <div key={product.id} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {product.product_name || 'Unnamed Product'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{product.asin}</p>
                    </div>
                    <div className="text-right">
                      {product.rating && product.rating < 4.0 && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Low Rating: {product.rating.toFixed(1)} ⭐
                        </p>
                      )}
                      {product.current_rank && product.current_rank > 100000 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          High BSR: #{product.current_rank.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">All products performing well!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandPerformance;