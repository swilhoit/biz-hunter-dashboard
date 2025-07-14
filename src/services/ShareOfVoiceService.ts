import { supabase } from '../lib/supabase';
import { BrandKeywordService } from './BrandKeywordService';
import { CompetitorAnalysisService } from './CompetitorAnalysisService';

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

export interface StoredShareOfVoiceReport {
  id: string;
  deal_id: string;
  brand_name: string;
  report_data: any;
  created_at: string;
  updated_at: string;
}

export class ShareOfVoiceService {
  /**
   * Calculate Share of Voice metrics for a brand using new brand tracking system
   */
  static async calculateShareOfVoice(brandName: string): Promise<ShareOfVoiceMetrics> {
    try {
      // Get brand keywords from the new brand tracking system
      const brandKeywords = await BrandKeywordService.getBrandKeywords(brandName);
      
      if (!brandKeywords || brandKeywords.length === 0) {
        throw new Error(`No keywords found for brand: ${brandName}. Please run keyword tracking first.`);
      }

      // Get detailed ranking data from keyword_rankings table
      const keywordIds = brandKeywords.map(k => k.id).filter(Boolean);
      const { data: rankingDetails, error } = await supabase
        .from('keyword_rankings' as any)
        .select('*')
        .in('brand_keyword_id', keywordIds)
        .eq('is_brand_result', true)
        .not('position', 'is', null);
      
      if (error) {
        console.error('Error fetching ranking details:', error);
      }

      // Create a map of keyword to brand positions
      const keywordPositionMap = new Map<string, number[]>();
      rankingDetails?.forEach(r => {
        const keyword = brandKeywords.find(k => k.id === r.brand_keyword_id);
        if (keyword) {
          const key = keyword.keyword.toLowerCase();
          if (!keywordPositionMap.has(key)) {
            keywordPositionMap.set(key, []);
          }
          keywordPositionMap.get(key)?.push(r.position);
        }
      });

      // Get competitor data for comparison
      const competitorData = await CompetitorAnalysisService.getMarketShareAnalysis(brandName);
      const ourBrandData = competitorData.find(c => 
        c.brand_name.toLowerCase() === brandName.toLowerCase()
      );

      // Calculate metrics using brand keywords data
      const totalSearchVolume = brandKeywords.reduce((sum, k) => sum + (k.search_volume || 0), 0);
      const keywordsWithRankings = brandKeywords.filter(k => {
        const positions = keywordPositionMap.get(k.keyword.toLowerCase()) || [];
        return positions.length > 0;
      });
      
      // Calculate weighted share of voice
      let weightedSoV = 0;
      const keywordBreakdown = brandKeywords.map(kw => {
        const positions = keywordPositionMap.get(kw.keyword.toLowerCase()) || [];
        const top10Positions = positions.filter(p => p <= 10).length;
        const dominanceScore = top10Positions > 0 ? (top10Positions / 10) * 100 : 0;
        
        // Calculate this keyword's contribution to overall SoV
        // Weight by search volume and dominance
        const volumeWeight = totalSearchVolume > 0 ? (kw.search_volume / totalSearchVolume) : 0;
        const contribution = dominanceScore * volumeWeight;
        weightedSoV += contribution;
        
        return {
          keyword: kw.keyword,
          search_volume: kw.search_volume || 0,
          dominance_score: dominanceScore,
          positions_owned: positions.sort((a, b) => a - b),
          contribution_to_sov: contribution * 100 // Convert to percentage
        };
      });
      
      // Calculate other metrics
      const avgDominanceScore = keywordBreakdown.reduce((sum, k) => sum + k.dominance_score, 0) / 
        (keywordBreakdown.length || 1);
      
      const top3Keywords = keywordBreakdown.filter(k => 
        k.positions_owned.some(p => p <= 3)
      ).length;
      
      const top10Keywords = keywordBreakdown.filter(k => 
        k.positions_owned.some(p => p <= 10)
      ).length;

      // Generate competitor comparison from our new competitor analysis
      const topCompetitors = competitorData
        .filter(c => c.brand_name.toLowerCase() !== brandName.toLowerCase())
        .slice(0, 5)
        .map(c => ({
          competitor: c.brand_name,
          share_of_voice: c.estimated_market_share,
          overlap_keywords: c.total_keywords
        }));
      
      return {
        brand: brandName,
        period: new Date().toISOString().split('T')[0],
        total_keywords_tracked: brandKeywords.length,
        keywords_with_rankings: keywordsWithRankings.length,
        total_search_volume: totalSearchVolume,
        weighted_share_of_voice: ourBrandData?.estimated_market_share || weightedSoV,
        average_dominance_score: avgDominanceScore,
        top_3_share: (top3Keywords / (brandKeywords.length || 1)) * 100,
        top_10_share: (top10Keywords / (brandKeywords.length || 1)) * 100,
        competitor_comparison: topCompetitors,
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

  /**
   * Check if a Share of Voice report exists for a deal
   */
  static async checkReportExists(dealId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_reports' as any)
        .select('id')
        .eq('deal_id', dealId)
        .limit(1);

      if (error) {
        console.error('Error checking for existing report:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkReportExists:', error);
      return false;
    }
  }

  /**
   * Get the latest Share of Voice report for a deal
   */
  static async getLatestReport(dealId: string): Promise<StoredShareOfVoiceReport | null> {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_reports' as any)
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLatestReport:', error);
      return null;
    }
  }

  /**
   * Save a Share of Voice report for a deal
   */
  static async saveReport(dealId: string, brandName: string, reportData: any): Promise<StoredShareOfVoiceReport | null> {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_reports' as any)
        .upsert({
          deal_id: dealId,
          brand_name: brandName,
          report_data: reportData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'deal_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveReport:', error);
      return null;
    }
  }

  /**
   * Generate a comprehensive Share of Voice report and store it
   * Integrates with brand keyword tracking and competitor analysis
   */
  static async generateAndStoreReport(
    dealId: string, 
    brandName: string, 
    category?: string, 
    isStoreUrl: boolean = false
  ): Promise<StoredShareOfVoiceReport | null> {
    try {
      console.log(`[ShareOfVoice] Generating comprehensive report for ${brandName}`);
      
      // Step 1: Ensure brand keywords are tracked
      const brandKeywords = await BrandKeywordService.getBrandKeywords(brandName);
      if (!brandKeywords || brandKeywords.length === 0) {
        console.log(`[ShareOfVoice] No brand keywords found. Setting up keywords for ${brandName}...`);
        
        // Try to get keywords from ASIN data if available
        const { data: asinKeywords } = await supabase
          .from('asin_keywords' as any)
          .select('keyword, search_volume, ppc_bid_exact')
          .eq('brand', brandName)
          .not('keyword', 'is', null)
          .gt('search_volume', 0)
          .limit(100);

        if (asinKeywords && asinKeywords.length > 0) {
          // Import keywords from ASIN data
          const keywordsToAdd = asinKeywords.map(kw => ({
            keyword: kw.keyword,
            search_volume: kw.search_volume || 1000,
            cpc: kw.ppc_bid_exact || 1.0,
            competition: 0.5,
            difficulty: 50,
            relevance_score: 0.8,
            keyword_type: 'product' as const,
            source: 'asin_import' as const
          }));

          await BrandKeywordService.addBrandKeywords(brandName, keywordsToAdd);
          console.log(`[ShareOfVoice] Added ${keywordsToAdd.length} keywords for ${brandName}`);
        } else {
          throw new Error(`No keywords available for brand: ${brandName}. Please run keyword analysis first.`);
        }
      }

      // Step 2: Track keyword rankings with competitor detection
      console.log(`[ShareOfVoice] Tracking keyword rankings for ${brandName}...`);
      const trackingResult = await BrandKeywordService.trackKeywordRankingsWithProgress(
        brandName,
        undefined, // Track all keywords
        (stage, current, total, message) => {
          console.log(`[ShareOfVoice] ${stage}: ${message} (${current}/${total})`);
        },
        100 // Full depth tracking
      );

      if (!trackingResult) {
        throw new Error(`Failed to track keyword rankings for ${brandName}`);
      }

      // Step 3: Generate Share of Voice metrics
      console.log(`[ShareOfVoice] Calculating Share of Voice metrics...`);
      const shareOfVoiceMetrics = await this.calculateShareOfVoice(brandName);

      // Step 4: Get competitor analysis data
      console.log(`[ShareOfVoice] Analyzing competitive landscape...`);
      const competitorInsights = await CompetitorAnalysisService.generateCompetitorInsights(brandName);
      const marketConcentration = await CompetitorAnalysisService.calculateMarketConcentration(brandName);

      // Step 5: Compile comprehensive report data
      const reportData = {
        shareOfVoice: shareOfVoiceMetrics,
        competitorAnalysis: {
          insights: competitorInsights,
          marketConcentration,
          generatedAt: new Date().toISOString()
        },
        metadata: {
          brandName,
          category,
          isStoreUrl,
          totalKeywordsTracked: shareOfVoiceMetrics.total_keywords_tracked,
          keywordsWithRankings: shareOfVoiceMetrics.keywords_with_rankings,
          competitorsDetected: competitorInsights.length,
          generatedAt: new Date().toISOString()
        }
      };

      // Step 6: Store the report
      console.log(`[ShareOfVoice] Storing comprehensive report...`);
      const storedReport = await this.saveReport(dealId, brandName, reportData);

      if (storedReport) {
        console.log(`[ShareOfVoice] ✅ Successfully generated and stored comprehensive report for ${brandName}`);
        console.log(`[ShareOfVoice] Report includes: ${shareOfVoiceMetrics.total_keywords_tracked} keywords, ${competitorInsights.length} competitors`);
      }

      return storedReport;
    } catch (error) {
      console.error('[ShareOfVoice] Error generating and storing report:', error);
      throw error;
    }
  }
}