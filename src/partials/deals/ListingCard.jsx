import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, Building2, Calendar, DollarSign, TrendingUp, ImageIcon, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { getFallbackImage } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';

function ListingCard({ listing, onAddToPipeline, onDelete, onListingClick }) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      case 'live': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'under_offer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'sold': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'offline': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getMarketplaceColor = (marketplace) => {
    switch (marketplace) {
      case 'Empire Flippers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'FE International': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Quiet Light': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Website Closers': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(listing.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {onListingClick ? (
              <button
                onClick={() => onListingClick(listing.id)}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left"
              >
                {listing.business_name || listing.name}
              </button>
            ) : (
              <Link 
                to={`/listings/${listing.id}`}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
              >
                {listing.business_name || listing.name}
              </Link>
            )}
            {listing.isNew && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                New
              </span>
            )}
            {listing.duplicate_count > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full flex items-center">
                <Copy className="w-3 h-3 mr-1" />
                {listing.duplicate_count + 1} similar
              </span>
            )}
            {listing.is_primary_listing === false && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Duplicate
              </span>
            )}
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
            <Building2 className="w-4 h-4 mr-1" />
            <span>{listing.amazon_category || listing.industry || 'Unknown Category'}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(listing.listing_status || 'live')}`}>
          {listing.listing_status === 'under_offer' ? 'Under Offer' : 
           listing.listing_status === 'live' ? 'Live' : 
           listing.listing_status === 'sold' ? 'Sold' : 
           listing.listing_status === 'offline' ? 'Offline' : 
           listing.listing_status === 'pending' ? 'Pending' : 'Live'}
        </span>
      </div>

      {/* Product Image */}
      <div className="mb-4">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.business_name || listing.name}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = getFallbackImage();
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Marketplace Badge */}
      <div className="mb-4">
        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getMarketplaceColor(listing.marketplace || listing.source)}`}>
          {listing.marketplace || listing.source || 'Unknown'}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3">
          <div className="flex items-center text-sm text-green-700 dark:text-green-300 mb-1">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>Asking Price</span>
          </div>
          <div className="text-lg font-bold text-green-900 dark:text-green-100">
            {listing.asking_price ? formatCurrency(listing.asking_price) : 'TBD'}
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
          <div className="flex items-center text-sm text-blue-700 dark:text-blue-300 mb-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Multiple</span>
          </div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {listing.valuation_multiple ? formatMultiple(listing.valuation_multiple) : 'TBD'}
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Annual Revenue</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {listing.annual_revenue ? formatCurrency(listing.annual_revenue) : 'TBD'}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Annual Profit</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {listing.annual_profit ? formatCurrency(listing.annual_profit) : 'TBD'}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {listing.monthly_revenue ? formatCurrency(listing.monthly_revenue) : 'TBD'}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Monthly Profit</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {listing.monthly_profit ? formatCurrency(listing.monthly_profit) : 'TBD'}
            </div>
          </div>
        </div>
      </div>


      {/* Tags */}
      {listing.tags && listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {listing.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              #{tag}
            </span>
          ))}
          {listing.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              +{listing.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Listed {listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 
                           new Date(listing.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAddToPipeline(listing.id)}
            className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to Pipeline
          </button>
          {(listing.listing_url || listing.original_url) && (
            <a
              href={listing.listing_url || listing.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {onDelete && user && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 text-sm"
              title="Delete listing"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn bg-red-600 text-white hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingCard;