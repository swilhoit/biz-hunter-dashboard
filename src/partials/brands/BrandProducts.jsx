import React, { useState } from 'react';
import { Package, Plus, Search, Filter, ExternalLink, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

function BrandProducts({ brand, asins, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const filteredAsins = asins
    .filter(asin => {
      const search = searchTerm.toLowerCase();
      return (
        asin.asin?.toLowerCase().includes(search) ||
        asin.product_name?.toLowerCase().includes(search) ||
        asin.category?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return (b.monthly_revenue || 0) - (a.monthly_revenue || 0);
        case 'profit':
          return (b.monthly_profit || 0) - (a.monthly_profit || 0);
        case 'margin':
          return (b.profit_margin || 0) - (a.profit_margin || 0);
        case 'units':
          return (b.monthly_units_sold || 0) - (a.monthly_units_sold || 0);
        case 'rank':
          return (a.current_rank || 999999) - (b.current_rank || 999999);
        default:
          return 0;
      }
    });

  const handleDeleteAsin = async (asinId) => {
    if (!confirm('Are you sure you want to remove this product from the brand?')) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/portfolio/asins/${asinId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting ASIN:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="profit">Sort by Profit</option>
            <option value="margin">Sort by Margin</option>
            <option value="units">Sort by Units</option>
            <option value="rank">Sort by Rank</option>
          </select>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      {filteredAsins.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Units/mo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  BSR
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAsins.map((asin) => {
                const profitMargin = asin.profit_margin || 0;
                const isHighMargin = profitMargin >= 30;
                const isLowMargin = profitMargin < 20;
                
                return (
                  <tr key={asin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {asin.product_name || 'Unnamed Product'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <a
                            href={`https://amazon.com/dp/${asin.asin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                          >
                            {asin.asin}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {asin.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {asin.rating ? asin.rating.toFixed(1) : '0.0'}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">⭐</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {asin.review_count ? `${asin.review_count.toLocaleString()} reviews` : 'No reviews'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(asin.monthly_revenue)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ${asin.current_price || 0} per unit
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(asin.monthly_profit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isHighMargin ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                        isLowMargin ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                        {profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {asin.monthly_units_sold ? asin.monthly_units_sold.toLocaleString() : '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {asin.current_rank ? `#${asin.current_rank.toLocaleString()}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeleteAsin(asin.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Remove from brand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No products found matching your search' : 'No products added to this brand yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Add your first product
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {filteredAsins.length > 0 && (
        <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center space-x-6">
              <span className="text-gray-600 dark:text-gray-400">
                Showing {filteredAsins.length} of {asins.length} products
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Total Revenue: <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(filteredAsins.reduce((sum, a) => sum + (a.monthly_revenue || 0), 0))}
                </span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Total Profit: <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(filteredAsins.reduce((sum, a) => sum + (a.monthly_profit || 0), 0))}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandProducts;