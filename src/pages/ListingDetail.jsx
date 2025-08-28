import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../partials/Header';
import Footer from '../partials/Footer';
import { useBusinessListing } from '../hooks/useBusinessListings';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
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
  Loader2,
  Brain,
  RefreshCw,
  AlertTriangle,
  Target,
  Lightbulb
} from 'lucide-react';
import { dealsAdapter } from '../lib/database-adapter';
import AIAnalysisService from '../services/AIAnalysisService';

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  
  const { 
    data: listing, 
    isLoading, 
    error 
  } = useBusinessListing(id);
  
  // const addToPipelineMutation = useAddToPipeline();
  const { showSuccess, showError } = useToast();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [isAddingToPipeline, setIsAddingToPipeline] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const handleAddToPipeline = async () => {
    if (!isAuthenticated || !user) {
      showError('Please sign in to add deals to your pipeline');
      navigate('/signin');
      return;
    }
    
    setIsAddingToPipeline(true);
    try {
      // Convert listing to deal format
      const dealData = {
        userId: user.uid,
        business_name: listing.business_name || listing.name,
        status: 'prospecting',
        source: 'marketplace',
        
        // Financial Information
        asking_price: listing.asking_price,
        annual_revenue: listing.annual_revenue,
        annual_profit: listing.annual_profit,
        monthly_revenue: listing.monthly_revenue,
        monthly_profit: listing.monthly_profit,
        valuation_multiple: listing.valuation_multiple || listing.multiple,
        profit_margin: listing.profit_margin,
        
        // Business Details
        business_age_years: listing.business_age_years,
        employee_count: listing.employee_count,
        inventory_value: listing.inventory_value,
        date_listed: listing.date_listed || listing.created_at,
        listing_url: listing.listing_url || listing.original_url,
        website_url: listing.website_url,
        description: listing.description,
        
        // Location
        city: listing.city,
        state: listing.state,
        country: listing.country,
        
        // Industry
        industry: listing.industry,
        sub_industry: listing.sub_industry,
        
        // Amazon/E-commerce Specific
        amazon_store_name: listing.amazon_store_name,
        amazon_category: listing.amazon_category,
        fba_percentage: listing.fba_percentage,
        sku_count: listing.sku_count,
        asin_list: listing.asin_list,
        
        // Original listing reference
        original_listing_id: listing.id,
        marketplace: listing.marketplace || listing.source,
      };
      
      const result = await dealsAdapter.createDeal(dealData);
      
      if (result.error) {
        throw result.error;
      }
      
      showSuccess('Listing added to your deal pipeline!');
      navigate(`/deals`);
    } catch (error) {
      console.error('Error adding to pipeline:', error);
      showError('Failed to add listing to pipeline');
    } finally {
      setIsAddingToPipeline(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!listing) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowAnalysis(true);
    
    try {
      const aiService = new AIAnalysisService();
      const dealData = {
        id: listing.id,
        business_name: listing.business_name || listing.name,
        category: listing.category,
        industry: listing.industry,
        asking_price: listing.asking_price,
        annual_revenue: listing.annual_revenue,
        annual_profit: listing.annual_profit,
        monthly_revenue: listing.monthly_revenue,
        monthly_profit: listing.monthly_profit,
        business_age: listing.business_age_years,
        location: `${listing.city || ''}, ${listing.state || ''}`.trim().replace(/^,\s*/, ''),
        description: listing.description
      };
      
      const report = await aiService.generateDealAnalysis(dealData);
      setAiAnalysis(report);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setAnalysisError(error.message || 'Failed to generate analysis');
      showError('Failed to generate AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  

  const formatCurrency = (amount) => {
    if (!amount) return 'TBD';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatMultiple = (multiple) => {
    return multiple ? `${multiple.toFixed(1)}x` : 'TBD';
  };


  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <Header />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-stone-100 mb-2">
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
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <Header />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
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
                    onClick={() => navigate('/feed')}
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
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <Header />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Listing not found
                </h3>
                <p className="text-gray-600 dark:text-stone-400 mb-4">
                  The listing you're looking for doesn't exist or has been removed.
                </p>
                <button 
                  onClick={() => navigate('/feed')}
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
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <Header />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center w-full">
                  <button
                    onClick={() => navigate('/feed')}
                    className="mr-3 sm:mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700 flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl text-gray-800 dark:text-stone-100 font-bold break-words">
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
                
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleAddToPipeline}
                    disabled={isAddingToPipeline || authLoading}
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isAddingToPipeline ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Pipeline
                      </>
                    )}
                  </button>
                  {(listing.listing_url || listing.original_url) && (
                    <a
                      href={listing.listing_url || listing.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-stone-700 dark:text-stone-200 whitespace-nowrap"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Original
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                
                {/* Key Metrics */}
                <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-stone-100 mb-4 sm:mb-6">Key Metrics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-stone-100 mb-4 sm:mb-6">Financial Overview</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-3">Annual Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-stone-400">Revenue:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.annual_revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-stone-400">Profit:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.annual_profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-3">Monthly Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-stone-400">Revenue:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.monthly_revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-stone-400">Profit:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(listing.monthly_profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-stone-100 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                      AI Analysis
                    </h2>
                    {!showAnalysis ? (
                      <button
                        onClick={handleGenerateAnalysis}
                        disabled={isAnalyzing}
                        className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Generate Analysis
                          </>
                        )}
                      </button>
                    ) : aiAnalysis && (
                      <button
                        onClick={handleGenerateAnalysis}
                        disabled={isAnalyzing}
                        className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-stone-700 dark:text-stone-200 text-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </button>
                    )}
                  </div>

                  {!showAnalysis && !isAnalyzing && (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Get AI-powered insights about this business opportunity
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Our AI will analyze market conditions, competition, and growth potential
                      </p>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Generating comprehensive analysis...
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        This may take a few moments
                      </p>
                    </div>
                  )}

                  {analysisError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        <p className="text-red-800 dark:text-red-200">
                          {analysisError}
                        </p>
                      </div>
                    </div>
                  )}

                  {aiAnalysis && showAnalysis && (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Executive Summary</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {aiAnalysis.summary}
                        </p>
                      </div>

                      {/* Opportunity Score */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Opportunity Score</h3>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                              {aiAnalysis.opportunityScore.overall}/100
                            </span>
                            <Target className="w-6 h-6 text-indigo-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {aiAnalysis.opportunityScore.reasoning}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Financial:</span>
                              <span className="font-medium">{aiAnalysis.opportunityScore.breakdown.financial}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Market:</span>
                              <span className="font-medium">{aiAnalysis.opportunityScore.breakdown.market}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Growth:</span>
                              <span className="font-medium">{aiAnalysis.opportunityScore.breakdown.growth}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Risk:</span>
                              <span className="font-medium">{aiAnalysis.opportunityScore.breakdown.risk}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Insights Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Growth Opportunities */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                            Growth Opportunities
                          </h3>
                          <ul className="space-y-1">
                            {aiAnalysis.growthOpportunities.slice(0, 3).map((opportunity, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {opportunity}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Risk Factors */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
                            Risk Factors
                          </h3>
                          <ul className="space-y-1">
                            {aiAnalysis.riskFactors.slice(0, 3).map((risk, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                                <span className="text-amber-500 mr-2">•</span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-1 text-indigo-600" />
                          Key Recommendations
                        </h3>
                        <ul className="space-y-1">
                          {aiAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-indigo-500 mr-2">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amazon Metrics - Hidden until we have real data */}
                {/* Note: Amazon metrics will be shown once the listing is moved to the deal pipeline
                    and we start gathering detailed Amazon-specific information */}

                {/* Description */}
                {listing.description && (
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</h2>
                    <p className="text-gray-600 dark:text-stone-400 leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Business Details */}
                <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Business Details</h2>
                  <div className="space-y-4">
                    
                    <div className="flex items-start">
                      <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Industry</div>
                        <div className="text-sm text-gray-600 dark:text-stone-400">
                          {listing.amazon_category || listing.industry || 'Not specified'}
                        </div>
                      </div>
                    </div>
                    
                    {listing.location && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</div>
                          <div className="text-sm text-gray-600 dark:text-stone-400">{listing.location}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Business Age</div>
                        <div className="text-sm text-gray-600 dark:text-stone-400">
                          {listing.business_age ? `${Math.floor(listing.business_age / 12)} years` : 'Not specified'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Listed Date</div>
                        <div className="text-sm text-gray-600 dark:text-stone-400">
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
                <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Broker/Source</div>
                      <div className="text-sm text-gray-600 dark:text-stone-400">
                        {listing.broker_company || listing.source || 'Direct'}
                      </div>
                    </div>
                    
                    {listing.broker_name && (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Broker Name</div>
                        <div className="text-sm text-gray-600 dark:text-stone-400">{listing.broker_name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-stone-400 rounded-full"
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
        <Footer />
      </div>
    </div>
  );
}

export default ListingDetail;