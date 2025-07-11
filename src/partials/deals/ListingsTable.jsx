import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, Building2, Calendar, DollarSign, ImageIcon, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getFallbackImage } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';

function ListingsTable({ listings, selectedListings = [], onSelectionChange, onAddToPipeline, onDelete, onListingClick, sortBy, sortDirection, onSort }) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(listings.map(l => l.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectListing = (listingId) => {
    if (selectedListings.includes(listingId)) {
      onSelectionChange(selectedListings.filter(id => id !== listingId));
    } else {
      onSelectionChange([...selectedListings, listingId]);
    }
  };

  const handleDelete = async (listingId) => {
    if (!onDelete) return;
    
    setDeletingId(listingId);
    try {
      await onDelete(listingId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-indigo-600" />
      : <ChevronDown className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedListings.length === listings.length && listings.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Marketplace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => onSort && onSort('asking_price')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Price & Multiple
                  {onSort && renderSortIcon('asking_price')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => onSort && onSort('annual_revenue')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Revenue & Profit
                  {onSort && renderSortIcon('annual_revenue')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                YoY Trend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => onSort && onSort('created_at')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Listed
                  {onSort && renderSortIcon('created_at')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedListings.includes(listing.id)}
                    onChange={() => handleSelectListing(listing.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="flex items-center">
                        {onListingClick ? (
                          <button
                            onClick={() => onListingClick(listing.id)}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                          >
                            {listing.business_name || listing.name}
                          </button>
                        ) : (
                          <Link 
                            to={`/listings/${listing.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {listing.business_name || listing.name}
                          </Link>
                        )}
                        {listing.isNew && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Building2 className="w-4 h-4 mr-1" />
                        {listing.amazon_category || listing.industry || 'Unknown Category'}
                      </div>
                      {listing.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {listing.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              {tag}
                            </span>
                          ))}
                          {listing.tags.length > 2 && (
                            <span className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              +{listing.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{listing.marketplace || listing.source || 'Unknown'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{listing.broker_name || listing.broker_company || 'Direct'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {listing.asking_price ? formatCurrency(listing.asking_price) : 'Price TBD'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {listing.valuation_multiple ? `${formatMultiple(listing.valuation_multiple)} multiple` : 'Multiple TBD'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    Rev: {listing.annual_revenue ? formatCurrency(listing.annual_revenue) : 'TBD'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Profit: {listing.annual_profit ? formatCurrency(listing.annual_profit) : 'TBD'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {listing.yoy_trend_percent !== null && listing.yoy_trend_percent !== undefined ? (
                    <div className={`flex items-center text-sm font-medium ${
                      listing.yoy_trend_percent > 0 ? 'text-green-600 dark:text-green-400' : 
                      listing.yoy_trend_percent < 0 ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {listing.yoy_trend_percent > 0 && '↑'}
                      {listing.yoy_trend_percent < 0 && '↓'}
                      {listing.yoy_trend_percent === 0 && '→'}
                      <span className="ml-1">{Math.abs(listing.yoy_trend_percent)}%</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 dark:text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    {listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 
                     new Date(listing.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {listing.business_age ? `${Math.floor(listing.business_age / 12)} years old` : 'Age unknown'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(listing.listing_status || 'live')}`}>
                    {listing.listing_status === 'under_offer' ? 'Under Offer' : 
                     listing.listing_status === 'live' ? 'Live' : 
                     listing.listing_status === 'sold' ? 'Sold' : 
                     listing.listing_status === 'offline' ? 'Offline' : 
                     listing.listing_status === 'pending' ? 'Pending' : 'Live'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onAddToPipeline(listing.id)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Add to Pipeline"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {(listing.listing_url || listing.original_url) && (
                      <a
                        href={listing.listing_url || listing.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="View Original Listing"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {onDelete && user && (
                      <button
                        onClick={() => setShowDeleteConfirm(listing.id)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                onClick={() => setShowDeleteConfirm(null)}
                className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                disabled={deletingId === showDeleteConfirm}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn bg-red-600 text-white hover:bg-red-700"
                disabled={deletingId === showDeleteConfirm}
              >
                {deletingId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingsTable;