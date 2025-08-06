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
  Minus,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2
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
}

interface ProgressUpdate {
  stage: string;
  current: number;
  total: number;
  message: string;
  timestamp: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function BrandKeywordTracker({ brandName, onKeywordsUpdate }: BrandKeywordTrackerProps) {
  const [keywords, setKeywords] = useState<KeywordPerformance[]>([]);
  const [summary, setSummary] = useState<BrandSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddKeywords, setShowAddKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [setupInProgress, setSetupInProgress] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);
  const [bulkImportMode, setBulkImportMode] = useState(false);
  const [bulkKeywords, setBulkKeywords] = useState('');
  
  // Progress tracking state
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    if (brandName) {
      loadBrandPerformance();
      checkFirstTimeSetup();
    }
  }, [brandName]);

  const checkFirstTimeSetup = async () => {
    // Check if we have any keywords for this brand
    const hasKeywords = keywords.length > 0;
    setIsFirstTimeSetup(!hasKeywords);
  };

  // Progress tracking functions
  const addLog = (level: LogEntry['level'], message: string) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID with timestamp + random
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const updateProgress = (stage: string, current: number, total: number, message: string) => {
    setProgress({
      stage,
      current,
      total,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
    addLog('info', `${stage}: ${message} (${current}/${total})`);
  };

  const clearProgress = () => {
    setProgress(null);
    setShowProgressModal(false);
  };

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

  const smartSetupAndTrack = async () => {
    setSetupInProgress(true);
    setShowProgressModal(true);
    setLogs([]);
    
    try {
      // Step 1: Find brand products if none exist
      if (isFirstTimeSetup || keywords.length === 0) {
        addLog('info', `First time setup: Discovering ${brandName} products...`);
        updateProgress('Setup', 10, 100, 'Discovering your products on Amazon...');
        
        const progressCallback = (message: string) => {
          addLog('info', message);
        };
        
        const count = await BrandKeywordService.prePopulateBrandASINs(brandName, progressCallback);
        
        if (count > 0) {
          addLog('success', `Found ${count} ${brandName} products!`);
          updateProgress('Setup', 30, 100, `Added ${count} products to database`);
          
          // Step 2: Find keywords where products rank
          addLog('info', 'Finding keywords where your products already rank...');
          updateProgress('Setup', 40, 100, 'Analyzing keyword rankings...');
          
          const suggestedKeywords = await BrandKeywordService.findRankingKeywords(brandName);
          
          if (suggestedKeywords.length > 0) {
            addLog('success', `Found ${suggestedKeywords.length} keywords where your products rank`);
            
            const keywordsToAdd = suggestedKeywords.map(kw => ({
              keyword: kw,
              search_volume: 1000,
              cpc: 1.0,
              competition: 0.5,
              difficulty: 50,
              relevance_score: 0.9,
              keyword_type: 'product' as const,
              source: 'auto_discovery' as const
            }));
            
            await BrandKeywordService.addBrandKeywords(brandName, keywordsToAdd);
            updateProgress('Setup', 60, 100, 'Keywords added to tracking list');
          }
        }
        
        // Import keywords from ASIN recommended keywords table
        addLog('info', 'Importing keywords from product analysis...');
        updateProgress('Setup', 65, 100, 'Loading product keywords...');
        
        const asinKeywords = await BrandKeywordService.getASINRecommendedKeywords(brandName);
        if (asinKeywords.length > 0) {
          addLog('success', `Found ${asinKeywords.length} keywords from product analysis`);
          await BrandKeywordService.addBrandKeywords(brandName, asinKeywords);
          addLog('success', `Imported ${asinKeywords.length} keywords from your products`);
        }
        
        // Also check localStorage for manual keyword research
        const savedKeywordResearch = localStorage.getItem('keywordResearchData');
        if (savedKeywordResearch) {
          try {
            const researchData = JSON.parse(savedKeywordResearch);
            if (researchData.keywords && Array.isArray(researchData.keywords)) {
              const importKeywords = researchData.keywords.map((kw: any) => ({
                keyword: kw.keyword || kw,
                search_volume: kw.searchVolume || kw.search_volume || 1000,
                cpc: kw.cpc || 1.0,
                competition: kw.competition || 0.5,
                difficulty: kw.keywordDifficulty || kw.difficulty || 50,
                relevance_score: 0.8,
                keyword_type: 'research' as const,
                source: 'keyword_research' as const
              }));
              
              if (importKeywords.length > 0) {
                await BrandKeywordService.addBrandKeywords(brandName, importKeywords);
                addLog('success', `Imported ${importKeywords.length} keywords from manual research`);
              }
            }
          } catch (error) {
            console.error('Error importing keyword research:', error);
          }
        }
        
        // Also get AI recommendations for generic keywords
        addLog('info', 'Getting AI recommendations for additional keywords...');
        updateProgress('Setup', 75, 100, 'Generating keyword recommendations...');
        
        const recommendations = await BrandKeywordService.generateKeywordRecommendations(
          brandName,
          keywords.map(k => k.keyword).slice(0, 5)
        );
        
        if (recommendations.length > 0) {
          await BrandKeywordService.addBrandKeywords(brandName, recommendations);
          addLog('success', `Added ${recommendations.length} recommended keywords`);
        }
      }
      
      // Step 3: Clean non-brand rankings automatically
      addLog('info', 'Cleaning up competitor product rankings...');
      updateProgress('Tracking', 80, 100, 'Removing non-brand results...');
      const cleanedCount = await BrandKeywordService.cleanupNonBrandRankings(brandName);
      if (cleanedCount > 0) {
        addLog('info', `Removed ${cleanedCount} competitor rankings`);
      }
      
      // Step 4: Track rankings
      addLog('info', 'Starting keyword ranking update...');
      updateProgress('Tracking', 90, 100, 'Tracking keyword rankings...');
      
      const progressCallback = (stage: string, current: number, total: number, message: string) => {
        updateProgress(stage, current, total, message);
      };
      
      const result = await BrandKeywordService.trackKeywordRankingsWithProgress(
        brandName, 
        undefined, 
        progressCallback
      );
      
      if (result) {
        addLog('success', 'All tracking completed successfully!');
        updateProgress('Complete', 100, 100, 'Setup and tracking complete');
        await loadBrandPerformance();
        setIsFirstTimeSetup(false);
      }
    } catch (error) {
      console.error('Error in smart setup:', error);
      addLog('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSetupInProgress(false);
      setTimeout(() => {
        if (progress?.current === progress?.total) {
          clearProgress();
        }
      }, 3000);
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

  const addBulkKeywords = async () => {
    if (!bulkKeywords.trim()) return;
    
    try {
      // Parse keywords - support comma, newline, or space separated
      const keywordList = bulkKeywords
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .filter((k, i, arr) => arr.indexOf(k) === i); // Remove duplicates
      
      if (keywordList.length === 0) {
        alert('No valid keywords found');
        return;
      }
      
      // Convert to keyword objects
      const keywordsToAdd = keywordList.map(keyword => ({
        keyword,
        search_volume: 1000, // Default, will be updated by tracking
        cpc: 1.0,
        competition: 0.5,
        difficulty: 50,
        relevance_score: 0.7,
        keyword_type: 'general' as const,
        source: 'bulk_import' as const
      }));
      
      const success = await BrandKeywordService.addBrandKeywords(brandName, keywordsToAdd);
      
      if (success) {
        setBulkKeywords('');
        setBulkImportMode(false);
        await loadBrandPerformance();
        alert(`Successfully added ${keywordList.length} keywords`);
      }
    } catch (error) {
      console.error('Error adding bulk keywords:', error);
      alert('Error adding keywords');
    }
  };

  const refreshRankings = async () => {
    setShowProgressModal(true);
    setLogs([]);
    
    try {
      addLog('info', `Refreshing rankings for ${brandName}...`);
      updateProgress('Refreshing', 0, 100, 'Starting ranking update...');
      
      // Check for new ASIN keywords
      addLog('info', 'Checking for new product keywords...');
      updateProgress('Refreshing', 10, 100, 'Looking for new keywords...');
      const asinKeywords = await BrandKeywordService.getASINRecommendedKeywords(brandName);
      if (asinKeywords.length > 0) {
        await BrandKeywordService.addBrandKeywords(brandName, asinKeywords);
        addLog('success', `Added ${asinKeywords.length} new keywords from products`);
      }
      
      // Clean non-brand rankings
      updateProgress('Refreshing', 20, 100, 'Cleaning competitor rankings...');
      const cleanedCount = await BrandKeywordService.cleanupNonBrandRankings(brandName);
      if (cleanedCount > 0) {
        addLog('info', `Cleaned ${cleanedCount} competitor rankings`);
      }
      
      // Track rankings
      updateProgress('Refreshing', 30, 100, 'Updating keyword rankings...');
      const progressCallback = (stage: string, current: number, total: number, message: string) => {
        updateProgress(stage, current, total, message);
      };
      
      const result = await BrandKeywordService.trackKeywordRankingsWithProgress(
        brandName, 
        undefined, 
        progressCallback
      );
      
      if (result) {
        addLog('success', 'Rankings refreshed successfully!');
        updateProgress('Complete', 100, 100, 'All rankings updated');
        await loadBrandPerformance();
      }
    } catch (error) {
      console.error('Error refreshing rankings:', error);
      addLog('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        if (progress?.current === progress?.total) {
          clearProgress();
        }
      }, 2000);
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
            {summary && (
              <div className="flex items-center gap-4 ml-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-yellow-500" />
                  {summary.ranking_keywords}/{summary.total_keywords} ranking
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  {summary.top_10_keywords} in top 10
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddKeywords(!showAddKeywords)}
              className="btn bg-gray-500 hover:bg-gray-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Keywords
            </button>
            {isFirstTimeSetup ? (
              <button
                onClick={smartSetupAndTrack}
                disabled={setupInProgress}
                className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
              >
                {setupInProgress ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Setup & Track
              </button>
            ) : (
              <button
                onClick={refreshRankings}
                disabled={setupInProgress}
                className="btn bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                {setupInProgress ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Rankings
              </button>
            )}
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
                  <p className="text-sm text-purple-600 dark:text-purple-400">Visibility Score</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {Math.round(summary.visibility_score).toLocaleString()}
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Add Keywords</h3>
              <button
                onClick={() => setBulkImportMode(!bulkImportMode)}
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                {bulkImportMode ? 'Single Mode' : 'Bulk Import'}
              </button>
            </div>
            
            {bulkImportMode ? (
              <div>
                <textarea
                  value={bulkKeywords}
                  onChange={(e) => setBulkKeywords(e.target.value)}
                  placeholder="Paste keywords here (one per line or comma-separated)...\n\nExample:\ncandles\npillar candles\nscented candles\nunscented candles\nsoy candles"
                  className="form-input w-full h-32 mb-2"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {bulkKeywords.split(/[,\n]/).filter(k => k.trim()).length} keywords detected
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkKeywords('')}
                      className="btn bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={addBulkKeywords}
                      className="btn bg-violet-500 hover:bg-violet-600 text-white"
                    >
                      Import All
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Copy keywords from the Keyword Research tab and paste them here
                </p>
              </div>
            ) : (
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
            )}
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
              {isFirstTimeSetup ? 'Ready to start tracking!' : 'No keywords tracked yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              {isFirstTimeSetup 
                ? 'Click "Setup & Track" to automatically discover your products and keywords'
                : 'Add keywords manually or refresh to update rankings'
              }
            </p>
            {isFirstTimeSetup && (
              <button
                onClick={smartSetupAndTrack}
                disabled={setupInProgress}
                className="btn bg-violet-500 hover:bg-violet-600 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Setup & Track
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Activity className="w-6 h-6 text-violet-500" />
                    {setupInProgress && (
                      <div className="absolute -bottom-1 -right-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isFirstTimeSetup ? 'Setting Up Keyword Tracking' : 'Refreshing Rankings'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {brandName} • {keywords.length} keywords
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearProgress}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={setupInProgress}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Progress Bar */}
              {progress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {progress.stage}
                      </span>
                      {progress.stage === 'Processing' && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {Math.round((progress.current / progress.total) * 100)}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {progress.current}/{progress.total}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {progress.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Started at {new Date().toLocaleTimeString()} • {progress.timestamp}
                    </p>
                  </div>
                </div>
              )}

              {/* Real-time Logs */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Activity Log
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {logs.length} entries
                  </span>
                </div>
                
                <div className="p-4 max-h-52 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2 font-mono text-xs">
                    {logs.length === 0 ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                        <p>Initializing tracking system...</p>
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 group hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2">
                          <span className="text-gray-400 dark:text-gray-500 min-w-[65px] tabular-nums">
                            {log.timestamp}
                          </span>
                          <div className="flex items-center gap-1.5 min-w-[18px]">
                            {log.level === 'success' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                            {log.level === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                            {log.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                            {log.level === 'info' && <div className="w-3 h-3 rounded-full bg-blue-500/80" />}
                          </div>
                          <span className={`flex-1 leading-relaxed ${
                            log.level === 'success' ? 'text-green-600 dark:text-green-400' :
                            log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                            log.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-gray-700 dark:text-gray-300'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                {progress?.current === progress?.total && !setupInProgress ? (
                  <button
                    onClick={clearProgress}
                    className="btn bg-green-500 hover:bg-green-600 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </button>
                ) : (
                  <button
                    onClick={clearProgress}
                    disabled={setupInProgress}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}