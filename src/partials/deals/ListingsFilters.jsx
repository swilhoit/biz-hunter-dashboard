import React, { useState } from 'react';
import { X } from 'lucide-react';

function ListingsFilters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    priceRange: { min: '', max: '' },
    revenueRange: { min: '', max: '' },
    categories: [],
    marketplaces: [],
    multipleRange: { min: '', max: '' },
    businessAge: { min: '', max: '' },
    fbaPercentage: { min: '' },
    listingStatus: [],
    isNew: false,
  });

  const categories = [
    'Pet Supplies', 'Home & Kitchen', 'Sports & Outdoors', 'Baby', 'Beauty', 
    'Electronics', 'Health & Personal Care', 'Toys & Games', 'Automotive', 'Books'
  ];

  const marketplaces = [
    'Empire Flippers', 'FE International', 'Quiet Light', 'Website Closers', 
    'Flippa', 'Motion Invest', 'BizBuySell'
  ];

  const listingStatuses = [
    { value: 'live', label: 'Live' },
    { value: 'under_offer', label: 'Under Offer' },
    { value: 'pending', label: 'Pending' },
    { value: 'offline', label: 'Offline' },
    { value: 'sold', label: 'Sold' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterChange = (key, value, checked) => {
    const currentArray = filters[key];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray);
  };

  const clearFilters = () => {
    const clearedFilters = {
      priceRange: { min: '', max: '' },
      revenueRange: { min: '', max: '' },
      categories: [],
      marketplaces: [],
      multipleRange: { min: '', max: '' },
      businessAge: { min: '', max: '' },
      fbaPercentage: { min: '' },
      listingStatus: [],
      isNew: false,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.values(value).some(v => v !== '');
    return value !== '' && value !== false;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Asking Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min}
              onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
              className="form-input text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max}
              onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
              className="form-input text-sm"
            />
          </div>
        </div>

        {/* Revenue Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Annual Revenue Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.revenueRange.min}
              onChange={(e) => handleFilterChange('revenueRange', { ...filters.revenueRange, min: e.target.value })}
              className="form-input text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.revenueRange.max}
              onChange={(e) => handleFilterChange('revenueRange', { ...filters.revenueRange, max: e.target.value })}
              className="form-input text-sm"
            />
          </div>
        </div>

        {/* Multiple Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valuation Multiple
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="Min"
              value={filters.multipleRange.min}
              onChange={(e) => handleFilterChange('multipleRange', { ...filters.multipleRange, min: e.target.value })}
              className="form-input text-sm"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Max"
              value={filters.multipleRange.max}
              onChange={(e) => handleFilterChange('multipleRange', { ...filters.multipleRange, max: e.target.value })}
              className="form-input text-sm"
            />
          </div>
        </div>

        {/* FBA Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min FBA %
          </label>
          <input
            type="number"
            placeholder="e.g. 80"
            value={filters.fbaPercentage.min}
            onChange={(e) => handleFilterChange('fbaPercentage', { min: e.target.value })}
            className="form-input text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amazon Categories
          </label>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {categories.map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={(e) => handleArrayFilterChange('categories', category, e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Marketplaces */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marketplaces
          </label>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {marketplaces.map(marketplace => (
              <label key={marketplace} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.marketplaces.includes(marketplace)}
                  onChange={(e) => handleArrayFilterChange('marketplaces', marketplace, e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{marketplace}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Listing Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Listing Status
          </label>
          <div className="space-y-2">
            {listingStatuses.map(status => (
              <label key={status.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.listingStatus.includes(status.value)}
                  onChange={(e) => handleArrayFilterChange('listingStatus', status.value, e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Business Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Age (months)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.businessAge.min}
              onChange={(e) => handleFilterChange('businessAge', { ...filters.businessAge, min: e.target.value })}
              className="form-input text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.businessAge.max}
              onChange={(e) => handleFilterChange('businessAge', { ...filters.businessAge, max: e.target.value })}
              className="form-input text-sm"
            />
          </div>
        </div>

        {/* Special Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Filters
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isNew}
                onChange={(e) => handleFilterChange('isNew', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">New listings only</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingsFilters;