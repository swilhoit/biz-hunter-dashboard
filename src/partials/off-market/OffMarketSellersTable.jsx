import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function OffMarketSellersTable({ sellers, loading, filters, onFilterChange, onExportContacts }) {
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSellers([]);
    } else {
      setSelectedSellers(sellers.map(seller => seller.seller_id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectSeller = (sellerId) => {
    if (selectedSellers.includes(sellerId)) {
      setSelectedSellers(selectedSellers.filter(id => id !== sellerId));
    } else {
      setSelectedSellers([...selectedSellers, sellerId]);
    }
  };

  const formatRevenue = (revenue) => {
    if (!revenue) return '$0';
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue.toFixed(0)}`;
  };

  const getContactBadge = (seller) => {
    const totalContacts = (seller.email_contacts || 0) + (seller.phone_contacts || 0) + (seller.domain_contacts || 0);
    if (totalContacts === 0) return <span className="text-xs text-gray-500">No contacts</span>;
    
    return (
      <div className="flex gap-1">
        {seller.email_contacts > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {seller.email_contacts} Email{seller.email_contacts > 1 ? 's' : ''}
          </span>
        )}
        {seller.phone_contacts > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {seller.phone_contacts} Phone{seller.phone_contacts > 1 ? 's' : ''}
          </span>
        )}
        {seller.domain_contacts > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {seller.domain_contacts} Domain{seller.domain_contacts > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Off-Market Sellers</h2>
          </div>
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading sellers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Off-Market Sellers</h2>
            
            {/* Filters */}
            <div className="flex gap-2">
              <select 
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                className="form-select text-sm"
              >
                <option value="total_est_revenue">Sort by Revenue</option>
                <option value="listings_count">Sort by Listings</option>
                <option value="seller_name">Sort by Name</option>
              </select>
              
              <select 
                value={filters.sortOrder}
                onChange={(e) => onFilterChange({ sortOrder: e.target.value })}
                className="form-select text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.isWhale}
                  onChange={(e) => onFilterChange({ isWhale: e.target.checked })}
                  className="form-checkbox"
                />
                <span className="ml-2">Whales only</span>
              </label>
              
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.hasContacts}
                  onChange={(e) => onFilterChange({ hasContacts: e.target.checked })}
                  className="form-checkbox"
                />
                <span className="ml-2">Has contacts</span>
              </label>
            </div>
          </div>
          
          {/* Bulk actions */}
          {selectedSellers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedSellers.length} seller{selectedSellers.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => onExportContacts(selectedSellers)}
                  className="btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Export Selected Contacts
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input
                        className="form-checkbox"
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Seller</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Est. Revenue</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Listings</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Contacts</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Status</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-700">
              {sellers.map((seller) => (
                <tr key={seller.seller_id}>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <label className="inline-flex">
                        <span className="sr-only">Select</span>
                        <input
                          className="form-checkbox"
                          type="checkbox"
                          checked={selectedSellers.includes(seller.seller_id)}
                          onChange={() => handleSelectSeller(seller.seller_id)}
                        />
                      </label>
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {seller.seller_name || 'Unknown Seller'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {seller.seller_url}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      {formatRevenue(seller.total_est_revenue)}
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="text-gray-800 dark:text-gray-100">
                      {seller.listings_count || 0}
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    {getContactBadge(seller)}
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {seller.is_whale && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          🐋 Whale
                        </span>
                      )}
                      {seller.storefront_parsed && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ Parsed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/off-market-seller/${seller.seller_id}`}
                        className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                      >
                        View Details
                      </Link>
                      {seller.seller_url && (
                        <a
                          href={seller.seller_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Visit Store
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {sellers.length === 0 && (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No sellers found</p>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or run the crawler to discover new sellers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OffMarketSellersTable;