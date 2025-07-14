import { supabase } from '../lib/supabase';

export interface CompetitorBrand {
  id: string;
  brand_name: string;
  first_detected_at: string;
  last_seen_at: string;
  detection_count: number;
  avg_position: number;
  total_keywords: number;
  top_10_keywords: number;
  estimated_market_share: number;
  is_tracked: boolean;
}

export interface CompetitorKeywordPresence {
  brand_name: string;
  keyword: string;
  best_position: number;
  product_count: number;
  search_volume: number;
}

export interface MarketShareAnalysis {
  brand_name: string;
  total_keywords: number;
  top_10_keywords: number;
  top_3_keywords: number;
  avg_position: number;
  total_search_volume: number;
  estimated_traffic: number;
  estimated_market_share: number;
}

export interface CompetitorInsight {
  brand_name: string;
  strength: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';
  market_share: number;
  key_advantages: string[];
  vulnerabilities: string[];
  trending: 'up' | 'down' | 'stable';
}

export class CompetitorAnalysisService {
  /**
   * Get all detected competitor brands for a specific brand's keywords
   */
  static async getCompetitorBrands(brandName: string): Promise<CompetitorBrand[]> {
    try {
      // First get all keywords for the brand
      const { data: brandKeywords } = await supabase
        .from('brand_keywords')
        .select('id')
        .eq('brand_name', brandName)
        .eq('is_active', true);

      if (!brandKeywords || brandKeywords.length === 0) {
        return [];
      }

      const keywordIds = brandKeywords.map(k => k.id);

      // Get all unique competitor brands from keyword rankings
      const { data: competitors, error } = await supabase
        .from('keyword_rankings' as any)
        .select('detected_brand')
        .in('brand_keyword_id', keywordIds)
        .eq('is_competitor', true)
        .not('detected_brand', 'is', null)
        .order('detected_brand');

      if (error) {
        console.error('Error fetching competitor brands:', error);
        return [];
      }

      // Get unique brands and their metrics
      const uniqueBrands = [...new Set(competitors?.map(c => c.detected_brand) || [])];
      
      // Fetch detailed metrics for each competitor brand
      const competitorMetrics = await Promise.all(
        uniqueBrands.map(async (competitorBrand) => {
          const { data: metrics } = await supabase
            .from('competitor_brands' as any)
            .select('*')
            .eq('brand_name', competitorBrand)
            .single();

          return metrics || {
            brand_name: competitorBrand,
            detection_count: 0,
            avg_position: 0,
            total_keywords: 0,
            top_10_keywords: 0,
            estimated_market_share: 0
          };
        })
      );

      return competitorMetrics.sort((a, b) => 
        (b.estimated_market_share || 0) - (a.estimated_market_share || 0)
      );
    } catch (error) {
      console.error('Error in getCompetitorBrands:', error);
      return [];
    }
  }

  /**
   * Get market share analysis for all brands (including the tracked brand)
   */
  static async getMarketShareAnalysis(brandName: string): Promise<MarketShareAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('competitor_market_share_analysis' as any)
        .select('*')
        .order('estimated_market_share', { ascending: false });

