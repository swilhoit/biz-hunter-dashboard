import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchKeywordData, fetchRelatedKeywords } from '../../utils/explorer/junglescout';
import { generateKeywords } from '../../utils/explorer/aiKeywordGenerator';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  searchVolumeTrend: number;
  ppcBid: number;
  relevancyScore: number;
  trendData?: Array<{ date: string; volume: number }>;
}

interface KeywordResearchProps {
  initialKeywords: string;
  onKeywordSelect: (keyword: string) => void;
  products: any[];
}

export function KeywordResearch({ initialKeywords, onKeywordSelect, products }: KeywordResearchProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<KeywordData[]>([]);
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
      const data = await fetchKeywordData(keywordList);
      setKeywordData(data);
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
      const related = await fetchRelatedKeywords(seedKeyword);
      setRelatedKeywords(related);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Keyword Research</h3>
        
        <div className="space-y-4">
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Find Related
            </button>
            <button
              onClick={handleAIKeywordGeneration}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              AI Generate
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'search'
                  ? 'text-violet-600 border-b-2 border-violet-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Search Results ({keywordData.length})
            </button>
            <button
              onClick={() => setActiveTab('related')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'related'
                  ? 'text-violet-600 border-b-2 border-violet-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Related Keywords ({relatedKeywords.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'ai'
                  ? 'text-violet-600 border-b-2 border-violet-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              AI Generated ({aiGeneratedKeywords.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : (
            <>
              {/* Search Results Tab */}
              {activeTab === 'search' && keywordData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keyword</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Search Volume</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trend</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PPC Bid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Relevancy</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {keywordData.map((kw, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {formatNumberWithCommas(kw.searchVolume)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`flex items-center gap-1 ${
                              kw.searchVolumeTrend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <TrendingUp className="w-4 h-4" />
                              {kw.searchVolumeTrend > 0 ? '+' : ''}{kw.searchVolumeTrend}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            ${kw.ppcBid.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-violet-600 h-2 rounded-full"
                                  style={{ width: `${kw.relevancyScore}%` }}
                                />
                              </div>
                              <span className="text-gray-600 dark:text-gray-400">{kw.relevancyScore}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => onKeywordSelect(kw.keyword)}
                              className="text-violet-600 hover:text-violet-800 font-medium"
                            >
                              Use
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Related Keywords Tab */}
              {activeTab === 'related' && relatedKeywords.length > 0 && (
                <div className="space-y-3">
                  {relatedKeywords.map((kw, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>Volume: {formatNumberWithCommas(kw.searchVolume)}</span>
                            <span>PPC: ${kw.ppcBid.toFixed(2)}</span>
                            <span className={`flex items-center gap-1 ${
                              kw.searchVolumeTrend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <TrendingUp className="w-3 h-3" />
                              {kw.searchVolumeTrend > 0 ? '+' : ''}{kw.searchVolumeTrend}%
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => onKeywordSelect(kw.keyword)}
                          className="px-3 py-1.5 bg-violet-500 text-white rounded-md hover:bg-violet-600"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Generated Tab */}
              {activeTab === 'ai' && aiGeneratedKeywords.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiGeneratedKeywords.map((keyword, index) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{keyword}</span>
                        <button
                          onClick={() => onKeywordSelect(keyword)}
                          className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleAIKeywordGeneration}
                    className="p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate More
                  </button>
                </div>
              )}

              {/* Empty States */}
              {activeTab === 'search' && keywordData.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Enter keywords above to see search data
                </p>
              )}
              {activeTab === 'related' && relatedKeywords.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Click "Find Related" to discover related keywords
                </p>
              )}
              {activeTab === 'ai' && aiGeneratedKeywords.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Click "AI Generate" to get keyword suggestions
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}