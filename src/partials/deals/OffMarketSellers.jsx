import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, DollarSign, Calendar, Package, TrendingUp, Users, Search, Grid, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const categoryColors = {
  'Beauty & Personal Care': 'bg-pink-100 text-pink-800',
  'Electronics': 'bg-blue-100 text-blue-800',
  'Home & Kitchen': 'bg-green-100 text-green-800',
  'Sports & Outdoors': 'bg-orange-100 text-orange-800',
  'Pet Supplies': 'bg-purple-100 text-purple-800'
};

function OffMarketSellers({ onAddToPipeline }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get sellers from the database using the get_off_market_sellers function
      const { data: sellersData, error: sellersError } = await supabase
        .rpc('get_off_market_sellers', {
          min_revenue: 100000, // $100k minimum
          min_listings: 1,
          has_contacts: false
        });

      if (sellersError) {
        console.error('Error loading sellers:', sellersError);
        setError('Failed to load sellers');
        return;
      }

      // Transform the data to match the expected format
      const transformedSellers = sellersData.map(seller => ({
        id: seller.seller_id,
        seller_name: seller.seller_name || 'Unknown Seller',
        category: 'Amazon Seller', // Default category since we don't have product categories yet
        monthly_revenue: Math.round((seller.total_est_revenue || 0) / 12),
        monthly_profit: Math.round((seller.total_est_revenue || 0) * 0.25 / 12), // Assume 25% profit margin
        business_age_months: 24, // Default age
        top_asins: [], // Empty array for now
        asin_count: seller.listings_count || 0,
        revenue_trend: seller.total_est_revenue > 1000000 ? 'increasing' : 'stable',
        last_updated: new Date().toISOString().split('T')[0],
        total_est_revenue: seller.total_est_revenue,
        is_whale: seller.is_whale,
        email_contacts: seller.email_contacts || 0,
        phone_contacts: seller.phone_contacts || 0
      }));

      setSellers(transformedSellers);
    } catch (error) {
      console.error('Error loading sellers:', error);
      setError('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = searchTerm === '' || 
      seller.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || seller.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(sellers.map(s => s.category))];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <span className="w-4 h-4 text-gray-400">→</span>;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatAge = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years}y ${remainingMonths}m`;
    }
    return `${months}m`;
  };

  return (
    <div>
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search off-market sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Get Listings Button */}
            <button
              onClick={() => navigate('/off-market-deals')}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium"
            >
              Get Listings
            </button>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                title="Card view"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading sellers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-700 p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <button
              onClick={loadSellers}
              className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Sellers Display */}
      {!loading && !error && (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSellers.map(seller => (
                <div 
                  key={seller.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/off-market-seller/${seller.id}`)}
                >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {seller.seller_name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[seller.category] || 'bg-gray-100 text-gray-800'} mt-2`}>
                      {seller.category}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Monthly Revenue
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(seller.monthly_revenue)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Monthly Profit
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(seller.monthly_profit)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatAge(seller.business_age_months)}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Package className="w-4 h-4 mr-1" />
                      {seller.asin_count} ASINs
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(seller.revenue_trend)}
                    <span className="text-xs text-gray-500">Revenue</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Top ASINs:</p>
                  <div className="flex gap-2">
                    {seller.top_asins.map((asin, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {asin}
                      </span>
                    ))}
                    {seller.asin_count > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        +{seller.asin_count - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monthly Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monthly Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ASINs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Top Products
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSellers.map(seller => (
                    <tr 
                      key={seller.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/off-market-seller/${seller.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {seller.seller_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[seller.category] || 'bg-gray-100 text-gray-800'}`}>
                          {seller.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(seller.monthly_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(seller.monthly_profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatAge(seller.business_age_months)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {seller.asin_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(seller.revenue_trend)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {seller.top_asins.slice(0, 2).map((asin, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {asin}
                            </span>
                          ))}
                          {seller.asin_count > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              +{seller.asin_count - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {filteredSellers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No off-market sellers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'Check back later for new off-market opportunities'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OffMarketSellers;