      if (error) {
        console.error('Error fetching market share analysis:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMarketShareAnalysis:', error);
      return [];
    }
  }

  /**
   * Get keyword-level competitive analysis
   */
  static async getKeywordCompetitiveAnalysis(brandName: string): Promise<any[]> {
    try {
      // Get brand keywords
      const { data: brandKeywords } = await supabase
        .from('brand_keywords')
        .select('id, keyword, search_volume')
        .eq('brand_name', brandName)
        .eq('is_active', true);

      if (!brandKeywords || brandKeywords.length === 0) {
        return [];
      }

      // For each keyword, get competitive landscape
      const keywordAnalysis = await Promise.all(
        brandKeywords.map(async (keyword) => {
          // Get all rankings for this keyword
          const { data: rankings } = await supabase
            .from('keyword_rankings' as any)
            .select('position, detected_brand, asin, title')
            .eq('brand_keyword_id', keyword.id)
            .lte('position', 20) // Top 20 results
            .order('position');

          // Calculate brand distribution
          const brandDistribution = new Map<string, number>();
          let ourBrandPositions: number[] = [];

          rankings?.forEach(ranking => {
            const brand = ranking.detected_brand || 'Unknown';
            brandDistribution.set(brand, (brandDistribution.get(brand) || 0) + 1);
            
            if (brand.toLowerCase() === brandName.toLowerCase()) {
              ourBrandPositions.push(ranking.position);
            }
          });

          // Calculate competitive intensity (how many different brands in top 20)
          const competitiveIntensity = brandDistribution.size;
          const dominantBrand = Array.from(brandDistribution.entries())
            .sort((a, b) => b[1] - a[1])[0];

          return {
            keyword: keyword.keyword,
            search_volume: keyword.search_volume,
            our_best_position: Math.min(...ourBrandPositions) || null,
            our_product_count: ourBrandPositions.length,
            competitive_intensity: competitiveIntensity,
            dominant_brand: dominantBrand?.[0] || 'None',
            dominant_brand_products: dominantBrand?.[1] || 0,
            top_competitors: Array.from(brandDistribution.entries())
              .filter(([brand]) => brand.toLowerCase() !== brandName.toLowerCase())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([brand, count]) => ({ brand, count }))
          };
        })
      );

      return keywordAnalysis.sort((a, b) => b.search_volume - a.search_volume);
    } catch (error) {
      console.error('Error in getKeywordCompetitiveAnalysis:', error);
      return [];
    }
  }

  /**
   * Generate competitive insights and recommendations
   */
  static async generateCompetitorInsights(brandName: string): Promise<CompetitorInsight[]> {
    try {
      const marketShare = await this.getMarketShareAnalysis(brandName);
      const competitors = await this.getCompetitorBrands(brandName);
      
      const insights: CompetitorInsight[] = [];

      for (const competitor of competitors.slice(0, 10)) { // Top 10 competitors
        const competitorData = marketShare.find(m => 
          m.brand_name.toLowerCase() === competitor.brand_name.toLowerCase()
        );

        if (!competitorData) continue;

        // Determine strength based on market share and keyword coverage
        let strength: CompetitorInsight['strength'] = 'Weak';
        if (competitorData.estimated_market_share > 20) strength = 'Very Strong';
        else if (competitorData.estimated_market_share > 10) strength = 'Strong';
        else if (competitorData.estimated_market_share > 5) strength = 'Moderate';

        // Analyze advantages and vulnerabilities
        const advantages: string[] = [];
        const vulnerabilities: string[] = [];

        // Market share analysis
        if (competitorData.estimated_market_share > 15) {
          advantages.push('Dominant market position');
        }

        // Keyword coverage analysis
        if (competitorData.top_3_keywords > 10) {
          advantages.push('Strong top 3 rankings');
        } else if (competitorData.top_3_keywords < 5) {
          vulnerabilities.push('Weak top 3 presence');
        }

        if (competitorData.total_keywords > 50) {
          advantages.push('Broad keyword coverage');
        } else if (competitorData.total_keywords < 20) {
          vulnerabilities.push('Limited keyword reach');
        }

        // Position analysis
        if (competitorData.avg_position < 15) {
          advantages.push('Excellent average ranking');
        } else if (competitorData.avg_position > 30) {
          vulnerabilities.push('Poor average ranking');
        }

        // Determine trending (simplified - in production, compare with historical data)
        const trending: CompetitorInsight['trending'] = 
          competitorData.top_10_keywords > competitorData.total_keywords * 0.4 ? 'up' :
          competitorData.top_10_keywords < competitorData.total_keywords * 0.2 ? 'down' : 
          'stable';

        insights.push({
          brand_name: competitor.brand_name,
          strength,
          market_share: competitorData.estimated_market_share,
          key_advantages: advantages,
          vulnerabilities,
          trending
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating competitor insights:', error);
      return [];
    }
  }

  /**
   * Calculate market concentration (Herfindahl Index)
   */
  static async calculateMarketConcentration(brandName: string): Promise<{
    hhi: number;
    concentration_level: 'Low' | 'Moderate' | 'High';
    top_3_share: number;
    top_5_share: number;
  }> {
    try {
      const marketShare = await this.getMarketShareAnalysis(brandName);
      
      // Calculate HHI (sum of squared market shares)
      const hhi = marketShare.reduce((sum, brand) => {
        return sum + Math.pow(brand.estimated_market_share, 2);
      }, 0);

      // Calculate top brand shares
      const sortedByShare = marketShare.sort((a, b) => 
        b.estimated_market_share - a.estimated_market_share
      );
      
      const top_3_share = sortedByShare.slice(0, 3)
        .reduce((sum, b) => sum + b.estimated_market_share, 0);
      
      const top_5_share = sortedByShare.slice(0, 5)
        .reduce((sum, b) => sum + b.estimated_market_share, 0);

      // Determine concentration level
      let concentration_level: 'Low' | 'Moderate' | 'High' = 'Low';
      if (hhi > 2500) concentration_level = 'High';
      else if (hhi > 1500) concentration_level = 'Moderate';

      return {
        hhi: Math.round(hhi),
        concentration_level,
        top_3_share: Math.round(top_3_share * 10) / 10,
        top_5_share: Math.round(top_5_share * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating market concentration:', error);
      return {
        hhi: 0,
        concentration_level: 'Low',
        top_3_share: 0,
        top_5_share: 0
      };
    }
  }
}