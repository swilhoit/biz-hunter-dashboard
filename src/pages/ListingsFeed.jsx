import React, { useState, useEffect } from 'react';
import Header from '../partials/Header';
import ListingsTable from '../partials/deals/ListingsTable';
import ListingCard from '../partials/deals/ListingCard';
import { useCachedListings } from '../hooks/useCachedListings';
import { useToast } from '../contexts/ToastContext';
import { Search, Grid, List, RefreshCw, Loader2, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ListingsFeed() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess } = useToast();
  const [viewMode, setViewMode] = useState('table');
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'created_at');
  const [sortDirection, setSortDirection] = useState(searchParams.get('sortDirection') || 'desc');
  const [selectedListings, setSelectedListings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Simplified filters for BigQuery listings - initialize from URL
  const [activeFilters, setActiveFilters] = useState({
    priceRange: { 
      min: searchParams.get('minPrice') || '', 
      max: searchParams.get('maxPrice') || '' 
    },
    monthlyRevenue: { 
      min: searchParams.get('minRevenue') || '', 
      max: searchParams.get('maxRevenue') || '' 
    },
    monthlyProfit: { 
      min: searchParams.get('minProfit') || '', 
      max: searchParams.get('maxProfit') || '' 
    },
    source: searchParams.get('source') || '',
    category: searchParams.get('category') || ''
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (sortBy !== 'created_at') params.set('sortBy', sortBy);
    if (sortDirection !== 'desc') params.set('sortDirection', sortDirection);
    if (activeFilters.priceRange.min) params.set('minPrice', activeFilters.priceRange.min);
    if (activeFilters.priceRange.max) params.set('maxPrice', activeFilters.priceRange.max);
    if (activeFilters.monthlyRevenue.min) params.set('minRevenue', activeFilters.monthlyRevenue.min);
    if (activeFilters.monthlyRevenue.max) params.set('maxRevenue', activeFilters.monthlyRevenue.max);
    if (activeFilters.monthlyProfit.min) params.set('minProfit', activeFilters.monthlyProfit.min);
    if (activeFilters.monthlyProfit.max) params.set('maxProfit', activeFilters.monthlyProfit.max);
    if (activeFilters.source) params.set('source', activeFilters.source);
    if (activeFilters.category) params.set('category', activeFilters.category);
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, sortBy, sortDirection, activeFilters, setSearchParams]);

  // Fetch BigQuery listings
  const { 
    listings = [],
    totalCount,
    loading: isLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    isStale
  } = useCachedListings({ 
    searchTerm, 
    priceRange: activeFilters.priceRange,
    monthlyRevenue: activeFilters.monthlyRevenue,
    monthlyProfit: activeFilters.monthlyProfit,
    source: activeFilters.source,
    category: activeFilters.category,
    sortBy,
    sortDirection
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch(true); // Force refresh, bypass cache
    showSuccess('Listings refreshed');
  };

  // Handle listing click
  const handleListingClick = (listingId) => {
    sessionStorage.setItem('listingsFeedScrollPosition', window.pageYOffset.toString());
    navigate(`/feed/${listingId}`);
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection(column === 'asking_price' ? 'desc' : 'asc');
    }
  };

  // Simple filter UI
  const renderFilters = () => (
    <div className="bg-white dark:bg-stone-900 rounded-lg shadow-sm mb-4">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
          {(searchTerm || Object.values(activeFilters).some(f => 
            (typeof f === 'object' ? f.min || f.max : f)
          )) && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {showFilters && (
        <div className="p-4 border-t border-gray-200 dark:border-stone-700">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
            Keyword Search
          </label>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
            Min Price
          </label>
          <input
            type="number"
            placeholder="$ Min"
            value={activeFilters.priceRange.min}
            onChange={(e) => setActiveFilters(prev => ({
              ...prev,
              priceRange: { ...prev.priceRange, min: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
            Max Price
          </label>
          <input
            type="number"
            placeholder="$ Max"
            value={activeFilters.priceRange.max}
            onChange={(e) => setActiveFilters(prev => ({
              ...prev,
              priceRange: { ...prev.priceRange, max: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
            Category
          </label>
          <select
            value={activeFilters.category}
            onChange={(e) => setActiveFilters(prev => ({
              ...prev,
              category: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-md"
          >
            <option value="">All Categories</option>
            <option value="E-Commerce">E-Commerce</option>
            <option value="Amazon FBA">Amazon FBA</option>
            <option value="SaaS">SaaS</option>
            <option value="Content">Content</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
            Source
          </label>
          <select
            value={activeFilters.source}
            onChange={(e) => setActiveFilters(prev => ({
              ...prev,
              source: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-md"
          >
            <option value="">All Sources</option>
            <option value="bizbuysell">BizBuySell</option>
            <option value="quietlight">QuietLight</option>
            <option value="centurica">Centurica</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilters({
                priceRange: { min: '', max: '' },
                monthlyRevenue: { min: '', max: '' },
                monthlyProfit: { min: '', max: '' },
                source: '',
                category: ''
              });
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            Clear All
          </button>
        </div>
      </div>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            <div className="text-center py-12">
              <p className="text-red-600">Error loading listings: {error.message}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header />
      <main className="grow">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
          {/* Page header */}
          <div className="sm:flex sm:justify-between sm:items-center mb-8">
            <div className="mb-4 sm:mb-0">
              <p className="text-gray-600 dark:text-gray-400">
                {totalCount || listings.length} listings available
                {isStale && <span className="ml-2 text-xs text-orange-600">(updating...)</span>}
              </p>
            </div>
            <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden xs:block ml-2">Refresh</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-stone-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-stone-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-lg"
              />
            </div>
          </div>

          {/* Filters */}
          {renderFilters()}

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          )}

          {/* Listings */}
          {!isLoading && listings.length > 0 && (
            viewMode === 'table' ? (
              <ListingsTable
                listings={listings}
                selectedListings={selectedListings}
                setSelectedListings={setSelectedListings}
                onListingClick={handleListingClick}
                onSort={handleSort}
                sortBy={sortBy}
                sortDirection={sortDirection}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => handleListingClick(listing.id)}
                  />
                ))}
              </div>
            )
          )}

          {/* Empty state */}
          {!isLoading && listings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No listings found</p>
            </div>
          )}

          {/* Load More Button */}
          {!isLoading && hasMore && listings.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ListingsFeed;