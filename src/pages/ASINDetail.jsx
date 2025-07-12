import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { getProductDetailImage, getProductGalleryImages } from '../utils/asinImageUtils';
import ASINImage from '../components/ASINImage';
import { supabase } from '../lib/supabase';
import { KeywordService } from '../services/KeywordService';
import { getAmazonImageUrl } from '../utils/amazonImageUrl';
import KeywordRecommendationService from '../services/KeywordRecommendationService';
import { testJungleScoutAPI } from '../utils/explorer/junglescout';
import { ASINReviewAnalysis } from '../components/ASINReviewAnalysis';
import { BrandKeywordTracker } from '../components/BrandKeywordTracker';

// Chart components
import LineChart01 from '../charts/LineChart01';
import BarChart01 from '../charts/BarChart01';
import DoughnutChart from '../charts/DoughnutChart';

function ASINDetail() {
  const { asinId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [asinData, setAsinData] = useState(null);
  const [dealData, setDealData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  
  // Recommended keywords state
  const [recommendedKeywords, setRecommendedKeywords] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  // Keyword filters and sorting
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [minSearchVolume, setMinSearchVolume] = useState('');
  const [minRelevancy, setMinRelevancy] = useState('');
  const [sortField, setSortField] = useState('search_volume');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Keyword selection state
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [isDeletingKeywords, setIsDeletingKeywords] = useState(false);
  
  // Fetch ASIN data from Supabase
  useEffect(() => {
    const fetchASINData = async () => {
      try {
        setLoading(true);
        
        // First fetch the ASIN details
        const { data: asinResult, error: asinError } = await supabase
          .from('asins')
          .select('*')
          .eq('asin', asinId)
          .single();

        if (asinError) throw asinError;

        // Fetch deal information if this ASIN is associated with a deal
        const { data: dealAsinResult } = await supabase
          .from('deal_asins')
          .select(`
            is_primary,
            notes,
            deals (
              id,
              business_name,
              amazon_store_name
            )
          `)
          .eq('asin_id', asinResult.id)
          .single();

        // Fetch historical data for the ASIN
        const { data: historyResult } = await supabase
          .from('asin_history')
          .select('*')
          .eq('asin_id', asinResult.id)
          .order('recorded_at', { ascending: false })
          .limit(30);

        setAsinData(asinResult);
        setDealData(dealAsinResult);
        setHistoricalData(historyResult || []);
        
      } catch (error) {
        console.error('Error fetching ASIN data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (asinId) {
      fetchASINData();
    }
  }, [asinId]);

  // Load recommended keywords when asinData is available
  useEffect(() => {
    if (asinData?.id) {
      fetchRecommendedKeywords();
    }
  }, [asinData]);

  // Load keywords when asinId is available
  useEffect(() => {
    if (asinId) {
      fetchKeywords();
    }
  }, [asinId]);

  // Function to fetch keywords for the ASIN
  const fetchKeywords = async (forceRefresh = false) => {
    try {
      setLoadingKeywords(true);
      
      console.log('Fetching keywords for ASIN:', asinId, 'Force refresh:', forceRefresh);
      
      // First check if we have existing keywords (unless force refresh)
      if (!forceRefresh) {
        const existingKeywords = await KeywordService.getKeywordsForASIN(asinId);
        
        console.log('Existing keywords found:', existingKeywords.length);
        
        if (existingKeywords.length > 0) {
          setKeywords(existingKeywords);
          console.log('Set keywords to existing:', existingKeywords.length);
          return;
        }
      }
      
      console.log('Fetching fresh keywords from DataForSEO...');
      
      // Fetch new keywords from DataForSEO
      const newKeywords = await KeywordService.fetchKeywordsForASIN(asinId);
      
      console.log('New keywords fetched:', newKeywords.length);
      
      if (newKeywords.length > 0) {
        // Save to database
        const saved = await KeywordService.saveKeywordsForASIN(asinId, newKeywords);
        console.log('Keywords saved successfully:', saved);
        
        // Get the saved keywords with IDs
        const savedKeywords = await KeywordService.getKeywordsForASIN(asinId);
        console.log('Saved keywords retrieved:', savedKeywords.length);
        setKeywords(savedKeywords);
      } else {
        // If no new keywords, clear existing
        setKeywords([]);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoadingKeywords(false);
    }
  };

  // Fetch recommended keywords for the ASIN
  const fetchRecommendedKeywords = async () => {
    if (!asinData?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('asin_recommended_keywords')
        .select('*')
        .eq('asin_id', asinData.id)
        .order('relevance_score', { ascending: false });
        
      if (error) throw error;
      
      setRecommendedKeywords(data || []);
    } catch (error) {
      console.error('Error fetching recommended keywords:', error);
    }
  };
  
  // Test JungleScout API
  const testJungleScout = async () => {
    console.log('Testing JungleScout API...');
    const result = await testJungleScoutAPI();
    console.log('Test result:', result);
  };

  // Generate new recommended keywords
  const generateRecommendedKeywords = async () => {
    if (!asinData) return;
    
    setLoadingRecommendations(true);
    
    try {
      console.log('Starting keyword recommendation generation for ASIN:', asinData.asin);
      console.log('Product title:', asinData.title || asinData.product_name);
      console.log('Category:', asinData.category);
      console.log('Brand:', asinData.brand);
      
      // Test JungleScout API first
      await testJungleScout();
      
      // Generate recommendations with JungleScout metrics
      const recommendations = await KeywordRecommendationService.generateKeywordRecommendationsWithMetrics(
        [asinData.title || asinData.product_name],
        asinData.category,
        asinData.brand !== 'Unknown' ? asinData.brand : null
      );
      
      console.log('Final recommendations received:', recommendations.length);
      console.log('Sample recommendation with all data:', recommendations[0]);
      
      // Save to database
      if (recommendations.length > 0 && asinData.id) {
        const keywordsToSave = recommendations.map(rec => ({
          asin_id: asinData.id,
          keyword: rec.keyword,
          search_intent: rec.search_intent,
          estimated_competition: rec.estimated_competition,
          relevance_reason: rec.relevance_reason,
          relevance_score: rec.relevance_score || 80,
          search_volume: rec.search_volume || 0,
          amazon_search_volume: rec.amazon_search_volume || 0,
          google_search_volume: rec.google_search_volume || 0,
          google_cpc: rec.google_cpc || 0,
          google_competition: rec.google_competition || 0,
          monthly_trend: rec.monthly_trend || 0,
          quarterly_trend: rec.quarterly_trend || 0,
          ppc_bid_broad: rec.ppc_bid_broad || 0,
          ppc_bid_exact: rec.ppc_bid_exact || 0,
          organic_product_count: rec.organic_product_count || 0,
          sponsored_product_count: rec.sponsored_product_count || 0,
          junglescout_updated_at: rec.junglescout_updated_at || null
        }));
        
        // Delete existing recommendations first
        await supabase
          .from('asin_recommended_keywords')
          .delete()
          .eq('asin_id', asinData.id);
        
        // Insert new recommendations
        const { error } = await supabase
          .from('asin_recommended_keywords')
          .insert(keywordsToSave);
          
        if (error) throw error;
        
        // Set enhanced recommendations in state (even if not saved to DB yet)
        setRecommendedKeywords(recommendations);
        
        // Also try to reload from database in case some were saved
        // await fetchRecommendedKeywords();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Delete selected keywords
  const deleteSelectedKeywords = async () => {
    if (selectedKeywords.length === 0) {
      alert('Please select keywords to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedKeywords.length} keyword(s)?`)) {
      return;
    }
    
    setIsDeletingKeywords(true);
    
    try {
      // Delete keywords in batches to avoid URL length limits
      const BATCH_SIZE = 50;
      const batches = [];
      
      for (let i = 0; i < selectedKeywords.length; i += BATCH_SIZE) {
        batches.push(selectedKeywords.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Deleting ${selectedKeywords.length} keywords in ${batches.length} batches`);
      
      // Delete each batch
      for (const batch of batches) {
        const { error } = await supabase
          .from('asin_keywords')
          .delete()
          .in('id', batch);
          
        if (error) throw error;
      }
      
      // Remove deleted keywords from state
      setKeywords(keywords.filter(k => !selectedKeywords.includes(k.id)));
      setSelectedKeywords([]);
      
      alert(`Successfully deleted ${selectedKeywords.length} keyword(s)`);
    } catch (error) {
      console.error('Error deleting keywords:', error);
      alert('Failed to delete keywords');
    } finally {
      setIsDeletingKeywords(false);
    }
  };
  
  // Toggle keyword selection
  const toggleKeywordSelection = (keywordId) => {
    setSelectedKeywords(prev => 
      prev.includes(keywordId) 
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId]
    );
  };
  
  // Select/deselect all keywords
  const toggleSelectAllKeywords = () => {
    if (selectedKeywords.length === filteredAndSortedKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(filteredAndSortedKeywords.map(k => k.id));
    }
  };

  // Calculate competition score for a keyword
  const calculateCompetitionScore = (keyword) => {
    // Competition score based on:
    // - Number of organic products (higher = more competition)
    // - Number of sponsored products (higher = more competition)
    // - PPC bid amounts (higher = more competition)
    // - Search volume (higher volume with lower competition = better opportunity)
    
    const organicWeight = 0.4;
    const sponsoredWeight = 0.3;
    const ppcWeight = 0.3;
    
    // Normalize each factor to 0-100 scale
    const maxOrganic = 300; // Adjust based on typical max values
    const maxSponsored = 50;
    const maxPPC = 10;
    
    const organicScore = Math.min((keyword.organic_product_count || 0) / maxOrganic * 100, 100);
    const sponsoredScore = Math.min((keyword.sponsored_product_count || 0) / maxSponsored * 100, 100);
    const ppcScore = Math.min((keyword.ppc_bid_exact || 0) / maxPPC * 100, 100);
    
    // Calculate weighted competition score (0-100, higher = more competition)
    const competitionScore = Math.round(
      organicScore * organicWeight +
      sponsoredScore * sponsoredWeight +
      ppcScore * ppcWeight
    );
    
    return competitionScore;
  };
  
  // Get competition level label
  const getCompetitionLevel = (score) => {
    if (score <= 30) return { label: 'Low', color: 'green' };
    if (score <= 60) return { label: 'Medium', color: 'yellow' };
    return { label: 'High', color: 'red' };
  };

  // Filter and sort keywords
  const filteredAndSortedKeywords = keywords
    .filter(keyword => {
      // Search filter
      if (keywordSearchTerm && !keyword.keyword.toLowerCase().includes(keywordSearchTerm.toLowerCase())) {
        return false;
      }
      
      // Search volume filter
      if (minSearchVolume && keyword.search_volume < parseInt(minSearchVolume)) {
        return false;
      }
      
      // Relevancy filter
      if (minRelevancy && keyword.relevancy_score < parseInt(minRelevancy)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }
      
      return String(aVal).localeCompare(String(bVal)) * direction;
    });

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!asinData) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">ASIN Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400">The requested ASIN could not be found.</p>
                <Link to="/deals" className="btn bg-violet-500 hover:bg-violet-600 text-white mt-4">
                  Back to Deals
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Generate gallery images - use main image as first if available
  const generatedImages = getProductGalleryImages(asinData.category || 'General', asinData.asin, 4);
  const galleryImages = asinData.main_image_url || asinData.image_url 
    ? [asinData.main_image_url || asinData.image_url, ...generatedImages.slice(1)]
    : generatedImages;

  // Calculate additional metrics
  const estimatedProfit = asinData.current_price ? (asinData.current_price * 0.3).toFixed(2) : '0.00';
  const estimatedFees = asinData.current_price ? (asinData.current_price * 0.35).toFixed(2) : '0.00';
  const netProfit = asinData.current_price ? (asinData.current_price * 0.35).toFixed(2) : '0.00';

  // Prepare chart data from historical data
  const revenueChartData = {
    labels: historicalData.slice(0, 6).reverse().map(item => 
      new Date(item.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Estimated Revenue',
        data: historicalData.slice(0, 6).reverse().map(item => 
          item.monthly_revenue || 0
        ),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const rankChartData = {
    labels: historicalData.slice(0, 6).reverse().map(item => 
      new Date(item.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'BSR',
        data: historicalData.slice(0, 6).reverse().map(item => 
          item.bsr || item.current_bsr || 0
        ),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const profitBreakdownData = {
    labels: ['Product Cost', 'FBA Fees', 'Referral Fees', 'Other Costs', 'Profit'],
    datasets: [
      {
        label: 'Cost Breakdown',
        data: [35, 12, 15, 8, 30],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(147, 197, 253, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            
            {/* Breadcrumb */}
            <div className="mb-4">
              <Link to="/deals" className="text-violet-500 hover:text-violet-600">&larr; Back to Deals</Link>
              {dealData?.deals && (
                <span className="text-gray-500 dark:text-gray-400">
                  {' > '}
                  <Link to={`/deals/${dealData.deals.id}`} className="text-violet-500 hover:text-violet-600">
                    {dealData.deals.business_name || dealData.deals.amazon_store_name}
                  </Link>
                </span>
              )}
            </div>

            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">ASIN Details</h1>
              {dealData?.is_primary && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 mt-2">
                  Primary ASIN
                </span>
              )}
            </div>

            {/* Product Header Section */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl mb-8">
              <div className="p-6">
                <div className="md:flex md:justify-between md:items-start">
                  <div className="md:flex md:space-x-6">
                    {/* Product Images */}
                    <div className="mb-4 md:mb-0">
                      <div className="space-y-4">
                        <div className="relative">
                          <ASINImage
                            src={asinData.main_image_url || asinData.image_url}
                            asin={asinData.asin}
                            alt={asinData.title || asinData.product_name || 'Product Image'}
                            className="w-full md:w-96 h-64 md:h-96 object-cover rounded-lg"
                            fallbackText={asinData.asin}
                          />
                        </div>
                        <div className="flex space-x-2">
                          {galleryImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImage(index)}
                              className={`relative rounded-lg overflow-hidden ${
                                selectedImage === index ? 'ring-2 ring-violet-500' : ''
                              }`}
                            >
                              <ASINImage
                                src={img}
                                asin={asinData.asin}
                                alt={`${asinData.title} ${index + 1}`}
                                className="w-20 h-20 object-cover"
                                fallbackText={`${index + 1}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-violet-500 uppercase">{asinData.asin}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {asinData.title || 'Product Title Not Available'}
                      </h2>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {asinData.category || 'Unknown Category'} 
                        {asinData.subcategory && ` › ${asinData.subcategory}`} 
                        {asinData.brand && ` • ${asinData.brand}`}
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Current Price</div>
                          <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            ${asinData.current_price || '0.00'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">BSR</div>
                          <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            #{(asinData.current_bsr || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                          <div className="text-xl font-bold text-yellow-600">
                            {asinData.review_rating || '0.0'} ★
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(asinData.review_count || 0).toLocaleString()} reviews
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Est. Monthly Revenue</div>
                          <div className="text-xl font-bold text-green-600">
                            ${(asinData.monthly_revenue || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Monthly Units:</span>
                          <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">
                            {(asinData.monthly_units || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Seller:</span>
                          <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">
                            {asinData.seller_name || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Fulfillment:</span>
                          <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">
                            {asinData.fulfillment || 'FBA'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">First Available:</span>
                          <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">
                            {asinData.date_first_available 
                              ? new Date(asinData.date_first_available).toLocaleDateString()
                              : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 md:mt-0 md:ml-6">
                    <div className="space-y-2">
                      <a
                        href={`https://www.amazon.com/dp/${asinData.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        View on Amazon
                      </a>
                      <button className="btn w-full border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                        Track Price Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tab.Group>
              <Tab.List className="flex flex-wrap -m-1 mb-8">
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Performance
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Analytics
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Keywords
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  History
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Reviews
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Brand Tracking
                </Tab>
              </Tab.List>

              <Tab.Panels>
                {/* Performance Tab */}
                <Tab.Panel>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Revenue Chart */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Revenue Trend</h2>
                        </header>
                        <div className="px-5 py-3">
                          {historicalData.length > 0 ? (
                            <LineChart01 data={revenueChartData} width={389} height={200} />
                          ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              No historical revenue data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BSR Chart */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">BSR Trend</h2>
                        </header>
                        <div className="px-5 py-3">
                          {historicalData.length > 0 ? (
                            <LineChart01 data={rankChartData} width={389} height={200} />
                          ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              No historical rank data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="col-span-full">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Performance Metrics</h2>
                        </header>
                        <div className="p-5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                ${(asinData.monthly_revenue || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Est. Monthly Revenue</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {(asinData.monthly_units || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Est. Units Sold</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                ${netProfit}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Est. Profit per Unit</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {asinData.current_price ? Math.round((netProfit / asinData.current_price) * 100) : 0}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Est. Margin</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Analytics Tab */}
                <Tab.Panel>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Profit Breakdown */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Estimated Cost Breakdown</h2>
                        </header>
                        <div className="px-5 py-3">
                          <DoughnutChart data={profitBreakdownData} width={389} height={260} />
                        </div>
                      </div>
                    </div>

                    {/* Fee Analysis */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Estimated Fee Analysis</h2>
                        </header>
                        <div className="p-5">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Product Price</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                ${asinData.current_price || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Est. FBA + Referral Fees (35%)</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                ${estimatedFees}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Est. Product Cost (35%)</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                ${estimatedProfit}
                              </span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Est. Net Profit</span>
                                <span className="text-lg font-bold text-green-600">${netProfit}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                * These are rough estimates. Actual fees and costs may vary.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Keywords Tab */}
                <Tab.Panel>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
                      <div>
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Keyword Analysis</h2>
                        {keywords.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {keywords.length} keywords found
                            {selectedKeywords.length > 0 && ` • ${selectedKeywords.length} selected`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {selectedKeywords.length > 0 && (
                          <button 
                            onClick={deleteSelectedKeywords}
                            disabled={isDeletingKeywords}
                            className="btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                          >
                            {isDeletingKeywords ? 'Deleting...' : `Delete ${selectedKeywords.length} Keyword${selectedKeywords.length > 1 ? 's' : ''}`}
                          </button>
                        )}
                        <button 
                          onClick={() => fetchKeywords(keywords.length > 0)}
                          disabled={loadingKeywords}
                          className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
                        >
                          {loadingKeywords ? 'Loading...' : keywords.length === 0 ? 'Fetch Keyword Data' : 'Refresh Keywords'}
                        </button>
                      </div>
                    </header>
                    <div className="p-5">
                      {loadingKeywords ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
                          <p className="mt-4 text-gray-600 dark:text-gray-400">Fetching keyword data...</p>
                        </div>
                      ) : keywords.length > 0 ? (
                        <div>
                          {/* Filters */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Search Keywords
                              </label>
                              <input
                                type="text"
                                value={keywordSearchTerm}
                                onChange={(e) => setKeywordSearchTerm(e.target.value)}
                                placeholder="Filter by keyword..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Search Volume
                              </label>
                              <input
                                type="number"
                                value={minSearchVolume}
                                onChange={(e) => setMinSearchVolume(e.target.value)}
                                placeholder="e.g. 1000"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Relevancy %
                              </label>
                              <input
                                type="number"
                                value={minRelevancy}
                                onChange={(e) => setMinRelevancy(e.target.value)}
                                placeholder="e.g. 50"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => {
                                  setKeywordSearchTerm('');
                                  setMinSearchVolume('');
                                  setMinRelevancy('');
                                }}
                                className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 w-full"
                              >
                                Clear Filters
                              </button>
                            </div>
                          </div>
                          
                          {/* Results count */}
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Showing {filteredAndSortedKeywords.length} of {keywords.length} keywords
                          </div>
                          
                          <div className="overflow-x-auto">
                          <table className="table-auto w-full">
                            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
                              <tr>
                                <th className="p-2 w-8">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={selectedKeywords.length === filteredAndSortedKeywords.length && filteredAndSortedKeywords.length > 0}
                                    onChange={toggleSelectAllKeywords}
                                  />
                                </th>
                                <th 
                                  className="p-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => handleSort('keyword')}
                                >
                                  <div className="font-semibold text-left flex items-center">
                                    Keyword
                                    {sortField === 'keyword' && (
                                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                  </div>
                                </th>
                                <th 
                                  className="p-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => handleSort('search_volume')}
                                >
                                  <div className="font-semibold text-center flex items-center justify-center">
                                    Search Volume
                                    {sortField === 'search_volume' && (
                                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                  </div>
                                </th>
                                <th 
                                  className="p-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => handleSort('relevancy_score')}
                                >
                                  <div className="font-semibold text-center flex items-center justify-center">
                                    Relevancy
                                    {sortField === 'relevancy_score' && (
                                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                  </div>
                                </th>
                                <th 
                                  className="p-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => handleSort('monthly_trend')}
                                >
                                  <div className="font-semibold text-center flex items-center justify-center">
                                    Monthly Trend
                                    {sortField === 'monthly_trend' && (
                                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                  </div>
                                </th>
                                <th 
                                  className="p-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => handleSort('ppc_bid_broad')}
                                >
                                  <div className="font-semibold text-center flex items-center justify-center">
                                    PPC Bid (Broad)
                                    {sortField === 'ppc_bid_broad' && (
                                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                  </div>
                                </th>
                                <th 
                                  className="p-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => handleSort('ppc_bid_exact')}
                                >
                                  <div className="font-semibold text-center flex items-center justify-center">
                                    PPC Bid (Exact)
                                    {sortField === 'ppc_bid_exact' && (
                                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                  </div>
                                </th>
                                <th className="p-2 whitespace-nowrap">
                                  <div className="font-semibold text-center">Competition</div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                              {filteredAndSortedKeywords.map((keyword) => (
                                <tr key={keyword.id} className={selectedKeywords.includes(keyword.id) ? 'bg-violet-50 dark:bg-violet-900/20' : ''}>
                                  <td className="p-2 w-8">
                                    <input
                                      type="checkbox"
                                      className="form-checkbox"
                                      checked={selectedKeywords.includes(keyword.id)}
                                      onChange={() => toggleKeywordSelection(keyword.id)}
                                    />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-gray-800 dark:text-gray-100 font-medium">
                                      {keyword.keyword}
                                    </div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">{keyword.search_volume.toLocaleString()}</div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        keyword.relevancy_score >= 80 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                          : keyword.relevancy_score >= 50
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                      }`}>
                                        {keyword.relevancy_score}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">
                                      <span className={`${
                                        keyword.monthly_trend > 0 ? 'text-green-600' : 
                                        keyword.monthly_trend < 0 ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        {keyword.monthly_trend > 0 ? '+' : ''}{keyword.monthly_trend}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">${keyword.ppc_bid_broad.toFixed(2)}</div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">${keyword.ppc_bid_exact.toFixed(2)}</div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">
                                      {(() => {
                                        const score = calculateCompetitionScore(keyword);
                                        const level = getCompetitionLevel(score);
                                        return (
                                          <div>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                              level.color === 'green' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                : level.color === 'yellow'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                            }`}>
                                              {level.label} ({score})
                                            </span>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                              {keyword.organic_product_count} / {keyword.sponsored_product_count}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          <p className="mb-4">No keyword data available for this ASIN.</p>
                          <button 
                            onClick={() => fetchKeywords(false)}
                            className="btn bg-violet-500 hover:bg-violet-600 text-white"
                          >
                            Fetch Keyword Data
                          </button>
                        </div>
                      )}
                      
                      {/* Recommended Keywords Section */}
                      <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 text-violet-500" />
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Recommended Keywords</h3>
                              <button
                                onClick={() => setShowRecommendations(!showRecommendations)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                {showRecommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                            <button
                              onClick={generateRecommendedKeywords}
                              disabled={loadingRecommendations}
                              className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm disabled:opacity-50"
                            >
                              {loadingRecommendations ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Generate Recommendations
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {showRecommendations && (
                          <div className="p-6">
                            {recommendedKeywords.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendedKeywords.map((keyword, index) => (
                                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{keyword.keyword}</h4>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {keyword.relevance_score}%
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          keyword.estimated_competition === 'low' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                            : keyword.estimated_competition === 'medium'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                        }`}>
                                          {keyword.estimated_competition}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      <span className="capitalize">{keyword.search_intent} intent</span>
                                    </div>
                                    {(keyword.amazon_search_volume > 0 || keyword.google_search_volume > 0) && (
                                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {keyword.amazon_search_volume > 0 && (
                                          <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.44-2.186 1.44-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.683zm3.186 7.705c-.209.189-.512.201-.745.074-1.052-.872-1.238-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.095v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.82-1.775-.82-1.205 0-2.277.618-2.54 1.897-.054.285-.261.567-.549.58l-3.061-.333c-.259-.056-.548-.266-.472-.66.704-3.716 4.06-4.838 7.066-4.838 1.537 0 3.547.41 4.758 1.574 1.538 1.436 1.392 3.352 1.392 5.438v4.923c0 1.481.615 2.13 1.192 2.929.204.287.248.63-.01.838-.647.541-1.794 1.537-2.423 2.099l-.008-.007zm3.559 1.988c-2.748 1.472-5.735 2.181-8.453 2.181-4.027 0-7.927-1.393-11.081-3.706-.277-.202-.481.154-.251.416 3.138 3.027 7.497 4.684 11.779 4.684 3.165 0 6.29-.965 8.693-2.653.55-.385.503-1.168-.687-.922z"/>
                                            </svg>
                                            {keyword.amazon_search_volume.toLocaleString()}/mo
                                          </span>
                                        )}
                                        {keyword.google_search_volume > 0 && (
                                          <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                                            </svg>
                                            {keyword.google_search_volume.toLocaleString()}/mo
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {keyword.junglescout_updated_at ? (
                                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mb-2">
                                        {keyword.ppc_bid_exact !== undefined && (
                                          <span>PPC: ${keyword.ppc_bid_exact.toFixed(2)}</span>
                                        )}
                                        {keyword.organic_product_count !== undefined && (
                                          <span>Organic: {keyword.organic_product_count}</span>
                                        )}
                                        {keyword.sponsored_product_count !== undefined && (
                                          <span>Sponsored: {keyword.sponsored_product_count}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 italic">
                                        Keyword metrics not available
                                      </div>
                                    )}
                                    
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{keyword.relevance_reason}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                  Generate AI-powered keyword recommendations for this ASIN
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  Uses product title, category, and brand to suggest relevant keywords
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* History Tab */}
                <Tab.Panel>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">Historical Data</h2>
                    </header>
                    <div className="p-5">
                      {historicalData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="table-auto w-full">
                            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
                              <tr>
                                <th className="p-2 whitespace-nowrap">
                                  <div className="font-semibold text-left">Date</div>
                                </th>
                                <th className="p-2 whitespace-nowrap">
                                  <div className="font-semibold text-center">Price</div>
                                </th>
                                <th className="p-2 whitespace-nowrap">
                                  <div className="font-semibold text-center">BSR</div>
                                </th>
                                <th className="p-2 whitespace-nowrap">
                                  <div className="font-semibold text-center">Revenue</div>
                                </th>
                                <th className="p-2 whitespace-nowrap">
                                  <div className="font-semibold text-center">Units</div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                              {historicalData.map((item) => (
                                <tr key={item.id}>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-gray-800 dark:text-gray-100">
                                      {new Date(item.recorded_at).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">${item.price || '0.00'}</div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">#{(item.bsr || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">${(item.monthly_revenue || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="p-2 whitespace-nowrap">
                                    <div className="text-center">{(item.monthly_units || 0).toLocaleString()}</div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No historical data available for this ASIN.
                        </div>
                      )}
                    </div>
                  </div>
                </Tab.Panel>

                {/* Reviews Tab */}
                <Tab.Panel>
                  <ASINReviewAnalysis 
                    asin={asinData.asin} 
                    asinId={asinData.id}
                  />
                </Tab.Panel>
                {/* Brand Tracking Tab */}
                <Tab.Panel>
                  <BrandKeywordTracker 
                    brandName={dealData?.deals?.business_name || 'Unknown Brand'}
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

          </div>
        </main>
      </div>
    </div>
  );
}

export default ASINDetail;