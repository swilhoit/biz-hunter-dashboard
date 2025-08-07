import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../partials/Header';
import ListingsTable from '../partials/deals/ListingsTable';
import { useBusinessListings } from '../hooks/useBusinessListings';
import { ArrowRight, TrendingUp, Search, DollarSign, Loader2 } from 'lucide-react';

function Homepage() {
  const navigate = useNavigate();
  
  // Fetch recent listings for preview
  const { 
    listings: recentListings = [],
    totalCount,
    loading: isLoading,
  } = useBusinessListings({ 
    limit: 10,
    sortBy: 'created_at',
    sortDirection: 'desc'
  });

  const stats = [
    { label: 'Active Listings', value: totalCount ? totalCount.toLocaleString() : '0', icon: TrendingUp },
    { label: 'Average Deal Size', value: '$1.2M', icon: DollarSign },
    { label: 'New This Week', value: '156', icon: Search },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header />
      <main className="grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-orange-50 to-white dark:from-stone-900 dark:to-stone-800 py-20">
          <div className="px-4 sm:px-6 lg:px-8 max-w-9xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-stone-100 mb-6">
                Find Your Next
                <span className="text-orange-600 dark:text-orange-500"> E-Commerce </span>
                Acquisition
              </h1>
              <p className="text-xl text-gray-600 dark:text-stone-400 mb-8">
                Discover vetted e-commerce businesses from trusted marketplaces. 
                AI-powered insights to help you make smarter acquisition decisions.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/feed')}
                  className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg font-medium shadow-lg"
                >
                  Browse All Listings
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white dark:bg-stone-900 border-b border-gray-200 dark:border-stone-700">
          <div className="px-4 sm:px-6 lg:px-8 max-w-9xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3">
                      <Icon className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-stone-100">{stat.value}</div>
                    <div className="text-gray-600 dark:text-stone-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent Listings Section */}
        <section className="py-16 bg-stone-50 dark:bg-stone-800">
          <div className="px-4 sm:px-6 lg:px-8 max-w-9xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-stone-100 mb-4">
                <span className="text-orange-600 dark:text-orange-500">Fresh</span> Listings Just Added
              </h2>
              <p className="text-lg text-gray-600 dark:text-stone-400">
                Live feed of the newest e-commerce opportunities
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
                <p className="text-gray-600 dark:text-stone-400">Loading fresh listings...</p>
              </div>
            ) : recentListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-stone-400 mb-4">No listings available at the moment</p>
                <Link
                  to="/feed"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Check back soon for new opportunities
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-12">
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 overflow-hidden">
                    <ListingsTable
                      listings={recentListings}
                      selectedListings={[]}
                      onListingClick={(listingId) => navigate(`/feed/${listingId}`)}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    to="/feed"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 dark:bg-green-800 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-900 transition-all transform hover:scale-105 text-lg font-medium shadow-lg"
                  >
                    View All {totalCount || recentListings.length} Listings
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-200 dark:bg-gradient-to-br dark:from-stone-800 dark:to-stone-900">
          <div className="px-4 sm:px-6 lg:px-8 max-w-9xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6">
              Ready to Find Your Next Business?
            </h2>
            <p className="text-xl text-gray-700 dark:text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of buyers who use our platform to discover and analyze 
              profitable e-commerce acquisitions.
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="px-8 py-4 bg-white dark:bg-stone-700 text-orange-600 dark:text-orange-500 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-stone-600 transition-all transform hover:scale-105 text-lg inline-flex items-center gap-2 shadow-lg"
            >
              Start Browsing Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Homepage;