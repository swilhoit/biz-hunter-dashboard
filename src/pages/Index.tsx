
import React, { useState, useMemo } from 'react';
import { BusinessCard } from '@/components/BusinessCard';
import { DashboardFilters } from '@/components/DashboardFilters';
import { mockListings } from '@/data/mockListings';
import { Building2, TrendingUp, DollarSign, Globe } from 'lucide-react';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  // Extract unique categories and sources for filters
  const categories = useMemo(() => {
    return Array.from(new Set(mockListings.map(listing => listing.industry))).sort();
  }, []);

  const sources = useMemo(() => {
    return Array.from(new Set(mockListings.map(listing => listing.source))).sort();
  }, []);

  // Filter listings based on current filters
  const filteredListings = useMemo(() => {
    return mockListings.filter(listing => {
      const matchesSearch = searchTerm === '' || 
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.industry.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || listing.industry === selectedCategory;
      const matchesSource = selectedSource === 'all' || listing.source === selectedSource;

      let matchesPrice = true;
      if (priceRange !== 'all') {
        const price = listing.askingPrice;
        switch (priceRange) {
          case '0-100k':
            matchesPrice = price < 100000;
            break;
          case '100k-500k':
            matchesPrice = price >= 100000 && price < 500000;
            break;
          case '500k-1m':
            matchesPrice = price >= 500000 && price < 1000000;
            break;
          case '1m-5m':
            matchesPrice = price >= 1000000 && price < 5000000;
            break;
          case '5m+':
            matchesPrice = price >= 5000000;
            break;
        }
      }

      return matchesSearch && matchesCategory && matchesSource && matchesPrice;
    });
  }, [searchTerm, selectedCategory, selectedSource, priceRange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSource('all');
    setPriceRange('all');
  };

  // Calculate summary statistics
  const totalListings = mockListings.length;
  const totalValue = mockListings.reduce((sum, listing) => sum + listing.askingPrice, 0);
  const avgPrice = totalValue / totalListings;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Business Acquisition Directory
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover profitable businesses for sale across all major acquisition platforms. 
              Find your next investment opportunity with comprehensive listings and detailed metrics.
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center">
              <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{totalListings}</div>
              <div className="text-sm text-blue-700">Active Listings</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-green-700">Total Value</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(avgPrice)}</div>
              <div className="text-sm text-purple-700">Average Price</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-center">
              <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{sources.length}</div>
              <div className="text-sm text-orange-700">Platforms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <DashboardFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          onClearFilters={handleClearFilters}
          categories={categories}
          sources={sources}
        />

        {/* Results */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {filteredListings.length} Business{filteredListings.length !== 1 ? 'es' : ''} Found
            </h2>
            <div className="text-sm text-gray-500">
              Showing {filteredListings.length} of {totalListings} listings
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or clearing filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <BusinessCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
