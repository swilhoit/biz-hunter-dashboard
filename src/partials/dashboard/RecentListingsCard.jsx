import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, MapPin, ExternalLink } from 'lucide-react';

function RecentListingsCard() {
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['recent-listings'],
    queryFn: async () => {
      // Return clean demo data for now
      return [
        {
          id: '1',
          title: 'Established E-commerce Store',
          asking_price: 125000,
          location: 'California, USA',
          source: 'BizBuySell',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          id: '2',
          title: 'Amazon FBA Electronics Business',
          asking_price: 89000,
          location: 'Texas, USA',
          source: 'Flippa',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        },
        {
          id: '3',
          title: 'SaaS Platform with Recurring Revenue',
          asking_price: 250000,
          location: null,
          source: 'QuietLight',
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
        },
        {
          id: '4',
          title: 'Pet Supplies Drop Shipping Business',
          asking_price: 45000,
          location: 'Florida, USA',
          source: 'Empire Flippers',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
        },
        {
          id: '5',
          title: 'Health & Wellness Content Site',
          asking_price: 67000,
          location: null,
          source: 'Direct',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
      ];
    },
    refetchInterval: 300000
  });

  const formatPrice = (price) => {
    if (!price || isNaN(price) || price <= 0) return 'Contact for price';
    
    const numPrice = Math.round(Number(price));
    
    // Cap at reasonable values
    if (numPrice > 50000000) return 'Contact for price';
    if (numPrice < 1000) return 'Contact for price';
    
    if (numPrice >= 1000000) {
      return `$${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 1000) {
      return `$${(numPrice / 1000).toFixed(0)}K`;
    }
    return `$${numPrice.toLocaleString()}`;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-5">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent Listings</h2>
        <Link to="/listings" className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400">
          View All →
        </Link>
      </header>
      <div className="p-3">
        {listings && listings.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {listings.map((listing) => (
              <li key={listing.id} className="py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors">
                <Link to={`/listings/${listing.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {listing.title || 'Untitled Listing'}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatPrice(listing.asking_price)}
                        </span>
                        {listing.location && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {listing.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(listing.created_at)}
                        </span>
                      </div>
                      {listing.source && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {listing.source}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No listings found
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentListingsCard;