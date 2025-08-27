import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, Building2, Calendar, DollarSign, MapPin, Star } from 'lucide-react';

function ListingCard({ listing, onClick, onAddToPipeline, showActions = true }) {
  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatMultiple = (multiple) => {
    return `${multiple.toFixed(1)}x`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'under_offer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'sold': return 'bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-300';
      case 'offline': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-300';
    }
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest('.action-button')) {
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className="bg-white dark:bg-stone-900 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Header with business name and status */}
      <div className="p-4 border-b border-gray-100 dark:border-stone-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 truncate">
              {listing.business_name || listing.name}
            </h3>
            <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-stone-400">
              <Building2 className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{listing.industry || 'Unknown Type'}</span>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(listing.listing_status || 'live')}`}>
              {listing.listing_status === 'under_offer' ? 'Under Offer' : 
               listing.listing_status === 'live' ? 'Live' : 
               listing.listing_status === 'sold' ? 'Sold' : 
               listing.listing_status === 'offline' ? 'Offline' : 
               listing.listing_status === 'pending' ? 'Pending' : 'Live'}
            </span>
          </div>
        </div>

        {/* Marketplace and category badges */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            {listing.marketplace || listing.source || 'Unknown'}
          </span>
          {listing.amazon_category && (
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
              {listing.amazon_category}
            </span>
          )}
          {listing.isNew && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              New
            </span>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Price</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {listing.asking_price ? formatCurrency(listing.asking_price) : 'TBD'}
            </div>
            {listing.valuation_multiple && (
              <div className="text-xs text-green-700 dark:text-green-300">
                {formatMultiple(listing.valuation_multiple)} multiple
              </div>
            )}
          </div>

          {/* Revenue */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center text-blue-600 dark:text-blue-400 mb-1">
              <Building2 className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Revenue</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {listing.annual_revenue ? formatCurrency(listing.annual_revenue) : 'TBD'}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              annual
            </div>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-stone-400">Profit:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-stone-100">
              {listing.annual_profit ? formatCurrency(listing.annual_profit) : 'TBD'}
            </span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-stone-400">
            <Calendar className="w-4 h-4 mr-1" />
            <span className="text-xs">
              {listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 
               new Date(listing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-400 rounded">
                {tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-400 rounded">
                +{listing.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-stone-800 border-t border-gray-100 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onAddToPipeline && (
                <button
                  onClick={() => onAddToPipeline(listing.id)}
                  className="action-button flex items-center px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Pipeline
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {(listing.listing_url || listing.original_url) && (
                <a
                  href={listing.listing_url || listing.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 p-1"
                  title="View Original Listing"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingCard;