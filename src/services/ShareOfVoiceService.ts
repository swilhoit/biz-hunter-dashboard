import { supabase } from '../lib/supabase';

export interface ShareOfVoiceMetrics {
  brand: string;
  period: string;
  total_keywords_tracked: number;
  keywords_with_rankings: number;
  total_search_volume: number;
  weighted_share_of_voice: number; // Overall SoV weighted by search volume
  average_dominance_score: number; // Average % of top 10 positions owned
  top_3_share: number; // % of keywords where brand owns position 1-3
  top_10_share: number; // % of keywords where brand has at least one top 10 position
  competitor_comparison?: Array<{
    competitor: string;
    share_of_voice: number;
    overlap_keywords: number;
  }>;
  keyword_breakdown: Array<{
    keyword: string;
    search_volume: number;
    dominance_score: number;
    positions_owned: number[];
    contribution_to_sov: number; // This keyword's contribution to overall SoV
  }>;
}

export class ShareOfVoiceService {
  /**
   * Calculate Share of Voice metrics for a brand
   */
  static async calculateShareOfVoice(brandName: string): Promise<ShareOfVoiceMetrics> {
    try {
      // Get brand keyword aggregate data
      const { data: aggregateData, error } = await supabase
        .from('brand_keyword_aggregate')
        .select('*')
        .eq('brand', brandName);
      
      if (error) throw error;
      
      // Get detailed ranking positions
      const { data: rankingDetails } = await supabase
        .from('brand_keyword_performance')
        .select('keyword, position, asin')
        .eq('brand_name', brandName)
        .eq('is_brand_result', true)
        .not('position', 'is', null);
      
      // Create a map of keyword to positions
      const keywordPositionMap = new Map<string, number[]>();
      rankingDetails?.forEach(r => {
        const key = r.keyword.toLowerCase();
        if (!keywordPositionMap.has(key)) {
          keywordPositionMap.set(key, []);
        }
        keywordPositionMap.get(key)?.push(r.position);
      });
      
      // Calculate metrics
      const keywordsWithRankings = aggregateData?.filter(k => k.asins_ranking > 0) || [];
      const totalSearchVolume = aggregateData?.reduce((sum, k) => sum + (k.search_volume || 0), 0) || 0;
      
      // Calculate weighted share of voice
      let weightedSoV = 0;
      const keywordBreakdown = aggregateData?.map(kw => {
        const positions = keywordPositionMap.get(kw.keyword.toLowerCase()) || [];
        const top10Positions = positions.filter(p => p <= 10).length;
        const dominanceScore = top10Positions > 0 ? (top10Positions / 10) * 100 : 0;
        
        // Calculate this keyword's contribution to overall SoV
        // Weight by search volume and dominance
        const volumeWeight = kw.search_volume / totalSearchVolume;
        const contribution = dominanceScore * volumeWeight;
        weightedSoV += contribution;
        
        return {
          keyword: kw.keyword,
          search_volume: kw.search_volume || 0,
          dominance_score: dominanceScore,
          positions_owned: positions.sort((a, b) => a - b),
          contribution_to_sov: contribution * 100 // Convert to percentage
        };
      }) || [];
      
      // Calculate other metrics
      const avgDominanceScore = keywordBreakdown.reduce((sum, k) => sum + k.dominance_score, 0) / 
        (keywordBreakdown.length || 1);
      
      const top3Keywords = keywordBreakdown.filter(k => 
        k.positions_owned.some(p => p <= 3)
      ).length;
      
      const top10Keywords = keywordBreakdown.filter(k => 
        k.positions_owned.some(p => p <= 10)
      ).length;
      
      return {
        brand: brandName,
        period: new Date().toISOString().split('T')[0],
        total_keywords_tracked: aggregateData?.length || 0,
        keywords_with_rankings: keywordsWithRankings.length,
        total_search_volume: totalSearchVolume,
        weighted_share_of_voice: weightedSoV,
        average_dominance_score: avgDominanceScore,
        top_3_share: (top3Keywords / (aggregateData?.length || 1)) * 100,
        top_10_share: (top10Keywords / (aggregateData?.length || 1)) * 100,
        keyword_breakdown: keywordBreakdown
          .filter(k => k.dominance_score > 0)
          .sort((a, b) => b.contribution_to_sov - a.contribution_to_sov)
          .slice(0, 50) // Top 50 contributors
      };
    } catch (error) {
      console.error('Error calculating share of voice:', error);
      throw error;
    }
  }
  
  /**
   * Compare share of voice between multiple brands
   */
  static async compareShareOfVoice(brands: string[]): Promise<Map<string, ShareOfVoiceMetrics>> {
    const results = new Map<string, ShareOfVoiceMetrics>();
    
    for (const brand of brands) {
      try {
        const metrics = await this.calculateShareOfVoice(brand);
        results.set(brand, metrics);
      } catch (error) {
        console.error(`Error calculating SoV for ${brand}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Track share of voice changes over time
   */
  static async getShareOfVoiceTrend(brandName: string, days: number = 30): Promise<Array<{
    date: string;
    share_of_voice: number;
    keywords_tracked: number;
  }>> {
    // This would need historical data storage
    // For now, return current snapshot
    const current = await this.calculateShareOfVoice(brandName);
    
    return [{
      date: current.period,
      share_of_voice: current.weighted_share_of_voice,
      keywords_tracked: current.total_keywords_tracked
    }];
  }
}