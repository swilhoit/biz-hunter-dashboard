import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import ListingsTable from '../partials/deals/ListingsTable';
import ListingsFilters from '../partials/deals/ListingsFilters';
import ListingCard from '../partials/deals/ListingCard';
import { useBusinessListings, useAddToPipeline } from '../hooks/useBusinessListings';
import { useManualScraping } from '../hooks/useManualScraping';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { Search, Filter, Grid, List, Plus, RefreshCw, Loader2, Download, Brain } from 'lucide-react';

function ListingsFeed() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListings, setSelectedListings] = useState([]);

  // Fetch real business listings data
  const { 
    data: listings = [], 
    isLoading, 
    error, 
    refetch 
  } = useBusinessListings();
  
  const addToPipelineMutation = useAddToPipeline();
  const { showSuccess, showError } = useToast();
  const { checkForNewListings, isChecking, progress, currentScraper } = useManualScraping();
  const { user } = useAuth();

  const filteredListings = listings.filter(listing => 
    listing.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.amazon_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.marketplace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToPipeline = async (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      try {
        const result = await addToPipelineMutation.mutateAsync(listing);
        showSuccess(`"${listing.business_name || listing.name}" added to pipeline successfully!`);
        console.log('✅ Successfully added to pipeline:', result);
      } catch (error) {
        const errorMessage = error.message || 'Failed to add listing to pipeline';
        showError(`Error: ${errorMessage}`);
        console.error('❌ Failed to add to pipeline:', error);
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (action === 'addToPipeline') {
      const selectedListingObjects = listings.filter(l => selectedListings.includes(l.id));
      let successCount = 0;
      let errorCount = 0;
      
      for (const listing of selectedListingObjects) {
        try {
          await addToPipelineMutation.mutateAsync(listing);
          successCount++;
        } catch (error) {
          console.error('❌ Failed to add listing to pipeline:', listing.id, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showSuccess(`Successfully added ${successCount} listing${successCount > 1 ? 's' : ''} to pipeline!`);
      }
      if (errorCount > 0) {
        showError(`Failed to add ${errorCount} listing${errorCount > 1 ? 's' : ''} to pipeline`);
      }
      
      setSelectedListings([]); // Clear selection after bulk action
    } else {
      console.log('Bulk action:', action, 'on listings:', selectedListings);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCheckForNewListings = (method = 'traditional') => {
    checkForNewListings(() => {
      // Refetch listings after scraping completes
      refetch();
    }, method);
  };

  const handleDeleteListing = async (listingId) => {
    if (!user) {
      showError('You must be logged in to delete listings');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/listings/${listingId}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Listing deleted successfully');
        refetch(); // Refresh the listings
      } else {
        showError(result.message || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      showError('Failed to delete listing');
    }
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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Amazon FBA Feed</h1>
                <p className="text-gray-600 dark:text-gray-400">Curated Amazon FBA businesses ready for acquisition</p>
              </div>

              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Traditional Scraper Button */}
                <button 
                  onClick={() => handleCheckForNewListings('traditional')}
                  disabled={isChecking || isLoading}
                  className="btn bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Use traditional HTML scrapers (ScraperAPI)"
                >
                  {isChecking && currentScraper && !currentScraper.includes('AI') ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {currentScraper ? `${currentScraper}... ${progress}%` : 'Checking...'}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Check (Traditional)
                    </>
                  )}
                </button>
                
                {/* ScrapeGraph AI Button */}
                <button 
                  onClick={() => handleCheckForNewListings('scrapegraph')}
                  disabled={isChecking || isLoading}
                  className="btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Use AI-powered scraping (ScrapeGraph)"
                >
                  {isChecking && currentScraper && currentScraper.includes('AI') ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {currentScraper ? `${currentScraper}... ${progress}%` : 'AI Scraping...'}
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Check (AI-Powered)
                    </>
                  )}
                </button>
                
                <button 
                  onClick={handleRefresh}
                  disabled={isLoading || isChecking}
                  className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </button>
                <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Listing
                </button>
                
                {/* Display listing count */}
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {isLoading ? 'Loading...' : `${filteredListings.length} listings`}
                  </span>
                </div>
              </div>
            </div>

            {/* Scraping Progress Indicator */}
            {isChecking && (
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 mr-3 animate-spin text-violet-600 dark:text-violet-400" />
                    <span className="text-violet-800 dark:text-violet-200 font-medium">
                      Checking for new listings from all sources...
                    </span>
                  </div>
                  <span className="text-violet-600 dark:text-violet-400 font-semibold">
                    {progress}%
                  </span>
                </div>
                {currentScraper && (
                  <p className="text-sm text-violet-700 dark:text-violet-300 ml-8">
                    Currently checking: {currentScraper}
                  </p>
                )}
                <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-2 mt-3">
                  <div 
                    className="bg-violet-600 dark:bg-violet-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Search and Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search Amazon FBA businesses, categories, brokers..."
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

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error loading listings
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {error.message || 'Failed to load business listings. Please try again.'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <button 
                      onClick={handleRefresh}
                      className="btn btn-sm bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Loading Amazon FBA listings...
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fetching the latest Amazon FBA opportunities
                  </p>
                </div>
              </div>
            )}

            {/* Listings Display */}
            {!isLoading && !error && (
              <>
                {viewMode === 'table' ? (
                  <ListingsTable 
                    listings={filteredListings} 
                    selectedListings={selectedListings}
                    onSelectionChange={setSelectedListings}
                    onAddToPipeline={handleAddToPipeline}
                    onDelete={handleDeleteListing}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map(listing => (
                      <ListingCard 
                        key={listing.id} 
                        listing={listing}
                        onAddToPipeline={handleAddToPipeline}
                        onDelete={handleDeleteListing}
                      />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {filteredListings.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No listings found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'Try adjusting your search criteria' : 'No Amazon FBA listings available at the moment'}
                    </p>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-4 btn bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ListingsFeed;