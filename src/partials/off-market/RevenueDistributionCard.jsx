import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function RevenueDistributionCard() {
  const [stats, setStats] = useState({
    totalASINs: 0,
    percentiles: {},
    topCategories: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueDistribution();
  }, []);

  const loadRevenueDistribution = async () => {
    try {
      // Get all ASINs with revenue data
      const { data: asins } = await supabase
        .from('asins')
        .select('category, est_rev')
        .not('est_rev', 'is', null)
        .order('est_rev', { ascending: false });

      if (!asins || asins.length === 0) {
        setStats({ totalASINs: 0, percentiles: {}, topCategories: [] });
        setLoading(false);
        return;
      }

      // Calculate percentiles
      const revenues = asins.map(asin => asin.est_rev).sort((a, b) => b - a);
      const percentiles = {
        p90: getPercentile(revenues, 0.9),
        p75: getPercentile(revenues, 0.75),
        p50: getPercentile(revenues, 0.5),
        p25: getPercentile(revenues, 0.25),
        p10: getPercentile(revenues, 0.1)
      };

      // Group by category
      const categoryData = asins.reduce((acc, asin) => {
        if (!acc[asin.category]) {
          acc[asin.category] = [];
        }
        acc[asin.category].push(asin.est_rev);
        return acc;
      }, {});

      const topCategories = Object.keys(categoryData)
        .map(category => ({
          category,
          count: categoryData[category].length,
          avgRevenue: categoryData[category].reduce((sum, rev) => sum + rev, 0) / categoryData[category].length,
          maxRevenue: Math.max(...categoryData[category]),
          minRevenue: Math.min(...categoryData[category])
        }))
        .sort((a, b) => b.avgRevenue - a.avgRevenue)
        .slice(0, 10);

      setStats({
        totalASINs: asins.length,
        percentiles,
        topCategories
      });

    } catch (error) {
      console.error('Error loading revenue distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentile = (sortedArray, percentile) => {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[index] || 0;
  };

  const formatRevenue = (revenue) => {
    if (!revenue) return '$0';
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue.toFixed(0)}`;
  };

  const getRevenueColor = (revenue) => {
    if (revenue >= 100000) return 'text-green-600 dark:text-green-400';
    if (revenue >= 50000) return 'text-yellow-600 dark:text-yellow-400';
    if (revenue >= 10000) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-6 xl:col-span-4">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Revenue Distribution</h2>
          </div>
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-4">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Revenue Distribution</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Analysis of estimated revenue across discovered ASINs
          </p>
        </header>
        
        <div className="p-5">
          {stats.totalASINs > 0 ? (
            <>
              {/* Revenue Percentiles */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Revenue Percentiles
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.percentiles).map(([percentile, value]) => (
                    <div key={percentile} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {percentile.toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getRevenueColor(value)}`}>
                        {formatRevenue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Top Categories by Avg Revenue
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.topCategories.map((category, index) => (
                    <div 
                      key={category.category}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {category.category || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {category.count} ASINs
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className={`text-sm font-medium ${getRevenueColor(category.avgRevenue)}`}>
                          {formatRevenue(category.avgRevenue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalASINs.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total ASINs</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {stats.topCategories.length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Categories</div>
                </div>
              </div>

              {/* Revenue Tiers */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Revenue Tiers
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">$100K+ (Premium)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">$50K-$100K (High Value)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">$10K-$50K (Medium Value)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Under $10K (Low Value)</span>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadRevenueDistribution}
                className="w-full btn-sm bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
              >
                <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 16 16">
                  <path d="M8 0a8 8 0 0 1 8 8 1 1 0 1 1-2 0 6 6 0 1 0-6 6 1 1 0 1 1 0 2 8 8 0 1 1 0-16z"/>
                </svg>
                Refresh Data
              </button>
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-6">
              <div className="text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No revenue data</p>
                <p className="text-gray-500 dark:text-gray-400">Run product discovery to analyze revenue distribution.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RevenueDistributionCard;