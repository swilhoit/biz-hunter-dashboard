
import React, { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { BusinessCard } from '@/components/BusinessCard';
import { DashboardFilters } from '@/components/DashboardFilters';
import { mockListings } from '@/data/mockListings';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);

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

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(listing.industry);
      const matchesSource = selectedSource === 'all' || listing.source === selectedSource;
      const matchesPrice = listing.askingPrice >= priceRange[0] && listing.askingPrice <= priceRange[1];

      return matchesSearch && matchesCategory && matchesSource && matchesPrice;
    });
  }, [searchTerm, selectedCategories, selectedSource, priceRange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedSource('all');
    setPriceRange([0, 10000000]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Discover businesses for sale
          </h1>
          <p className="text-lg text-gray-600">
            Find your next investment opportunity from trusted platforms
          </p>
        </div>

        {/* Filters */}
        <DashboardFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
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
            <h2 className="text-xl font-light text-gray-900">
              {filteredListings.length} businesses found
            </h2>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-2">No businesses found</h3>
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
