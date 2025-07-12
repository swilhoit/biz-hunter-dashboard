import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  fetchKeywordsFromDataForSEO, 
  fetchRelatedKeywordsFromDataForSEO,
  calculateTrend 
} from '../../utils/explorer/dataForSEOKeywords';
import { generateKeywords } from '../../utils/explorer/aiKeywordGenerator';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';

interface ComponentKeywordData {
  keyword: string;
  searchVolume: number;
  searchVolumeTrend: number;
  cpc: number;
  competition: number;
  competitionLevel: string;
  monthlySearches: Array<{ month: string; search_volume: number }>;
  keywordDifficulty: number;
}

interface KeywordResearchProps {
  initialKeywords: string;
  onKeywordSelect: (keyword: string) => void;
  products: any[];
}

export function KeywordResearch({ initialKeywords, onKeywordSelect, products }: KeywordResearchProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [keywordData, setKeywordData] = useState<ComponentKeywordData[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<ComponentKeywordData[]>([]);
  const [aiGeneratedKeywords, setAiGeneratedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'related' | 'ai'>('search');

  const handleKeywordSearch = useCallback(async () => {
    if (!keywords.trim()) {
      setError('Please enter keywords to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keywordList = keywords.split(',').map(k => k.trim());
      
      // Fetch data from DataForSEO
      const dataForSEOData = await fetchKeywordsFromDataForSEO(keywordList);
      
      // Convert to component format and calculate trend
      const formattedData: ComponentKeywordData[] = dataForSEOData.map(item => ({
        keyword: item.keyword,
        searchVolume: item.search_volume,
        searchVolumeTrend: calculateTrend(item.monthly_searches),
        cpc: item.cpc,
        competition: item.competition,
        competitionLevel: item.competition_level,
        monthlySearches: item.monthly_searches,
        keywordDifficulty: item.keyword_difficulty
      }));
      
      // Sort by search volume (highest to lowest) by default
      const sortedData = formattedData.sort((a, b) => b.searchVolume - a.searchVolume);
      
      setKeywordData(sortedData);
    } catch (err) {
      setError('Failed to fetch keyword data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [keywords]);

  const handleRelatedKeywords = useCallback(async () => {
    if (!keywords.trim()) {
      setError('Please enter a seed keyword');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const seedKeyword = keywords.split(',')[0].trim();
      const related = await fetchRelatedKeywordsFromDataForSEO(seedKeyword);
      
      // Convert to component format
      const formattedRelated: ComponentKeywordData[] = related.map(item => ({
        keyword: item.keyword,
        searchVolume: item.search_volume,
        searchVolumeTrend: calculateTrend(item.monthly_searches),
        cpc: item.cpc,
        competition: item.competition,
        competitionLevel: item.competition_level,
        monthlySearches: item.monthly_searches,
        keywordDifficulty: item.keyword_difficulty
      }));
      
      // Sort by search volume (highest to lowest) by default
      const sortedRelated = formattedRelated.sort((a, b) => b.searchVolume - a.searchVolume);
      
      setRelatedKeywords(sortedRelated);
      setActiveTab('related');
    } catch (err) {
      setError('Failed to fetch related keywords');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [keywords]);

  const handleAIKeywordGeneration = useCallback(async () => {
    if (products.length === 0) {
      setError('Please search for products first to generate AI keywords');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productTitles = products.slice(0, 10).map(p => p.title);
      const generated = await generateKeywords(productTitles, keywords);
      setAiGeneratedKeywords(generated);
      setActiveTab('ai');
    } catch (err) {
      setError('Failed to generate AI keywords');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [products, keywords]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Keyword Research</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discover high-value keywords for your Amazon products
          </p>
        </header>
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter keywords to research (comma-separated)..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleKeywordSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Keywords
            </button>
            <button
              onClick={handleRelatedKeywords}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Find Related
            </button>
            <button
              onClick={handleAIKeywordGeneration}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              AI Generate
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'search'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Search Results ({keywordData.length})
            </button>
            <button
              onClick={() => setActiveTab('related')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'related'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Related Keywords ({relatedKeywords.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'ai'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              AI Generated ({aiGeneratedKeywords.length})
            </button>
          </div>
        </header>

        <div className="p-5">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : (
            <>
              {/* Search Results Tab */}
              {activeTab === 'search' && (
                <div>
                  {keywordData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Keyword</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Search Volume</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Competition</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Difficulty</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Trend</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">CPC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {keywordData.map((kw, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => onKeywordSelect(kw.keyword)}>
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</td>
                              <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                                {formatNumberWithCommas(kw.searchVolume)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  kw.competitionLevel === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                  kw.competitionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                }`}>
                                  {kw.competitionLevel}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                                {kw.keywordDifficulty}%
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`flex items-center justify-end gap-1 ${
                                  kw.searchVolumeTrend > 0 ? 'text-green-600' : kw.searchVolumeTrend < 0 ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  <TrendingUp className="w-4 h-4" />
                                  {kw.searchVolumeTrend > 0 ? '+' : ''}{kw.searchVolumeTrend}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                                ${kw.cpc.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Enter keywords above to see search data
                    </p>
                  )}
                </div>
              )}

              {/* Related Keywords Tab */}
              {activeTab === 'related' && (
                <div>
                  {relatedKeywords.length > 0 ? (
                    <div className="space-y-3">
                      {relatedKeywords.map((kw, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => onKeywordSelect(kw.keyword)}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span>Volume: {formatNumberWithCommas(kw.searchVolume)}</span>
                                <span>CPC: ${kw.cpc.toFixed(2)}</span>
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                  kw.competitionLevel === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                  kw.competitionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                }`}>
                                  {kw.competitionLevel}
                                </span>
                                <span className={`flex items-center gap-1 ${
                                  kw.searchVolumeTrend > 0 ? 'text-green-600' : kw.searchVolumeTrend < 0 ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  <TrendingUp className="w-3 h-3" />
                                  {kw.searchVolumeTrend > 0 ? '+' : ''}{kw.searchVolumeTrend}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Click "Find Related" to discover related keywords
                    </p>
                  )}
                </div>
              )}

              {/* AI Generated Tab */}
              {activeTab === 'ai' && (
                <div>
                  {aiGeneratedKeywords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {aiGeneratedKeywords.map((keyword, index) => (
                        <div 
                          key={index} 
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                          onClick={() => onKeywordSelect(keyword)}
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{keyword}</span>
                        </div>
                      ))}
                      <button
                        onClick={handleAIKeywordGeneration}
                        className="p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate More
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Click "AI Generate" to get keyword suggestions
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}