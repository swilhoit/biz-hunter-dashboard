import { supabase } from '../lib/supabase';
import { 
  ShareOfVoiceReport, 
  BrandShareOfVoice,
  generateBrandShareOfVoiceReport,
  generateShareOfVoiceReportFromStoreURL 
} from '../utils/shareOfVoiceAnalysis';
import { fetchProductDatabaseQuery } from '../utils/explorer/junglescout';

export interface StoredShareOfVoiceReport {
  id: string;
  deal_id: string;
  brand_name: string;
  category?: string;
  analysis_date: string;
  total_market_revenue: number;
  total_brands: number;
  total_products: number;
  avg_products_per_brand: number;
  concentration_index: number;
  brand_market_share: number;
  brand_revenue: number;
  brand_units_sold: number;
  brand_product_count: number;
  brand_avg_rating: number;
  brand_avg_reviews: number;
  brand_keyword_share: number;
  brand_rank: number;
  top_brands: any;
  keyword_analysis: any;
  category_distribution: any;
  created_at: string;
  updated_at: string;
}

interface KeywordShareAnalysis {
  keyword: string;
  searchVolume: number;
  brandProducts: number;
  totalProducts: number;
  brandRevenue: number;
  totalRevenue: number;
  salesShare: number;
  listingShare: number;
}

interface BrandKeywordAnalysis {
  brand: string;
  keywords: KeywordShareAnalysis[];
  overallSalesShare: number;
  overallListingShare: number;
  keywordsCovered: number;
  totalKeywords: number;
  avgPosition: number;
  topCompetitors: {
    brand: string;
    salesShare: number;
    listingShare: number;
    keywordOverlap: number;
    uniqueASINs: number;
  }[];
}

export class ShareOfVoiceService {
  /**
   * Check if a share of voice report exists for a deal
   */
  static async checkReportExists(dealId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_reports')
        .select('id, analysis_date')
        .eq('deal_id', dealId)
        .order('analysis_date', { ascending: false })
        .limit(1);

      if (error) {
        // If table doesn't exist (404), return false instead of throwing
        if (error.code === '42P01' || error.message?.includes('404')) {
          console.warn('Share of voice tables not found. Please run migrations.');
          return false;
        }
        console.error('Error checking report existence:', error);
        return false;
      }

      // Check if report exists and is less than 7 days old
      if (data && data.length > 0) {
        const reportDate = new Date(data[0].analysis_date);
        const daysSinceReport = (Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceReport < 7; // Consider report valid for 7 days
      }

      return false;
    } catch (error) {
      console.error('Error checking report existence:', error);
      return false;
    }
  }

  /**
   * Get the latest share of voice report for a deal
   */
  static async getLatestReport(dealId: string): Promise<StoredShareOfVoiceReport | null> {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_reports')
        .select('*')
        .eq('deal_id', dealId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // PGRST116 means no rows returned, which is fine
        // 42P01 or 404 means table doesn't exist
        if (error.code === 'PGRST116') {
          return null;
        }
        if (error.code === '42P01' || error.message?.includes('404')) {
          console.warn('Share of voice tables not found. Please run migrations.');
          return null;
        }
        console.error('Error fetching report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  }

  /**
   * Generate and store a new share of voice report for a deal
   */
  static async generateAndStoreReport(
    dealId: string,
    brandNameOrStoreUrl: string,
    category?: string,
    isStoreUrl: boolean = false
  ): Promise<StoredShareOfVoiceReport | null> {
    try {
      // Generate the report
      let result: { brandData: BrandShareOfVoice; marketReport: ShareOfVoiceReport };
      
      if (isStoreUrl) {
        result = await generateShareOfVoiceReportFromStoreURL(brandNameOrStoreUrl, category);
      } else {
        result = await generateBrandShareOfVoiceReport(brandNameOrStoreUrl, category);
      }

      const { brandData, marketReport } = result;

      // Find brand rank
      const brandRank = marketReport.topBrands.findIndex(b => b.brand === brandData.brand) + 1;

      // Prepare report data
      const reportData = {
        deal_id: dealId,
        brand_name: brandData.brand,
        category: category || marketReport.category,
        total_market_revenue: marketReport.totalMarketRevenue,
        total_brands: marketReport.competitiveLandscape.totalBrands,
        total_products: marketReport.competitiveLandscape.totalProducts,
        avg_products_per_brand: marketReport.competitiveLandscape.avgProductsPerBrand,
        concentration_index: marketReport.competitiveLandscape.concentrationIndex,
        brand_market_share: brandData.marketShare,
        brand_revenue: brandData.totalRevenue,
        brand_units_sold: brandData.totalUnits,
        brand_product_count: brandData.productCount,
        brand_avg_rating: brandData.avgRating,
        brand_avg_reviews: brandData.avgReviews,
        brand_keyword_share: brandData.keywordShare,
        brand_rank: brandRank,
        top_brands: marketReport.topBrands,
        keyword_analysis: marketReport.keywordAnalysis,
        category_distribution: brandData.categoryDistribution
      };

      // Store the main report
      const { data: report, error: reportError } = await supabase
        .from('share_of_voice_reports')
        .insert(reportData)
        .select()
        .single();

      if (reportError) {
        console.error('Error storing report:', reportError);
        throw reportError;
      }

      // Store competitor data
      if (report && marketReport.topBrands.length > 0) {
        const competitorData = marketReport.topBrands.map((brand, index) => ({
          report_id: report.id,
          brand_name: brand.brand,
          market_share: brand.marketShare,
          revenue: brand.totalRevenue,
          units_sold: brand.totalUnits,
          product_count: brand.productCount,
          avg_rating: brand.avgRating,
          avg_reviews: brand.avgReviews,
          keyword_share: brand.keywordShare,
          rank: index + 1
        }));

        const { error: competitorError } = await supabase
          .from('share_of_voice_competitors')
          .insert(competitorData);

        if (competitorError) {
          console.error('Error storing competitor data:', competitorError);
        }
      }

      // Store keyword data
      if (report && marketReport.keywordAnalysis.length > 0) {
        const keywordData = marketReport.keywordAnalysis.map(kw => ({
          report_id: report.id,
          keyword: kw.keyword,
          search_volume: kw.searchVolume,
          brand_product_count: kw.brandProductCount,
          total_product_count: kw.totalProductCount,
          share_percentage: kw.sharePercentage
        }));

        const { error: keywordError } = await supabase
          .from('share_of_voice_keywords')
          .insert(keywordData);

        if (keywordError) {
          console.error('Error storing keyword data:', keywordError);
        }
      }

      return report;
    } catch (error) {
      console.error('Error generating and storing report:', error);
      return null;
    }
  }

  /**
   * Get competitor data for a report
   */
  static async getCompetitorData(reportId: string) {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_competitors')
        .select('*')
        .eq('report_id', reportId)
        .order('rank');

      if (error) {
        console.error('Error fetching competitor data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching competitor data:', error);
      return [];
    }
  }

  /**
   * Get keyword data for a report
   */
  static async getKeywordData(reportId: string) {
    try {
      const { data, error } = await supabase
        .from('share_of_voice_keywords')
        .select('*')
        .eq('report_id', reportId)
        .order('search_volume', { ascending: false });

      if (error) {
        console.error('Error fetching keyword data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching keyword data:', error);
      return [];
    }
  }

  /**
   * Delete old reports for a deal (keep only the latest)
   */
  static async cleanupOldReports(dealId: string, keepCount: number = 1) {
    try {
      // Get all reports for the deal
      const { data: reports, error: fetchError } = await supabase
        .from('share_of_voice_reports')
        .select('id')
        .eq('deal_id', dealId)
        .order('analysis_date', { ascending: false });

      if (fetchError || !reports) {
        console.error('Error fetching reports for cleanup:', fetchError);
        return;
      }

      // Keep only the latest reports
      if (reports.length > keepCount) {
        const reportsToDelete = reports.slice(keepCount).map(r => r.id);
        
        const { error: deleteError } = await supabase
          .from('share_of_voice_reports')
          .delete()
          .in('id', reportsToDelete);

        if (deleteError) {
          console.error('Error deleting old reports:', deleteError);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
    }
  }

  /**
   * Analyze share of voice using recommended keywords from a brand
   * This fetches ASIN results for each recommended keyword and calculates market share
   */
  static async analyzeShareOfVoiceFromRecommendedKeywords(
    brandName: string,
    limit: number = 20
  ): Promise<BrandKeywordAnalysis> {
    try {
      // Step 1: Get all ASINs for this brand
      const { data: brandAsins, error: asinError } = await supabase
        .from('asins')
        .select('id, asin')
        .eq('brand', brandName);

      if (asinError) throw asinError;
      
      if (!brandAsins || brandAsins.length === 0) {
        throw new Error(`No ASINs found for brand: ${brandName}`);
      }

      // Step 2: Get recommended keywords for this brand's ASINs
      const asinIds = brandAsins.map(a => a.id);
      const { data: recommendedKeywords, error: keywordError } = await supabase
        .from('asin_recommended_keywords')
        .select('keyword, search_volume')
        .in('asin_id', asinIds)
        .order('search_volume', { ascending: false })
        .limit(limit);

      if (keywordError) throw keywordError;

      if (!recommendedKeywords || recommendedKeywords.length === 0) {
        throw new Error(`No recommended keywords found for brand: ${brandName}. Generate keywords first.`);
      }

      // Get unique keywords with highest search volume
      const uniqueKeywords = new Map<string, number>();
      recommendedKeywords.forEach(kw => {
        if (!uniqueKeywords.has(kw.keyword)) {
          uniqueKeywords.set(kw.keyword, kw.search_volume || 0);
        }
      });

      console.log(`[ShareOfVoice] Analyzing ${uniqueKeywords.size} keywords for brand: ${brandName}`);

      // Step 3: For each keyword, fetch ASIN results from JungleScout
      const keywordAnalyses: KeywordShareAnalysis[] = [];
      const brandMetrics = {
        totalRevenue: 0,
        totalListings: new Set<string>(),
        positions: [] as number[],
        keywordsCovered: 0
      };

      const competitorData = new Map<string, {
        revenue: number;
        listings: Set<string>;
        keywordOverlap: number;
      }>();

      for (const [keyword, searchVolume] of uniqueKeywords) {
        try {
          console.log(`[ShareOfVoice] Fetching results for keyword: "${keyword}"`);
          
          // Use JungleScout API to search for products
          const searchResults = await fetchProductDatabaseQuery({
            includeKeywords: [keyword],
            marketplace: 'us',
            pageSize: 50, // Get top 50 results
            excludeUnavailableProducts: true
          });

          if (searchResults?.data && searchResults.data.length > 0) {
            let keywordBrandRevenue = 0;
            let keywordTotalRevenue = 0;
            let keywordBrandProducts = 0;
            const keywordBrandASINs = new Set<string>();

            searchResults.data.forEach((product: any, index: number) => {
              const productBrand = product.attributes.brand || 'Unknown';
              const revenue = product.attributes.approximate_30_day_revenue || 0;
              const asin = product.id;

              keywordTotalRevenue += revenue;

              // Track competitor data
              if (productBrand !== brandName) {
                if (!competitorData.has(productBrand)) {
                  competitorData.set(productBrand, {
                    revenue: 0,
                    listings: new Set(),
                    keywordOverlap: 0
                  });
                }
                const competitor = competitorData.get(productBrand)!;
                competitor.revenue += revenue;
                competitor.listings.add(asin);
              }

              // Check if this is the target brand
              if (productBrand === brandName) {
                keywordBrandRevenue += revenue;
                keywordBrandProducts++;
                keywordBrandASINs.add(asin);
                brandMetrics.totalListings.add(asin);
                brandMetrics.positions.push(index + 1);
              }
            });

            if (keywordBrandProducts > 0) {
              brandMetrics.keywordsCovered++;
              brandMetrics.totalRevenue += keywordBrandRevenue;

              // Increment keyword overlap for competitors appearing in same keywords
              competitorData.forEach(competitor => {
                competitor.keywordOverlap++;
              });
            }

            const analysis: KeywordShareAnalysis = {
              keyword,
              searchVolume,
              brandProducts: keywordBrandProducts,
              totalProducts: searchResults.data.length,
              brandRevenue: keywordBrandRevenue,
              totalRevenue: keywordTotalRevenue,
              salesShare: keywordTotalRevenue > 0 ? (keywordBrandRevenue / keywordTotalRevenue) * 100 : 0,
              listingShare: searchResults.data.length > 0 ? (keywordBrandProducts / searchResults.data.length) * 100 : 0
            };

            keywordAnalyses.push(analysis);
          }
        } catch (error) {
          console.error(`[ShareOfVoice] Error fetching results for keyword "${keyword}":`, error);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Calculate overall metrics
      const totalMarketRevenue = keywordAnalyses.reduce((sum, ka) => sum + ka.totalRevenue, 0);
      const totalMarketListings = keywordAnalyses.reduce((sum, ka) => sum + ka.totalProducts, 0);
      
      const overallSalesShare = totalMarketRevenue > 0 ? (brandMetrics.totalRevenue / totalMarketRevenue) * 100 : 0;
      const overallListingShare = totalMarketListings > 0 ? (brandMetrics.totalListings.size / totalMarketListings) * 100 : 0;
      
      const avgPosition = brandMetrics.positions.length > 0
        ? brandMetrics.positions.reduce((a, b) => a + b, 0) / brandMetrics.positions.length
        : 0;

      // Process competitor data
      const topCompetitors = Array.from(competitorData.entries())
        .map(([brand, data]) => ({
          brand,
          salesShare: totalMarketRevenue > 0 ? (data.revenue / totalMarketRevenue) * 100 : 0,
          listingShare: totalMarketListings > 0 ? (data.listings.size / totalMarketListings) * 100 : 0,
          keywordOverlap: data.keywordOverlap,
          uniqueASINs: data.listings.size
        }))
        .sort((a, b) => b.salesShare - a.salesShare)
        .slice(0, 10);

      return {
        brand: brandName,
        keywords: keywordAnalyses,
        overallSalesShare,
        overallListingShare,
        keywordsCovered: brandMetrics.keywordsCovered,
        totalKeywords: uniqueKeywords.size,
        avgPosition: Math.round(avgPosition * 10) / 10,
        topCompetitors
      };

    } catch (error) {
      console.error('[ShareOfVoice] Error analyzing share of voice:', error);
      throw error;
    }
  }

  /**
   * Get available brands for share of voice analysis
   * (brands that have recommended keywords)
   */
  static async getAvailableBrands(): Promise<string[]> {
    try {
      // Get brands that have ASINs with recommended keywords
      const { data, error } = await supabase
        .from('asins')
        .select('brand')
        .not('brand', 'is', null)
        .neq('brand', 'Unknown');

      if (error) throw error;

      // Get unique brands
      const uniqueBrands = [...new Set(data?.map(d => d.brand) || [])];

      // Filter to only brands with recommended keywords
      const brandsWithKeywords: string[] = [];
      
      for (const brand of uniqueBrands) {
        const { data: asinData } = await supabase
          .from('asins')
          .select('id')
          .eq('brand', brand);

        if (asinData && asinData.length > 0) {
          const { count } = await supabase
            .from('asin_recommended_keywords')
            .select('*', { count: 'exact', head: true })
            .in('asin_id', asinData.map(a => a.id));

          if (count && count > 0) {
            brandsWithKeywords.push(brand);
          }
        }
      }

      return brandsWithKeywords.sort();
    } catch (error) {
      console.error('[ShareOfVoice] Error getting available brands:', error);
      return [];
    }
  }
}