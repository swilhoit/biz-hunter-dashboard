import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Eye,
  Plus,
  RefreshCw,
  BarChart3,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { BrandKeywordService } from '../services/BrandKeywordService';

interface BrandKeywordTrackerProps {
  brandName: string;
  onKeywordsUpdate?: (keywords: any[]) => void;
}

interface KeywordPerformance {
  keyword: string;
  search_volume: number;
  position?: number;
  ranking_tier: string;
  estimated_traffic: number;
  relevance_score: number;
  keyword_type: string;
  asin?: string;
  title?: string;
}

interface BrandSummary {
  total_keywords: number;
  ranking_keywords: number;
  top_10_keywords: number;
  top_3_keywords: number;
  avg_position: number;
  visibility_score: number;
  estimated_traffic: number;
}

export function BrandKeywordTracker({ brandName, onKeywordsUpdate }: BrandKeywordTrackerProps) {
  const [keywords, setKeywords] = useState<KeywordPerformance[]>([]);
  const [summary, setSummary] = useState<BrandSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackingRankings, setTrackingRankings] = useState(false);
  const [showAddKeywords, setShowAddKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

  useEffect(() => {
    if (brandName) {
      loadBrandPerformance();
    }
  }, [brandName]);

  const loadBrandPerformance = async () => {
    setLoading(true);
    try {
      const [performance, history] = await Promise.all([
        BrandKeywordService.getBrandPerformance(brandName),
        BrandKeywordService.getBrandRankingHistory(brandName, 1)
      ]);
      
      setKeywords(performance);
      if (history.length > 0) {
        setSummary(history[0]);
      }
      
      if (onKeywordsUpdate) {
        onKeywordsUpdate(performance);
      }
    } catch (error) {
      console.error('Error loading brand performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackKeywordRankings = async () => {
    setTrackingRankings(true);
    try {
      await BrandKeywordService.trackKeywordRankings(brandName);
      await loadBrandPerformance();
    } catch (error) {
      console.error('Error tracking rankings:', error);
    } finally {
      setTrackingRankings(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    try {
      const success = await BrandKeywordService.addBrandKeywords(brandName, [{
        keyword: newKeyword.trim(),
        relevance_score: 5,
        keyword_type: 'general',
        source: 'manual'
      }]);
      
      if (success) {
        setNewKeyword('');
        await loadBrandPerformance();
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
    }
  };

  const generateRecommendations = async () => {
    setGeneratingRecommendations(true);
    try {
      // Get some product names from existing keywords for context
      const productContext = keywords
        .filter(k => k.keyword_type === 'product')
        .map(k => k.keyword)
        .slice(0, 5);
      
      const recommendations = await BrandKeywordService.generateKeywordRecommendations(
        brandName,
        productContext.length > 0 ? productContext : [brandName]
      );
      
      if (recommendations.length > 0) {
        await BrandKeywordService.addBrandKeywords(brandName, recommendations);
        await loadBrandPerformance();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const getRankingIcon = (tier: string) => {
    switch (tier) {
      case 'Top 3':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'Top 10':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'Top 50':
        return <ArrowUp className="w-4 h-4 text-blue-500" />;
      case 'Top 100':
        return <Minus className="w-4 h-4 text-gray-500" />;
      default:
        return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
  };

  const getKeywordTypeColor = (type: string) => {
    const colors = {
      brand: 'bg-purple-100 text-purple-800',
      product: 'bg-blue-100 text-blue-800',
      category: 'bg-green-100 text-green-800',
      competitor: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              Brand Keyword Tracking: {brandName}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddKeywords(!showAddKeywords)}
              className="btn bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Keywords
            </button>
            <button
              onClick={generateRecommendations}
              disabled={generatingRecommendations}
              className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
            >
              {generatingRecommendations ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              AI Recommendations
            </button>
            <button
              onClick={trackKeywordRankings}
              disabled={trackingRankings}
              className="btn bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
            >
              {trackingRankings ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Track Rankings
            </button>
          </div>
        </div>
      </header>

      <div className="p-5">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Keywords</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {summary.total_keywords}
                  </p>
                </div>
                <Search className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Top 10 Rankings</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {summary.top_10_keywords}
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Avg Position</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                    {summary.avg_position > 0 ? Math.round(summary.avg_position) : '-'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Est. Traffic</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {summary.estimated_traffic.toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Add Keywords Form */}
        {showAddKeywords && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">Add New Keyword</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter keyword to track..."
                className="form-input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <button
                onClick={addKeyword}
                className="btn bg-violet-500 hover:bg-violet-600 text-white"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Keywords Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading keyword performance...</p>
          </div>
        ) : keywords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Keyword</th>
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Type</th>
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Volume</th>
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Position</th>
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Ranking</th>
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Est. Traffic</th>
                  <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Product</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((keyword, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {keyword.keyword}
                        </span>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full mr-1 ${
                                i < keyword.relevance_score ? 'bg-violet-400' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {keyword.relevance_score}/10
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getKeywordTypeColor(keyword.keyword_type)}`}>
                        {keyword.keyword_type}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">
                      {keyword.search_volume?.toLocaleString() || '-'}
                    </td>
                    <td className="py-3">
                      {keyword.position ? (
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          #{keyword.position}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not ranking</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getRankingIcon(keyword.ranking_tier)}
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {keyword.ranking_tier}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">
                      {Math.round(keyword.estimated_traffic).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {keyword.asin ? (
                        <div className="max-w-xs">
                          <div className="text-xs text-violet-600 font-mono">{keyword.asin}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {keyword.title}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No product ranking</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No keywords tracked yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Add keywords manually or use AI recommendations to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}