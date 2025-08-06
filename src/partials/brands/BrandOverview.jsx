import React from 'react';
import { Building2, Package, DollarSign, TrendingUp, ExternalLink, Calendar, MapPin, Hash } from 'lucide-react';

function BrandOverview({ brand, asins }) {
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const topProducts = asins
    .sort((a, b) => (b.monthly_revenue || 0) - (a.monthly_revenue || 0))
    .slice(0, 5);

  const categoryBreakdown = asins.reduce((acc, asin) => {
    const category = asin.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { count: 0, revenue: 0 };
    }
    acc[category].count++;
    acc[category].revenue += asin.monthly_revenue || 0;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Brand Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Brand Information</h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Brand Name</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">{brand.brand_name}</p>
              </div>
              {brand.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-base text-gray-900 dark:text-gray-100">{brand.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-base text-gray-900 dark:text-gray-100">
                  {new Date(brand.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {brand.website_url && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                  <a
                    href={brand.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center"
                  >
                    {brand.website_url}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
              {brand.amazon_store_url && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amazon Store</p>
                  <a
                    href={brand.amazon_store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center"
                  >
                    View Store
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total ASINs</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {brand.total_asins || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg BSR</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {brand.avg_rank ? Math.round(brand.avg_rank).toLocaleString() : 'N/A'}
                </p>
              </div>
              <Hash className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg Reviews</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {brand.avg_reviews ? Math.round(brand.avg_reviews).toLocaleString() : '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {brand.avg_rating ? brand.avg_rating.toFixed(1) : '0.0'} ⭐
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Products by Revenue</h3>
        {topProducts.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ASIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.product_name || 'Unnamed Product'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://amazon.com/dp/${product.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        {product.asin}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(product.monthly_revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {product.profit_margin ? `${product.profit_margin.toFixed(1)}%` : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No products added to this brand yet</p>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Category Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([category, data]) => (
                <div key={category} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{category}</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.count} products
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(data.revenue)} revenue
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandOverview;