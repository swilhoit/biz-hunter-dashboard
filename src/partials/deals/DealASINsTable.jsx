import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Star, TrendingUp, TrendingDown, Package, Search, Filter, Download } from 'lucide-react';
import { getProductPlaceholderImage } from '../../utils/asinImageUtils';

// Mock ASIN data
const mockASINs = [
  {
    id: '1',
    asin: 'B08N5WRWNW',
    product_name: 'Premium Dog Food Bowl Set - Stainless Steel with Non-Slip Base',
    category: 'Pet Supplies',
    subcategory: 'Dog Bowls',
    brand: 'PremiumPet',
    monthly_revenue: 45000,
    monthly_units: 1500,
    price: 29.99,
    rank_current: 1250,
    rank_average: 1180,
    rank_change: 70,
    reviews: 2847,
    rating: 4.7,
    profit_margin: 35,
    inventory_value: 28500,
    launch_date: '2023-03-15',
    is_primary: true,
    variations: 3,
    fba: true,
    listing_quality: 'Excellent',
    competition_level: 'Medium',
  },
  {
    id: '2',
    asin: 'B07QXZL5PM',
    product_name: 'Interactive Pet Toy Bundle - Mental Stimulation for Dogs',
    category: 'Pet Supplies',
    subcategory: 'Dog Toys',
    brand: 'PremiumPet',
    monthly_revenue: 32000,
    monthly_units: 800,
    price: 39.99,
    rank_current: 892,
    rank_average: 920,
    rank_change: -28,
    reviews: 1923,
    rating: 4.8,
    profit_margin: 42,
    inventory_value: 21600,
    launch_date: '2023-07-22',
    is_primary: true,
    variations: 2,
    fba: true,
    listing_quality: 'Excellent',
    competition_level: 'High',
  },
  {
    id: '3',
    asin: 'B09MKJH6T2',
    product_name: 'Organic Pet Treats Variety Pack - All Natural Ingredients',
    category: 'Pet Supplies',
    subcategory: 'Dog Treats',
    brand: 'PremiumPet',
    monthly_revenue: 28000,
    monthly_units: 2100,
    price: 13.33,
    rank_current: 2341,
    rank_average: 2280,
    rank_change: 61,
    reviews: 3156,
    rating: 4.6,
    profit_margin: 38,
    inventory_value: 15800,
    launch_date: '2022-11-08',
    is_primary: false,
    variations: 4,
    fba: true,
    listing_quality: 'Good',
    competition_level: 'Low',
  },
  {
    id: '4',
    asin: 'B0B2K8FG9H',
    product_name: 'Luxury Pet Bed - Memory Foam with Washable Cover',
    category: 'Pet Supplies',
    subcategory: 'Dog Beds',
    brand: 'PremiumPet',
    monthly_revenue: 18500,
    monthly_units: 310,
    price: 59.67,
    rank_current: 4200,
    rank_average: 3980,
    rank_change: 220,
    reviews: 892,
    rating: 4.5,
    profit_margin: 28,
    inventory_value: 12400,
    launch_date: '2023-01-12',
    is_primary: false,
    variations: 5,
    fba: true,
    listing_quality: 'Good',
    competition_level: 'Medium',
  },
  {
    id: '5',
    asin: 'B0C1M7N3P5',
    product_name: 'Smart Pet Feeder - WiFi Enabled with App Control',
    category: 'Pet Supplies',
    subcategory: 'Feeding & Watering',
    brand: 'PremiumPet',
    monthly_revenue: 15200,
    monthly_units: 95,
    price: 159.99,
    rank_current: 890,
    rank_average: 845,
    rank_change: 45,
    reviews: 567,
    rating: 4.4,
    profit_margin: 45,
    inventory_value: 9500,
    launch_date: '2023-09-05',
    is_primary: false,
    variations: 1,
    fba: true,
    listing_quality: 'Excellent',
    competition_level: 'High',
  },
];

function DealASINsTable({ dealId }) {
  const [asins, setAsins] = useState(mockASINs);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('monthly_revenue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterPrimary, setFilterPrimary] = useState('all'); // 'all', 'primary', 'secondary'

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatRank = (rank) => {
    return `#${rank.toLocaleString()}`;
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <span className="w-4 h-4"></span>;
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Poor': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCompetitionColor = (level) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedASINs = asins
    .filter(asin => {
      const matchesSearch = asin.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asin.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asin.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterPrimary === 'all' ||
                           (filterPrimary === 'primary' && asin.is_primary) ||
                           (filterPrimary === 'secondary' && !asin.is_primary);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (typeof a[sortField] === 'number') {
        return (a[sortField] - b[sortField]) * direction;
      }
      return a[sortField].localeCompare(b[sortField]) * direction;
    });

  // Calculate summary stats
  const totalRevenue = asins.reduce((sum, asin) => sum + asin.monthly_revenue, 0);
  const avgMargin = asins.reduce((sum, asin) => sum + asin.profit_margin, 0) / asins.length;
  const totalInventoryValue = asins.reduce((sum, asin) => sum + asin.inventory_value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total ASINs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{asins.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Margin</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalInventoryValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ASINs, products, brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <select
            value={filterPrimary}
            onChange={(e) => setFilterPrimary(e.target.value)}
            className="form-select"
          >
            <option value="all">All ASINs</option>
            <option value="primary">Primary Only</option>
            <option value="secondary">Secondary Only</option>
          </select>
          <button className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* ASINs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center">
                    Product
                    {sortField === 'product_name' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('monthly_revenue')}
                >
                  <div className="flex items-center">
                    Revenue
                    {sortField === 'monthly_revenue' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('monthly_units')}
                >
                  <div className="flex items-center">
                    Units Sold
                    {sortField === 'monthly_units' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('rank_current')}
                >
                  <div className="flex items-center">
                    BSR Rank
                    {sortField === 'rank_current' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviews
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('profit_margin')}
                >
                  <div className="flex items-center">
                    Margin
                    {sortField === 'profit_margin' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedASINs.map((asin) => (
                <tr key={asin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="relative inline-flex mr-3 flex-shrink-0">
                        <img 
                          className="w-16 h-16 rounded-lg object-cover"
                          src={getProductPlaceholderImage(asin.category, asin.asin)} 
                          alt={asin.product_name}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <Link 
                            to={`/deals/asins/${asin.asin}`}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-violet-500 dark:hover:text-violet-400 truncate"
                          >
                            {asin.product_name}
                          </Link>
                          {asin.is_primary && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ASIN: {asin.asin} | {asin.brand}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {asin.subcategory} | {asin.variations} variation{asin.variations > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(asin.monthly_revenue)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(asin.price)} each
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {asin.monthly_units.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatRank(asin.rank_current)}
                      </div>
                      <div className="ml-2 flex items-center">
                        {getRankChangeIcon(asin.rank_change)}
                        <span className={`text-xs ml-1 ${asin.rank_change > 0 ? 'text-red-500' : asin.rank_change < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                          {Math.abs(asin.rank_change)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {formatRank(asin.rank_average)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {asin.rating}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {asin.reviews.toLocaleString()} reviews
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      {asin.profit_margin}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getQualityColor(asin.listing_quality)}`}>
                        {asin.listing_quality}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCompetitionColor(asin.competition_level)}`}>
                        {asin.competition_level} Comp
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/deals/asins/${asin.asin}`}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                      <a
                        href={`https://amazon.com/dp/${asin.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="View on Amazon"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No results */}
      {filteredAndSortedASINs.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No ASINs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

export default DealASINsTable;