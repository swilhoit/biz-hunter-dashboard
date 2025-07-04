import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { useBusinessListing, useAddToPipeline } from '../hooks/useBusinessListings';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Plus, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Package,
  Star,
  Users,
  Globe,
  Loader2 
} from 'lucide-react';

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  
  const { 
    data: listing, 
    isLoading, 
    error 
  } = useBusinessListing(id);
  
  const addToPipelineMutation = useAddToPipeline();
  const { showSuccess, showError } = useToast();
  

  const formatCurrency = (amount) => {
    if (!amount) return 'TBD';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatMultiple = (multiple) => {
    return multiple ? `${multiple.toFixed(1)}x` : 'TBD';
  };

  const handleAddToPipeline = async () => {
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

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Loading listing details...
                  </h3>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                    Error loading listing
                  </h3>
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    {error.message || 'Failed to load listing details'}
                  </p>
                  <button 
                    onClick={() => navigate('/listings')}
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Back to Listings
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Listing not found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The listing you're looking for doesn't exist or has been removed.
                </p>
                <button 
                  onClick={() => navigate('/listings')}
                  className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Back to Listings
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/listings')}
                    className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                      {listing.business_name || listing.name}
                    </h1>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {listing.marketplace || listing.source}
                      </span>
                      {listing.isNew && (
                        <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          New Listing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {(listing.listing_url || listing.original_url) && (
                    <a
                      href={listing.listing_url || listing.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Original
                    </a>
                  )}
                  <button
                    onClick={handleAddToPipeline}
                    disabled={addToPipelineMutation.isLoading}
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {addToPipelineMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add to Pipeline
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Key Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Key Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                      <div className="flex items-center text-green-700 dark:text-green-300 mb-2">
                        <DollarSign className="w-5 h-5 mr-2" />
                        <span className="font-medium">Asking Price</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(listing.asking_price)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                      <div className="flex items-center text-blue-700 dark:text-blue-300 mb-2">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        <span className="font-medium">Valuation Multiple</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatMultiple(listing.valuation_multiple)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Financial Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Annual Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.annual_revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Profit:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.annual_profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Monthly Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.monthly_revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Profit:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.monthly_profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amazon Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Amazon Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Package className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {Array.isArray(listing.asin_list) ? listing.asin_list.length : 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ASINs</div>
                    </div>
                    
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {listing.fba_percentage || 'Unknown'}%
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">FBA</div>
                    </div>
                    
                    <div className="text-center">
                      <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {listing.seller_account_health || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Account Health</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {listing.description && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Business Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Business Details</h2>
                  <div className="space-y-4">
                    
                    <div className="flex items-start">
                      <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Industry</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {listing.amazon_category || listing.industry || 'Not specified'}
                        </div>
                      </div>
                    </div>
                    
                    {listing.location && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{listing.location}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Business Age</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {listing.business_age ? `${Math.floor(listing.business_age / 12)} years` : 'Not specified'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Listed Date</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {listing.date_listed ? 
                            new Date(listing.date_listed).toLocaleDateString() : 
                            new Date(listing.created_at).toLocaleDateString()
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Broker/Source</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {listing.broker_company || listing.source || 'Direct'}
                      </div>
                    </div>
                    
                    {listing.broker_name && (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Broker Name</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{listing.broker_name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ListingDetail;