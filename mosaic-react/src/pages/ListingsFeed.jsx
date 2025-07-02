import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import ListingsTable from '../partials/deals/ListingsTable';
import ListingsFilters from '../partials/deals/ListingsFilters';
import ListingCard from '../partials/deals/ListingCard';
import { Search, Filter, Grid, List, Plus, RefreshCw } from 'lucide-react';

// Mock listings data
const mockListings = [
  {
    id: 'l1',
    business_name: 'Organic Baby Food Co',
    marketplace: 'Empire Flippers',
    asking_price: 1950000,
    annual_revenue: 3200000,
    annual_profit: 640000,
    valuation_multiple: 3.0,
    amazon_category: 'Baby',
    date_listed: '2024-02-15',
    listing_url: 'https://empireflippers.com/listing/12345',
    broker_name: 'Michael Chen',
    broker_company: 'Empire Flippers',
    asins_count: 32,
    fba_percentage: 100,
    business_age: 42,
    seller_account_health: 'Excellent',
    monthly_revenue: 267000,
    monthly_profit: 53400,
    isNew: true,
    priority: 4,
    tags: ['growing', 'organic', 'subscriptions']
  },
  {
    id: 'l2',
    business_name: 'Tech Accessories Hub',
    marketplace: 'FE International',
    asking_price: 2800000,
    annual_revenue: 4200000,
    annual_profit: 1050000,
    valuation_multiple: 2.7,
    amazon_category: 'Electronics',
    date_listed: '2024-02-12',
    listing_url: 'https://feinternational.com/listing/67890',
    broker_name: 'Sarah Williams',
    broker_company: 'FE International',
    asins_count: 156,
    fba_percentage: 85,
    business_age: 67,
    seller_account_health: 'Excellent',
    monthly_revenue: 350000,
    monthly_profit: 87500,
    isNew: false,
    priority: 5,
    tags: ['established', 'high-margin', 'diversified']
  },
  {
    id: 'l3',
    business_name: 'Eco-Friendly Home Solutions',
    marketplace: 'Quiet Light',
    asking_price: 3200000,
    annual_revenue: 5100000,
    annual_profit: 1275000,
    valuation_multiple: 2.5,
    amazon_category: 'Home & Garden',
    date_listed: '2024-02-10',
    listing_url: 'https://quietlight.com/listing/54321',
    broker_name: 'David Brown',
    broker_company: 'Quiet Light',
    asins_count: 89,
    fba_percentage: 95,
    business_age: 54,
    seller_account_health: 'Very Good',
    monthly_revenue: 425000,
    monthly_profit: 106250,
    isNew: false,
    priority: 3,
    tags: ['eco-friendly', 'trending', 'seasonal']
  },
  {
    id: 'l4',
    business_name: 'Premium Fitness Gear',
    marketplace: 'Website Closers',
    asking_price: 4100000,
    annual_revenue: 6800000,
    annual_profit: 1700000,
    valuation_multiple: 2.4,
    amazon_category: 'Sports & Outdoors',
    date_listed: '2024-02-08',
    listing_url: 'https://websiteclosers.com/listing/98765',
    broker_name: 'Jennifer Davis',
    broker_company: 'Website Closers',
    asins_count: 124,
    fba_percentage: 90,
    business_age: 78,
    seller_account_health: 'Excellent',
    monthly_revenue: 567000,
    monthly_profit: 141750,
    isNew: false,
    priority: 4,
    tags: ['premium', 'fitness-trend', 'brand-strong']
  },
  {
    id: 'l5',
    business_name: 'Luxury Pet Accessories',
    marketplace: 'Empire Flippers',
    asking_price: 1650000,
    annual_revenue: 2750000,
    annual_profit: 550000,
    valuation_multiple: 3.0,
    amazon_category: 'Pet Supplies',
    date_listed: '2024-02-14',
    listing_url: 'https://empireflippers.com/listing/11111',
    broker_name: 'Robert Taylor',
    broker_company: 'Empire Flippers',
    asins_count: 78,
    fba_percentage: 100,
    business_age: 36,
    seller_account_health: 'Excellent',
    monthly_revenue: 229000,
    monthly_profit: 45800,
    isNew: true,
    priority: 3,
    tags: ['luxury', 'pet-trend', 'high-aov']
  }
];

function ListingsFeed() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState(mockListings);
  const [selectedListings, setSelectedListings] = useState([]);

  const filteredListings = listings.filter(listing => 
    listing.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.amazon_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.marketplace.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToPipeline = (listingId) => {
    console.log('Adding listing to pipeline:', listingId);
    // Here you would typically make an API call to convert listing to deal
  };

  const handleBulkAction = (action) => {
    console.log('Bulk action:', action, 'on listings:', selectedListings);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Market Listings</h1>
                <p className="text-gray-600 dark:text-gray-400">Browse and analyze Amazon FBA businesses for sale</p>
              </div>

              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Feed
                </button>
                <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Listing
                </button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search businesses, categories, brokers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-indigo-200`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </button>

                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <ListingsFilters onFiltersChange={(filters) => console.log('Filters:', filters)} />
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedListings.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-800 dark:text-indigo-200">
                    {selectedListings.length} listing{selectedListings.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleBulkAction('addToPipeline')}
                      className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                    >
                      Add to Pipeline
                    </button>
                    <button 
                      onClick={() => handleBulkAction('compare')}
                      className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Listings Display */}
            {viewMode === 'table' ? (
              <ListingsTable 
                listings={filteredListings} 
                selectedListings={selectedListings}
                onSelectionChange={setSelectedListings}
                onAddToPipeline={handleAddToPipeline}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    onAddToPipeline={handleAddToPipeline}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No listings found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search criteria or refresh the feed
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ListingsFeed;