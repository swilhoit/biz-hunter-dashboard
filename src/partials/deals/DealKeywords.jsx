import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Download, Filter, RefreshCw, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ASINService } from '../../services/ASINService';
import KeywordRecommendationService from '../../services/KeywordRecommendationService';

function DealKeywords({ dealId }) {
  const [keywords, setKeywords] = useState([]);
  const [asins, setAsins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [minSearchVolume, setMinSearchVolume] = useState('');
  const [minRelevancy, setMinRelevancy] = useState('');
  const [selectedASINs, setSelectedASINs] = useState([]);
  const [competitionFilter, setCompetitionFilter] = useState('all');
  
  // Sort states
  const [sortField, setSortField] = useState('search_volume');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Recommended keywords states
  const [recommendedKeywords, setRecommendedKeywords] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [recommendationError, setRecommendationError] = useState(null);

  // Load ASINs and keywords
  useEffect(() => {
    loadData();
  }, [dealId]);

  // Listen for keyword refresh events
  useEffect(() => {
    const handleKeywordsUpdated = (event) => {
      if (event.detail && event.detail.dealId === dealId) {
        console.log('Keywords updated, refreshing...');
        loadData();
      }
    };

    window.addEventListener('keywords-updated', handleKeywordsUpdated);
    
    return () => {
      window.removeEventListener('keywords-updated', handleKeywordsUpdated);
    };
  }, [dealId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First load ASINs for this deal
      const dealASINs = await ASINService.fetchDealASINs(dealId);
      setAsins(dealASINs);
      
      if (dealASINs.length === 0) {
        setKeywords([]);
        return;
      }
      
      // Get keywords for all ASINs
      console.log('Fetching keywords for ASINs:', dealASINs.map(a => ({ id: a.id, asin: a.asin })));
      console.log('ASIN IDs for keyword query:', dealASINs.map(a => a.id));
      
      const { data: keywordData, error: keywordError } = await supabase
        .from('asin_keywords')
        .select(`
          *,
          asins (
            asin,
            title,
            brand
          )
        `)
        .in('asin_id', dealASINs.map(a => a.id));
        
      if (keywordError) throw keywordError;
      
      console.log('Found keywords:', keywordData?.length || 0);
      
      // Group keywords and aggregate data
      const keywordMap = new Map();
      
      keywordData.forEach(kw => {
        const key = kw.keyword.toLowerCase();
        if (!keywordMap.has(key)) {
          keywordMap.set(key, {
            keyword: kw.keyword,
            search_volume: kw.search_volume,
            relevancy_scores: [],
            monthly_trends: [],
            ppc_bid_broad: kw.ppc_bid_broad,
            ppc_bid_exact: kw.ppc_bid_exact,
            organic_product_count: kw.organic_product_count,
            sponsored_product_count: kw.sponsored_product_count,
            asins: [],
            asin_count: 0
          });
        }
        
        const kwData = keywordMap.get(key);
        kwData.relevancy_scores.push(kw.relevancy_score);
        kwData.monthly_trends.push(kw.monthly_trend);
        
        // Find the ASIN data from our loaded ASINs if the join failed
        const asinData = kw.asins || dealASINs.find(a => a.id === kw.asin_id);
        if (asinData) {
          kwData.asins.push({
            asin: asinData.asin,
            product_name: asinData.title || asinData.product_name,
            relevancy_score: kw.relevancy_score
          });
        }
        kwData.asin_count = kwData.asins.length;
      });
      
      // Calculate averages and convert to array
      const aggregatedKeywords = Array.from(keywordMap.values()).map(kw => ({
        ...kw,
        avg_relevancy_score: Math.round(kw.relevancy_scores.reduce((a, b) => a + b, 0) / kw.relevancy_scores.length),
        avg_monthly_trend: Math.round(kw.monthly_trends.reduce((a, b) => a + b, 0) / kw.monthly_trends.length),
        competition_score: calculateCompetitionScore(kw)
      }));
      
      setKeywords(aggregatedKeywords);
      
    } catch (err) {
      console.error('Error loading keywords:', err);
      setError('Failed to load keywords. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate competition score
  const calculateCompetitionScore = (keyword) => {
    const organicWeight = 0.4;
    const sponsoredWeight = 0.3;
    const ppcWeight = 0.3;
    
    const maxOrganic = 300;
    const maxSponsored = 50;
    const maxPPC = 10;
    
    const organicScore = Math.min((keyword.organic_product_count || 0) / maxOrganic * 100, 100);
    const sponsoredScore = Math.min((keyword.sponsored_product_count || 0) / maxSponsored * 100, 100);
    const ppcScore = Math.min((keyword.ppc_bid_exact || 0) / maxPPC * 100, 100);
    
    return Math.round(
      organicScore * organicWeight +
      sponsoredScore * sponsoredWeight +
      ppcScore * ppcWeight
    );
  };

  const getCompetitionLevel = (score) => {
    if (score <= 30) return { label: 'Low', color: 'green' };
    if (score <= 60) return { label: 'Medium', color: 'yellow' };
    return { label: 'High', color: 'red' };
  };

  // Generate keyword recommendations
  const generateRecommendations = async () => {
    if (asins.length === 0) {
      setRecommendationError('No ASINs found to generate recommendations');
      return;
    }

    setLoadingRecommendations(true);
    setRecommendationError(null);
    
    try {
      // Get unique product titles (up to 5 for better context)
      const productTitles = [...new Set(asins.map(a => a.product_name || a.title))].slice(0, 5);
      const category = asins[0]?.category || null;
      const brands = [...new Set(asins.map(a => a.brand).filter(b => b && b !== 'Unknown'))];
      const brand = brands.length === 1 ? brands[0] : null; // Only use brand if all products are same brand
      
      console.log('=== DEAL-LEVEL KEYWORD GENERATION ===');
      console.log('Product titles:', productTitles);
      console.log('Category:', category);
      console.log('Brand:', brand);
      console.log('ASINs count:', asins.length);
      
      const recommendations = await KeywordRecommendationService.generateKeywordRecommendationsWithMetrics(
        productTitles,
        category,
        brand
      );
      
      console.log('=== DEAL-LEVEL RECOMMENDATIONS RECEIVED ===');
      console.log('Recommendations count:', recommendations.length);
      console.log('Sample recommendation:', recommendations[0]);
      console.log('All recommendations:', recommendations);
      
      setRecommendedKeywords(recommendations);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setRecommendationError(err.message || 'Failed to generate recommendations. Please check your OpenAI API key.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort keywords
  const filteredAndSortedKeywords = keywords
    .filter(keyword => {
      // Search filter
      if (searchTerm && !keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Search volume filter
      if (minSearchVolume && keyword.search_volume < parseInt(minSearchVolume)) {
        return false;
      }
      
      // Relevancy filter
      if (minRelevancy && keyword.avg_relevancy_score < parseInt(minRelevancy)) {
        return false;
      }
      
      // ASIN filter
      if (selectedASINs.length > 0) {
        const hasSelectedASIN = keyword.asins.some(a => 
          selectedASINs.includes(a.asin)
        );
        if (!hasSelectedASIN) return false;
      }
      
      // Competition filter
      if (competitionFilter !== 'all') {
        const level = getCompetitionLevel(keyword.competition_score);
        if (competitionFilter === 'low' && level.label !== 'Low') return false;
        if (competitionFilter === 'medium' && level.label !== 'Medium') return false;
        if (competitionFilter === 'high' && level.label !== 'High') return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Keyword', 'Search Volume', 'Avg Relevancy', 'Competition', 'PPC Broad', 'PPC Exact', 'ASINs'];
    const rows = filteredAndSortedKeywords.map(kw => [
      kw.keyword,
      kw.search_volume,
      kw.avg_relevancy_score,
      getCompetitionLevel(kw.competition_score).label,
      kw.ppc_bid_broad,
      kw.ppc_bid_exact,
      kw.asin_count
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${dealId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button onClick={loadData} className="btn bg-violet-500 hover:bg-violet-600 text-white mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Keywords Analysis</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Aggregated keywords from all ASINs in this deal
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Keywords</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{keywords.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Search Volume</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {keywords.length > 0 
              ? Math.round(keywords.reduce((sum, k) => sum + k.search_volume, 0) / keywords.length).toLocaleString()
              : '0'
            }
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Competition</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {keywords.filter(k => getCompetitionLevel(k.competition_score).label === 'Low').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ASINs with Keywords</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {asins.filter(a => keywords.some(k => k.asins.some(ka => ka.asin === a.asin))).length} / {asins.length}
          </p>
        </div>
      </div>

      {/* Recommended Keywords Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
              onClick={generateRecommendations}
              disabled={loadingRecommendations || asins.length === 0}
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
            {recommendationError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">{recommendationError}</p>
                {recommendationError.includes('API key') && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Add VITE_OPENAI_API_KEY to your .env file
                  </p>
                )}
              </div>
            ) : recommendedKeywords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedKeywords.map((keyword, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{keyword.keyword}</h4>
                      <div className="flex items-center space-x-2">
                        {keyword.relevance_score && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {keyword.relevance_score}%
                          </span>
                        )}
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
                      {keyword.search_volume > 0 && (
                        <span>{keyword.search_volume.toLocaleString()} searches/mo</span>
                      )}
                      {keyword.monthly_trend !== undefined && keyword.monthly_trend !== null && (
                        <span className={keyword.monthly_trend > 0 ? 'text-green-600' : 'text-red-600'}>
                          {keyword.monthly_trend > 0 ? '+' : ''}{keyword.monthly_trend.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {(keyword.ppc_bid_exact > 0 || keyword.organic_product_count > 0 || keyword.sponsored_product_count > 0) && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mb-2">
                        {keyword.ppc_bid_exact > 0 && (
                          <span>PPC: ${keyword.ppc_bid_exact.toFixed(2)}</span>
                        )}
                        {keyword.organic_product_count > 0 && (
                          <span>Organic: {keyword.organic_product_count}</span>
                        )}
                        {keyword.sponsored_product_count > 0 && (
                          <span>Sponsored: {keyword.sponsored_product_count}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Debug info - remove this later */}
                    <div className="text-xs text-gray-400 mt-2 border-t pt-2">
                      DEBUG: search_volume={keyword.search_volume}, monthly_trend={keyword.monthly_trend}, ppc_bid_exact={keyword.ppc_bid_exact}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{keyword.relevance_reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Generate AI-powered keyword recommendations based on your products
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Uses product titles to suggest relevant, high-converting keywords
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <input
            type="number"
            placeholder="Min volume"
            value={minSearchVolume}
            onChange={(e) => setMinSearchVolume(e.target.value)}
            className="form-input"
          />
          
          <input
            type="number"
            placeholder="Min relevancy %"
            value={minRelevancy}
            onChange={(e) => setMinRelevancy(e.target.value)}
            className="form-input"
          />
          
          <select
            value={competitionFilter}
            onChange={(e) => setCompetitionFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Competition</option>
            <option value="low">Low Competition</option>
            <option value="medium">Medium Competition</option>
            <option value="high">High Competition</option>
          </select>
          
          <select
            multiple
            value={selectedASINs}
            onChange={(e) => setSelectedASINs(Array.from(e.target.selectedOptions, option => option.value))}
            className="form-select"
            style={{ height: '42px', overflow: 'hidden' }}
          >
            <option value="">Filter by ASIN...</option>
            {asins.map(asin => (
              <option key={asin.asin} value={asin.asin}>
                {(asin.product_name || asin.title || 'Unknown').substring(0, 30)}...
              </option>
            ))}
          </select>
          
          <button onClick={exportToCSV} className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAndSortedKeywords.length} of {keywords.length} keywords
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('keyword')}
                >
                  <div className="flex items-center">
                    Keyword
                    {sortField === 'keyword' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('search_volume')}
                >
                  <div className="flex items-center">
                    Search Volume
                    {sortField === 'search_volume' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('avg_relevancy_score')}
                >
                  <div className="flex items-center">
                    Avg Relevancy
                    {sortField === 'avg_relevancy_score' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('competition_score')}
                >
                  <div className="flex items-center">
                    Competition
                    {sortField === 'competition_score' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PPC Bids
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('asin_count')}
                >
                  <div className="flex items-center">
                    ASINs
                    {sortField === 'asin_count' && (
                      sortDirection === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedKeywords.length > 0 ? (
                filteredAndSortedKeywords.map((keyword, index) => {
                  const competitionLevel = getCompetitionLevel(keyword.competition_score);
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {keyword.keyword}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {keyword.search_volume.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          keyword.avg_relevancy_score >= 80 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : keyword.avg_relevancy_score >= 50
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {keyword.avg_relevancy_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          competitionLevel.color === 'green' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : competitionLevel.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {competitionLevel.label} ({keyword.competition_score})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          B: ${keyword.ppc_bid_broad.toFixed(2)} / E: ${keyword.ppc_bid_exact.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {keyword.asin_count} product{keyword.asin_count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {keyword.asins.slice(0, 2).map(a => a.product_name.split(' ').slice(0, 2).join(' ')).join(', ')}
                          {keyword.asins.length > 2 && ` +${keyword.asins.length - 2} more`}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {keywords.length === 0 ? (
                        <>
                          <p className="mb-2">No keywords found for this deal's ASINs.</p>
                          <p className="text-sm">Use the "Get Keywords" button in the ASINs tab to fetch keyword data.</p>
                        </>
                      ) : (
                        <p>No keywords match your filters.</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DealKeywords;