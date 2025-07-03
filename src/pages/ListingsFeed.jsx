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
import { DuplicateManager } from '../components/DuplicateManager';
import ScrapingResultsModal from '../components/ScrapingResultsModal';
import ScrapingProgressModal from '../components/ScrapingProgressModal';
import { Search, Filter, Grid, List, Plus, RefreshCw, Loader2, Download, Brain, AlertTriangle, Eye, EyeOff, Settings, ChevronDown } from 'lucide-react';

function ListingsFeed() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListings, setSelectedListings] = useState([]);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [selectedSites, setSelectedSites] = useState(['quietlight', 'bizbuysell']);

  // Fetch real business listings data
  const { 
    data: listings = [], 
    isLoading, 
    error, 
    refetch 
  } = useBusinessListings({ hideDuplicates });
  
  // Log listings data when it changes
  React.useEffect(() => {
    console.log('========================================');
    console.log('📊 [LISTINGS FEED] Listings data updated:');
    console.log(`  Total listings: ${listings.length}`);
    console.log(`  Loading: ${isLoading}`);
    console.log(`  Error: ${error ? error.message : 'None'}`);
    if (listings.length > 0) {
      console.log('  First 3 listings:');
      listings.slice(0, 3).forEach((listing, idx) => {
        console.log(`    ${idx + 1}. ${listing.name} - $${listing.asking_price?.toLocaleString() || 'N/A'} - ${listing.source}`);
      });
    }
    console.log('========================================');
  }, [listings, isLoading, error]);
  
  const addToPipelineMutation = useAddToPipeline();
  const { showSuccess, showError } = useToast();
  const { 
    checkForNewListings, 
    checkForNewListingsWithProgress, 
    isChecking, 
    progress, 
    currentScraper, 
    lastResults, 
    clearResults,
    showProgressModal,
    currentMethod,
    handleProgressModalClose,
    handleProgressModalComplete
  } = useManualScraping();
  const { user } = useAuth();

  // Close admin dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAdminDropdown && !event.target.closest('.admin-dropdown')) {
        setShowAdminDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminDropdown]);

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
    } else if (action === 'delete') {
      if (!user) {
        showError('You must be logged in to delete listings');
        return;
      }
      
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedListings.length} listing${selectedListings.length > 1 ? 's' : ''}? This action cannot be undone.`);
      if (!confirmDelete) return;
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const listingId of selectedListings) {
        try {
          const response = await fetch(`http://localhost:3001/api/listings/${listingId}?userId=${user.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('❌ Failed to delete listing:', listingId, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showSuccess(`Successfully deleted ${successCount} listing${successCount > 1 ? 's' : ''}`);
        refetch(); // Refresh the listings
      }
      if (errorCount > 0) {
        showError(`Failed to delete ${errorCount} listing${errorCount > 1 ? 's' : ''}`);
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
    console.log(`🚀 [LISTINGS FEED] Starting ${method} scraping...`);
    checkForNewListings((results) => {
      console.log('✅ [LISTINGS FEED] Scraping completed, refetching listings...');
      // Refetch listings after scraping completes
      refetch();
      // Show results modal
      if (results) {
        setShowResultsModal(true);
      }
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
                {/* Admin Dropdown */}
                <div className="relative admin-dropdown">
                  <button 
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className="btn bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  
                  {showAdminDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        {/* Traditional Scraper Button */}
                        <button 
                          onClick={() => {
                            checkForNewListingsWithProgress('traditional', selectedSites);
                            setShowAdminDropdown(false);
                          }}
                          disabled={isChecking || isLoading}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isChecking && currentScraper && !currentScraper.includes('AI') ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-3 animate-spin text-violet-600" />
                              In Progress...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-3 text-violet-600" />
                              Check New Listings (Traditional)
                            </>
                          )}
                        </button>
                        
                        {/* ScrapeGraph AI Button */}
                        <button 
                          onClick={() => {
                            checkForNewListingsWithProgress('scrapegraph', selectedSites);
                            setShowAdminDropdown(false);
                          }}
                          disabled={isChecking || isLoading}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isChecking && currentScraper && currentScraper.includes('AI') ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-3 animate-spin text-emerald-600" />
                              AI Scraping...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-3 text-emerald-600" />
                              Check New Listings (AI-Powered)
                            </>
                          )}
                        </button>
                        
                        <div className="my-1 border-t border-gray-200 dark:border-gray-600"></div>
                        
                        {/* Duplicate Management */}
                        <button 
                          onClick={() => {
                            setShowDuplicateManager(true);
                            setShowAdminDropdown(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <AlertTriangle className="w-4 h-4 mr-3 text-amber-600" />
                          Manage Duplicates
                        </button>
                        
                        <button 
                          onClick={() => {
                            setHideDuplicates(!hideDuplicates);
                            setShowAdminDropdown(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          {hideDuplicates ? (
                            <>
                              <Eye className="w-4 h-4 mr-3 text-green-600" />
                              Show All Listings
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-3 text-gray-600" />
                              Hide Duplicate Listings
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
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
                    {hideDuplicates && <span className="ml-1 text-xs">(duplicates hidden)</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Scraping Status Indicator */}
            {isChecking && (
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin text-violet-600 dark:text-violet-400" />
                  <div>
                    <span className="text-violet-800 dark:text-violet-200 font-medium">
                      Scraping in progress...
                    </span>
                    {currentScraper && (
                      <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                        {currentScraper}
                      </p>
                    )}
                  </div>
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
                    {user && (
                      <button 
                        onClick={() => handleBulkAction('delete')}
                        className="btn bg-red-600 text-white hover:bg-red-700 text-sm"
                      >
                        Delete Selected
                      </button>
                    )}
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
      
      {/* Duplicate Manager Modal */}
      <DuplicateManager 
        isOpen={showDuplicateManager}
        onClose={() => setShowDuplicateManager(false)}
      />
      
      {/* Scraping Results Modal */}
      <ScrapingResultsModal 
        isOpen={showResultsModal}
        onClose={() => {
          setShowResultsModal(false);
          clearResults();
        }}
        results={lastResults}
      />
      
      {/* Scraping Progress Modal */}
      <ScrapingProgressModal 
        isOpen={showProgressModal}
        onClose={handleProgressModalClose}
        method={currentMethod}
        selectedSites={selectedSites}
        onSitesChange={setSelectedSites}
        onComplete={(results) => {
          handleProgressModalComplete(results);
          // Refresh listings after scraping completes
          refetch();
        }}
      />
    </div>
  );
}

export default ListingsFeed;