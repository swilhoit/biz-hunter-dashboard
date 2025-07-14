/**
 * BrandKeywordsOverview Component
 * 
 * This component provides a brand-level view of keyword performance across all ASINs.
 * It aggregates keyword data from the asin_recommended_keywords table and shows
 * how many ASINs are ranking for each keyword.
 * 
 * Usage:
 * import { BrandKeywordsOverview } from './components/BrandKeywordsOverview';
 * 
 * // In your component or page:
 * <BrandKeywordsOverview brandName="Mister Candle" />
 * 
 * // Or without a brand (user can select from dropdown):
 * <BrandKeywordsOverview />
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Eye,
  BarChart3,
  Award,
  Package,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BrandKeywordService } from '../services/BrandKeywordService';
import { KeywordService } from '../services/KeywordService';

interface BrandKeywordsOverviewProps {
  brandName?: string;
  brandId?: string;
}

interface KeywordPerformance {
  keyword: string;
  total_asins: number;
  asins_ranking: string[];
  ranking_details: Array<{
    asin: string;
    position: number;
    title?: string;
  }>;
  best_position: number;
  avg_position: number;
  total_search_volume: number;
  keyword_type: string;
  relevance_score: number;
  competition: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  dominance_score: number; // % of top 10 positions owned by brand
}

interface BrandKeywordStats {
  total_keywords: number;
  keywords_with_rankings: number;
  total_asins_tracked: number;
  asins_with_rankings: number;
  avg_position_overall: number;
  top_10_keywords: number;
  total_search_volume: number;
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

export function BrandKeywordsOverview({ brandName: propBrandName, brandId: propBrandId }: BrandKeywordsOverviewProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>(propBrandName || '');
  const [selectedBrandId, setSelectedBrandId] = useState<string>(propBrandId || '');
  const [availableBrands, setAvailableBrands] = useState<Array<{id: string; name: string}>>([]);
  const [keywords, setKeywords] = useState<KeywordPerformance[]>([]);
  const [stats, setStats] = useState<BrandKeywordStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ranking' | 'not-ranking'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'position' | 'asins'>('volume');
  const [selectedKeywordDetails, setSelectedKeywordDetails] = useState<KeywordPerformance | null>(null);
  const [fetchingRankings, setFetchingRankings] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [hasSetupKeywords, setHasSetupKeywords] = useState(false);

  useEffect(() => {
    loadAvailableBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadBrandKeywordData();
      checkKeywordSetup();
    }
  }, [selectedBrand, filter]);

  // Progress tracking functions
  const addLog = (level: LogEntry['level'], message: string) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  const checkKeywordSetup = async () => {
    try {
      // Check if brand has keywords in brand_keywords table
      const { data, error } = await supabase
        .from('brand_keywords' as any)
        .select('id')
        .eq('brand_name', selectedBrand)
        .eq('is_active', true)
        .limit(1);
      
      console.log('[BrandKeywordsOverview] Checking keyword setup for:', selectedBrand);
      console.log('[BrandKeywordsOverview] Found keywords:', data?.length || 0);
      console.log('[BrandKeywordsOverview] hasSetupKeywords will be:', !!(data && data.length > 0));
      
      setHasSetupKeywords(!!(data && data.length > 0));
    } catch (error) {
      console.error('Error checking keyword setup:', error);
    }
  };

  const loadAvailableBrands = async () => {
    try {
      // Get unique brands from asins table
      const { data, error } = await supabase
        .from('asins')
        .select('brand')
        .not('brand', 'is', null)
        .order('brand');
      
      if (error) throw error;
      
      const uniqueBrands = [...new Set(data?.map(d => d.brand).filter(Boolean))];
      setAvailableBrands(uniqueBrands.map(brand => ({ id: brand, name: brand })));
      
      // Auto-select first brand if none selected
      if (!selectedBrand && uniqueBrands.length > 0) {
        setSelectedBrand(uniqueBrands[0]);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadBrandKeywordData = async () => {
    setLoading(true);
    try {
      // Try to use the optimized view first
      const { data: aggregatedData, error: viewError } = await supabase
        .from('brand_keyword_aggregate' as any)
        .select('*')
        .eq('brand', selectedBrand);
      
      if (!viewError && aggregatedData) {
        // Get detailed ranking information for each keyword from keyword_rankings table
        // First get the brand_keyword IDs for this brand
        const { data: brandKeywordIds } = await supabase
          .from('brand_keywords' as any)
          .select('id, keyword')
          .eq('brand_name', selectedBrand)
          .eq('is_active', true);
        
        const keywordIds = brandKeywordIds?.map(bk => bk.id) || [];
        const keywordIdMap = new Map(brandKeywordIds?.map(bk => [bk.id, bk.keyword]) || []);
        
        // Then get rankings for those keywords
        const { data: rankingDetails } = await supabase
          .from('keyword_rankings' as any)
          .select('brand_keyword_id, position, asin, title')
          .in('brand_keyword_id', keywordIds)
          .eq('is_brand_result', true)
          .not('position', 'is', null)
          .order('position');
        
        // Get search volume data from brand_keywords table (AI recommendations)
        const { data: brandKeywordData } = await supabase
          .from('brand_keywords' as any)
          .select('keyword, search_volume, competition, cpc, keyword_type')
          .eq('brand_name', selectedBrand)
          .eq('is_active', true);
        
        // Get ASINs for this brand first
        const { data: brandAsinData } = await supabase
          .from('asins')
          .select('id, asin')
          .eq('brand', selectedBrand);
        
        const asinIds = brandAsinData?.map(a => a.id) || [];
        const asinIdToAsinMap = new Map(brandAsinData?.map(a => [a.id, a.asin]) || []);
        
        // Get keywords from actual ASIN data
        const { data: asinKeywordData } = await supabase
          .from('asin_keywords' as any)
          .select('keyword, search_volume, rank_organic, rank_sponsored, ppc_bid_exact, asin_id')
          .in('asin_id', asinIds)
          .not('keyword', 'is', null)
          .gt('search_volume', 0);
        
        // Create a map of keyword to ranking details
        const rankingDetailsMap = new Map<string, Array<{asin: string; position: number; title?: string}>>();
        rankingDetails?.forEach((r: any) => {
          const keyword = keywordIdMap.get(r.brand_keyword_id);
          if (!keyword) return;
          
          const key = keyword.toLowerCase();
          if (!rankingDetailsMap.has(key)) {
            rankingDetailsMap.set(key, []);
          }
          rankingDetailsMap.get(key)?.push({
            asin: r.asin,
            position: r.position,
            title: r.title
          });
        });
        
        // Create a map to merge keyword data from both sources
        const allKeywordsMap = new Map<string, any>();
        
        // Add brand keywords (AI recommendations)
        brandKeywordData?.forEach((bk: any) => {
          const key = bk.keyword.toLowerCase();
          allKeywordsMap.set(key, {
            keyword: bk.keyword,
            search_volume: bk.search_volume || 0,
            competition: parseFloat(bk.competition) || 0,
            cpc: parseFloat(bk.cpc) || 0,
            keyword_type: bk.keyword_type || 'ai_recommendation',
            source: 'brand_keywords'
          });
        });
        
        // Add/merge ASIN keywords (actual product associations)
        asinKeywordData?.forEach((ak: any) => {
          const key = ak.keyword.toLowerCase();
          const asin = asinIdToAsinMap.get(ak.asin_id);
          
          if (allKeywordsMap.has(key)) {
            // Merge with existing data
            const existing = allKeywordsMap.get(key);
            existing.has_asin_data = true;
            existing.rank_organic = ak.rank_organic;
            existing.rank_sponsored = ak.rank_sponsored;
            // Add ASIN to ranking details if it has a rank
            if (ak.rank_organic && asin) {
              if (!rankingDetailsMap.has(key)) {
                rankingDetailsMap.set(key, []);
              }
              rankingDetailsMap.get(key)?.push({
                asin: asin,
                position: ak.rank_organic,
                title: ''
              });
            }
          } else {
            // New keyword from ASIN data
            allKeywordsMap.set(key, {
              keyword: ak.keyword,
              search_volume: ak.search_volume || 0,
              competition: 0, // No competition data in asin_keywords
              cpc: ak.ppc_bid_exact || 0,
              keyword_type: 'product_keyword',
              source: 'asin_keywords',
              has_asin_data: true,
              rank_organic: ak.rank_organic,
              rank_sponsored: ak.rank_sponsored
            });
            // Add to ranking details if has rank
            if (ak.rank_organic && asin) {
              rankingDetailsMap.set(key, [{
                asin: asin,
                position: ak.rank_organic,
                title: ''
              }]);
            }
          }
        });
        
        // Convert map to array and process
        const keywordData: KeywordPerformance[] = Array.from(allKeywordsMap.values())
          .map((kw: any) => {
            const details = rankingDetailsMap.get(kw.keyword.toLowerCase()) || [];
            const top10Count = details.filter(d => d.position <= 10).length;
            const dominanceScore = top10Count > 0 ? (top10Count / 10) * 100 : 0;
            const bestPosition = details.length > 0 ? Math.min(...details.map(d => d.position)) : 0;
            const avgPosition = details.length > 0 ? details.reduce((acc, d) => acc + d.position, 0) / details.length : 0;
            
            return {
              keyword: kw.keyword,
              total_asins: details.length,
              asins_ranking: details.map(d => d.asin),
              ranking_details: details,
              best_position: bestPosition || 0,
              avg_position: avgPosition || 0,
              total_search_volume: kw.search_volume || 0,
              keyword_type: kw.keyword_type || 'general',
              relevance_score: 0, // No fake relevance scores
              competition: kw.competition || 0,
              cpc: kw.cpc || 0,
              trend: 'stable' as 'up' | 'down' | 'stable',
              dominance_score: dominanceScore
            };
          })
          .filter(kw => {
            if (filter === 'ranking') return kw.asins_ranking.length > 0;
            if (filter === 'not-ranking') return kw.asins_ranking.length === 0;
            return true;
          });
          
        // Sort and set data
        keywordData.sort((a, b) => {
          switch (sortBy) {
            case 'position':
              if (a.best_position === 0) return 1;
              if (b.best_position === 0) return -1;
              return a.best_position - b.best_position;
            case 'asins':
              return b.total_asins - a.total_asins;
            default:
              return b.total_search_volume - a.total_search_volume;
          }
        });
        
        setKeywords(keywordData);
        
        // Calculate stats from brand keywords data
        const keywordsWithRankings = keywordData.filter(k => k.asins_ranking.length > 0);
        const allRankingAsins = new Set(keywordData.flatMap(k => k.asins_ranking));
        
        // Get total ASINs for the brand (not just those with rankings)
        const { data: brandAsins } = await supabase
          .from('asins')
          .select('asin')
          .eq('brand', selectedBrand);
        const totalAsinsForBrand = brandAsins?.length || 0;
        
        setStats({
          total_keywords: keywordData.length,
          keywords_with_rankings: keywordsWithRankings.length,
          total_asins_tracked: totalAsinsForBrand,
          asins_with_rankings: allRankingAsins.size,
          avg_position_overall: keywordsWithRankings.length > 0
            ? keywordsWithRankings.reduce((a, b) => a + b.avg_position, 0) / keywordsWithRankings.length
            : 0,
          top_10_keywords: keywordsWithRankings.filter(k => k.best_position > 0 && k.best_position <= 10).length,
          total_search_volume: keywordData.reduce((a, b) => a + b.total_search_volume, 0)
        });
        
        return;
      }
      
      // Fallback to manual aggregation if view doesn't exist
      console.log('View not available, falling back to manual aggregation');
      
      // Get all ASINs for the brand
      const { data: brandAsins, error: asinError } = await supabase
        .from('asins')
        .select('id, asin, title')
        .eq('brand', selectedBrand);
      
      if (asinError) throw asinError;
      
      const asinIds = brandAsins?.map(a => a.id) || [];
      const asinMap = new Map(brandAsins?.map(a => [a.id, a]) || []);
      
      // Get all recommended keywords for these ASINs
      const { data: asinKeywords, error: keywordError } = await supabase
        .from('asin_recommended_keywords')
        .select('*')
        .in('asin_id', asinIds);
      
      if (keywordError) throw keywordError;
      
      // Group keywords and aggregate data
      const keywordMap = new Map<string, any>();
      
      asinKeywords?.forEach(kw => {
        const key = kw.keyword.toLowerCase();
        if (!keywordMap.has(key)) {
          keywordMap.set(key, {
            keyword: kw.keyword,
            asins: new Set(),
            total_search_volume: 0,
            keyword_type: kw.search_intent || 'general',
            relevance_scores: [],
            competition: kw.google_competition || 0,
            cpc: kw.google_cpc || 0,
            monthly_trend: kw.monthly_trend || 0
          });
        }
        
        const data = keywordMap.get(key);
        data.asins.add(asinMap.get(kw.asin_id)?.asin);
        data.total_search_volume = Math.max(
          data.total_search_volume, 
          kw.amazon_search_volume || kw.google_search_volume || 0
        );
        if (kw.relevance_score) {
          data.relevance_scores.push(kw.relevance_score);
        }
      });
      
      // Get search volume data from brand_keywords table
      const { data: brandKeywordData } = await supabase
        .from('brand_keywords' as any)
        .select('keyword, search_volume, competition, cpc')
        .eq('brand_name', selectedBrand)
        .eq('is_active', true);
      
      // Create a map of keyword to search volume data
      const brandKeywordMap = new Map<string, {search_volume: number; competition: number; cpc: number}>();
      brandKeywordData?.forEach((bk: any) => {
        const key = bk.keyword.toLowerCase();
        brandKeywordMap.set(key, {
          search_volume: bk.search_volume || 0,
          competition: parseFloat(bk.competition) || 0,
          cpc: parseFloat(bk.cpc) || 0
        });
      });

      // Get ranking data from brand_keyword_performance
      const { data: rankings } = await supabase
        .from('brand_keyword_performance' as any)
        .select('keyword, position, asin')
        .eq('brand_name', selectedBrand)
        .not('position', 'is', null);
      
      // Create ranking map
      const rankingMap = new Map<string, any[]>();
      rankings?.forEach((r: any) => {
        const key = r.keyword.toLowerCase();
        if (!rankingMap.has(key)) {
          rankingMap.set(key, []);
        }
        rankingMap.get(key)?.push(r);
      });
      
      // Build final keyword performance data
      const keywordData: KeywordPerformance[] = Array.from(keywordMap.entries())
        .map(([key, data]) => {
          const rankings = rankingMap.get(key) || [];
          const positions = rankings.map(r => r.position).filter(p => p > 0);
          const rankingDetails = rankings.map(r => ({
            asin: r.asin,
            position: r.position,
            title: r.title
          })).filter(r => r.asin && r.position > 0);
          const top10Count = rankingDetails.filter(d => d.position <= 10).length;
          const dominanceScore = top10Count > 0 ? (top10Count / 10) * 100 : 0;
          const brandData = brandKeywordMap.get(key);
          
          return {
            keyword: data.keyword,
            total_asins: data.asins.size,
            asins_ranking: rankings.map(r => r.asin).filter(Boolean),
            ranking_details: rankingDetails,
            best_position: positions.length > 0 ? Math.min(...positions) : 0,
            avg_position: positions.length > 0 
              ? positions.reduce((a, b) => a + b, 0) / positions.length 
              : 0,
            total_search_volume: brandData?.search_volume || 0,
            keyword_type: data.keyword_type,
            relevance_score: data.relevance_scores.length > 0
              ? data.relevance_scores.reduce((a: number, b: number) => a + b, 0) / data.relevance_scores.length
              : 0,
            competition: brandData?.competition || 0,
            cpc: brandData?.cpc || 0,
            trend: (data.monthly_trend > 5 ? 'up' : data.monthly_trend < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
            dominance_score: dominanceScore
          };
        })
        .filter(kw => {
          if (filter === 'ranking') return kw.asins_ranking.length > 0;
          if (filter === 'not-ranking') return kw.asins_ranking.length === 0;
          return true;
        });
      
      // Sort data
      keywordData.sort((a, b) => {
        switch (sortBy) {
          case 'position':
            if (a.best_position === 0) return 1;
            if (b.best_position === 0) return -1;
            return a.best_position - b.best_position;
          case 'asins':
            return b.total_asins - a.total_asins;
          default:
            return b.total_search_volume - a.total_search_volume;
        }
      });
      
      setKeywords(keywordData);
      
      // Calculate stats
      const keywordsWithRankings = keywordData.filter(k => k.asins_ranking.length > 0);
      const allRankingAsins = new Set(keywordData.flatMap(k => k.asins_ranking));
      
      setStats({
        total_keywords: keywordData.length,
        keywords_with_rankings: keywordsWithRankings.length,
        total_asins_tracked: asinIds.length,
        asins_with_rankings: allRankingAsins.size,
        avg_position_overall: keywordsWithRankings.length > 0
          ? keywordsWithRankings.reduce((a, b) => a + b.avg_position, 0) / keywordsWithRankings.length
          : 0,
        top_10_keywords: keywordsWithRankings.filter(k => k.best_position <= 10).length,
        total_search_volume: keywordData.reduce((a, b) => a + b.total_search_volume, 0)
      });
      
    } catch (error) {
      console.error('Error loading keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupKeywordsFromASINData = async () => {
    if (!selectedBrand) return;
    
    setFetchingRankings(true);
    setShowProgressModal(true);
    setLogs([]);
    setProgress(null);
    
    try {
      addLog('info', `Setting up keywords for ${selectedBrand} from existing ASIN data...`);
      updateProgress('Setup', 0, 100, 'Gathering keywords from your ASINs...');
      
      // Get all ASINs for the brand
      const { data: brandAsins } = await supabase
        .from('asins')
        .select('id, asin')
        .eq('brand', selectedBrand);
      
      if (!brandAsins || brandAsins.length === 0) {
        addLog('error', 'No ASINs found for this brand');
        return;
      }
      
      const asinIds = brandAsins.map(a => a.id);
      addLog('success', `Found ${brandAsins.length} ASINs for ${selectedBrand}`);
      
      // Get all keywords from asin_keywords table
      updateProgress('Setup', 20, 100, 'Fetching keywords from ASIN data...');
      const { data: asinKeywords } = await supabase
        .from('asin_keywords' as any)
        .select('keyword, search_volume, ppc_bid_exact')
        .in('asin_id', asinIds)
        .not('keyword', 'is', null)
        .gt('search_volume', 0);
      
      if (!asinKeywords || asinKeywords.length === 0) {
        addLog('warning', 'No keywords found in ASIN data');
        return;
      }
      
      addLog('success', `Found ${asinKeywords.length} keywords from ASIN data`);
      updateProgress('Setup', 40, 100, 'Processing unique keywords...');
      
      // Deduplicate keywords
      const uniqueKeywordsMap = new Map<string, any>();
      asinKeywords.forEach((kw: any) => {
        const key = kw.keyword.toLowerCase();
        if (!uniqueKeywordsMap.has(key) || kw.search_volume > uniqueKeywordsMap.get(key).search_volume) {
          uniqueKeywordsMap.set(key, {
            keyword: kw.keyword,
            search_volume: kw.search_volume || 1000,
            cpc: kw.ppc_bid_exact || 1.0,
            competition: 0.5,
            difficulty: 50,
            relevance_score: 0.8,
            keyword_type: 'product',
            source: 'asin_import'
          });
        }
      });
      
      const keywordsToAdd = Array.from(uniqueKeywordsMap.values());
      addLog('info', `Processed ${keywordsToAdd.length} unique keywords`);
      
      // Add keywords to brand_keywords table
      updateProgress('Setup', 60, 100, `Adding ${keywordsToAdd.length} keywords to tracking...`);
      const success = await BrandKeywordService.addBrandKeywords(selectedBrand, keywordsToAdd);
      
      if (success) {
        addLog('success', `Successfully added ${keywordsToAdd.length} keywords for tracking`);
        updateProgress('Setup', 80, 100, 'Keywords added successfully');
        setHasSetupKeywords(true);
        
        // Reload the data
        updateProgress('Setup', 90, 100, 'Refreshing data...');
        await loadBrandKeywordData();
        await checkKeywordSetup();
        
        updateProgress('Complete', 100, 100, 'Keyword setup complete!');
        addLog('success', 'Setup complete! You can now fetch rankings.');
      } else {
        addLog('error', 'Failed to add keywords to tracking');
      }
      
    } catch (error) {
      console.error('Error setting up keywords:', error);
      addLog('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetchingRankings(false);
      setTimeout(() => {
        setShowProgressModal(false);
      }, 3000);
    }
  };

  const fetchRankingsForAllASINs = async () => {
    if (!selectedBrand) return;
    
    setFetchingRankings(true);
    setShowProgressModal(true);
    setLogs([]);
    setProgress(null);
    
    try {
      addLog('info', `Starting Amazon ranking update for ${selectedBrand}...`);
      
      // Use the same progress callback pattern as BrandKeywordTracker
      const progressCallback = (stage: string, current: number, total: number, message: string) => {
        updateProgress(stage, current, total, message);
        
        // Extract meaningful info from the message and add to logs
        if (message.includes('Successfully submitted')) {
          addLog('success', message);
        } else if (message.includes('Processing') || message.includes('Processed')) {
          addLog('info', message);
        } else if (message.includes('Error') || message.includes('Failed')) {
          addLog('error', message);
        } else if (message.includes('Warning')) {
          addLog('warning', message);
        } else if (message.includes('Complete') || message.includes('Successfully')) {
          addLog('success', message);
        } else if (message.includes('Found') || message.includes('Submitted')) {
          addLog('success', message);
        } else {
          addLog('info', message);
        }
      };
      
      // Use the existing BrandKeywordService that already handles Amazon rankings correctly
      const result = await BrandKeywordService.trackKeywordRankingsWithProgress(
        selectedBrand,
        undefined, // Track all keywords
        progressCallback,
        100 // Depth of 100 for thorough tracking
      );
      
      if (result) {
        addLog('success', 'All Amazon ranking tracking completed successfully!');
        updateProgress('Complete', 100, 100, 'Amazon ranking update complete');
        
        // Reload the keywords to show updated rankings
        await loadBrandKeywordData();
      } else {
        addLog('error', 'Tracking failed - please check your DataForSEO credentials');
      }
      
    } catch (error) {
      console.error('Error fetching rankings:', error);
      addLog('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetchingRankings(false);
      setTimeout(() => {
        if (progress?.current === progress?.total) {
          setShowProgressModal(false);
        }
      }, 3000);
    }
  };

  const exportToCSV = () => {
    const headers = ['Keyword', 'Search Volume', 'ASINs', 'Ranking ASINs', 'Best Position', 'Avg Position', 'Dominance', 'Competition', 'CPC', 'Ranking Details'];
    const rows = keywords.map(k => [
      k.keyword,
      k.total_search_volume,
      k.total_asins,
      k.asins_ranking.length,
      k.best_position || 'Not Ranking',
      k.avg_position ? k.avg_position.toFixed(1) : 'N/A',
      k.dominance_score > 0 ? k.dominance_score.toFixed(0) + '%' : '-',
      (k.competition * 100).toFixed(0) + '%',
      '$' + k.cpc.toFixed(2),
      k.ranking_details.map(d => `${d.asin} (#${d.position})`).join('; ') || '-'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBrand}-keywords-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Brand Keywords Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track keyword performance across all ASINs for your brand
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="form-select"
            >
              <option value="">Select Brand</option>
              {availableBrands.map(brand => (
                <option key={brand.id} value={brand.name}>{brand.name}</option>
              ))}
            </select>
            
            <button
              onClick={loadBrandKeywordData}
              disabled={!selectedBrand || loading}
              className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {(() => {
              console.log('[BrandKeywordsOverview] Button state:', { hasSetupKeywords, selectedBrand });
              return !hasSetupKeywords && selectedBrand ? (
                <button
                  onClick={setupKeywordsFromASINData}
                  disabled={fetchingRankings}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  <Plus className={`w-4 h-4 mr-2 ${fetchingRankings ? 'animate-pulse' : ''}`} />
                  {fetchingRankings ? 'Setting up...' : 'Setup Keywords'}
                </button>
              ) : (
                <button
                  onClick={fetchRankingsForAllASINs}
                  disabled={!selectedBrand || fetchingRankings || !hasSetupKeywords}
                  className="btn bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  title={!hasSetupKeywords ? 'Please setup keywords first' : ''}
                >
                  <Target className={`w-4 h-4 mr-2 ${fetchingRankings ? 'animate-pulse' : ''}`} />
                  {fetchingRankings ? 'Fetching Rankings...' : 'Fetch Rankings'}
                </button>
              );
            })()}
            
            <button
              onClick={exportToCSV}
              disabled={keywords.length === 0}
              className="btn bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Keywords</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {stats.total_keywords}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {stats.keywords_with_rankings} ranking
                </p>
              </div>
              <Search className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">ASINs Coverage</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {stats.asins_with_rankings}/{stats.total_asins_tracked}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {((stats.asins_with_rankings / stats.total_asins_tracked) * 100).toFixed(0)}% ranking
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Avg Position</p>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                  {stats.avg_position_overall > 0 ? Math.round(stats.avg_position_overall) : '-'}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {stats.top_10_keywords} in top 10
                </p>
              </div>
              <Target className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Search Volume</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {(stats.total_search_volume / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  monthly searches
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Keywords Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Keyword Performance Details
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="form-select text-sm"
                >
                  <option value="all">All Keywords</option>
                  <option value="ranking">Ranking Only</option>
                  <option value="not-ranking">Not Ranking</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-select text-sm"
                >
                  <option value="volume">Search Volume</option>
                  <option value="position">Best Position</option>
                  <option value="asins">ASIN Count</option>
                </select>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading keyword data...</p>
            </div>
          ) : keywords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100">Keyword</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-right">Volume</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-center">ASINs</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-center">Rankings</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-center">Dominance</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-center">Competition</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-right">CPC</th>
                    <th className="pb-3 font-medium text-gray-900 dark:text-gray-100 text-center">Trend</th>
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
                                  i < Math.round(keyword.relevance_score * 5) ? 'bg-violet-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-900 dark:text-gray-100">
                        {keyword.total_search_volume.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-300">{keyword.total_asins}</span>
                          {keyword.asins_ranking.length > 0 && (
                            <span className="text-green-600 dark:text-green-400">
                              ({keyword.asins_ranking.length})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {keyword.ranking_details.length > 0 ? (
                          <div className="space-y-1">
                            {keyword.ranking_details.slice(0, 2).map((detail, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className={`font-medium ${
                                  detail.position <= 10 ? 'text-green-600' : 
                                  detail.position <= 30 ? 'text-yellow-600' : 
                                  'text-gray-600'
                                }`}>
                                  #{detail.position}
                                </span>
                                <span className="text-gray-500 truncate max-w-[120px]" title={detail.title || detail.asin}>
                                  {detail.asin}
                                </span>
                              </div>
                            ))}
                            {keyword.ranking_details.length > 2 && (
                              <button
                                onClick={() => setSelectedKeywordDetails(keyword)}
                                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                              >
                                +{keyword.ranking_details.length - 2} more
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {keyword.dominance_score > 0 ? (
                          <div 
                            className="flex flex-col items-center cursor-help"
                            title={`${keyword.ranking_details.filter(d => d.position <= 10).length} of top 10 positions owned by your brand`}
                          >
                            <span className={`font-medium ${
                              keyword.dominance_score >= 30 ? 'text-green-600' : 
                              keyword.dominance_score >= 20 ? 'text-yellow-600' : 
                              'text-gray-600'
                            }`}>
                              {keyword.dominance_score.toFixed(0)}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  keyword.dominance_score >= 30 ? 'bg-green-500' :
                                  keyword.dominance_score >= 20 ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${keyword.dominance_score}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                keyword.competition > 0.7 ? 'bg-red-500' :
                                keyword.competition > 0.4 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${keyword.competition * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">
                        ${keyword.cpc.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        {keyword.trend === 'up' ? (
                          <ArrowUp className="w-4 h-4 text-green-500 mx-auto" />
                        ) : keyword.trend === 'down' ? (
                          <ArrowDown className="w-4 h-4 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {selectedBrand ? 'No keyword data found' : 'Select a brand to view keywords'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Make sure you have ASINs with recommended keywords for this brand
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ranking Details Modal */}
      {selectedKeywordDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedKeywordDetails(null)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Rankings for "{selectedKeywordDetails.keyword}"
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedKeywordDetails.ranking_details.length} ASINs ranking • 
                    Dominance Score: {selectedKeywordDetails.dominance_score.toFixed(0)}%
                  </p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-900 dark:text-gray-100">Position</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-900 dark:text-gray-100">ASIN</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-900 dark:text-gray-100">Title</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedKeywordDetails.ranking_details
                        .sort((a, b) => a.position - b.position)
                        .map((detail, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-2">
                              <span className={`font-medium ${
                                detail.position <= 10 ? 'text-green-600' : 
                                detail.position <= 30 ? 'text-yellow-600' : 
                                'text-gray-600'
                              }`}>
                                #{detail.position}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-xs">
                              {detail.asin}
                            </td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">
                              {detail.title || '-'}
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={() => setSelectedKeywordDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Fetching Keyword Rankings
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Brand: {selectedBrand}
                </span>
              </div>
              
              {/* Progress Bar */}
              {progress && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>{progress.stage}</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-violet-600 h-full rounded-full transition-all duration-300 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    >
                      {progress.total > 0 && Math.round((progress.current / progress.total) * 100)}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {progress.message}
                  </p>
                </div>
              )}
              
              {/* Activity Log */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-64 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Log</h4>
                <div className="space-y-1 text-xs font-mono">
                  {logs.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400">Waiting to start...</p>
                  )}
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {log.timestamp}
                      </span>
                      <span className={`
                        ${log.level === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                        ${log.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                        ${log.level === 'success' ? 'text-green-600 dark:text-green-400' : ''}
                        ${log.level === 'info' ? 'text-gray-700 dark:text-gray-300' : ''}
                      `}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                {progress?.stage === 'Complete' ? (
                  <button
                    onClick={() => setShowProgressModal(false)}
                    className="btn bg-green-500 hover:bg-green-600 text-white"
                  >
                    Complete
                  </button>
                ) : (
                  <button
                    onClick={() => setShowProgressModal(false)}
                    disabled={fetchingRankings}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
                  >
                    {fetchingRankings ? 'Processing...' : 'Close'}
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