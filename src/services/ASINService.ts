import { supabase } from '../lib/supabase';

export interface ASINData {
  id: string;
  asin: string;
  product_name: string;
  category: string;
  subcategory: string;
  brand: string;
  monthly_revenue: number;
  monthly_units: number;
  price: number;
  rank_current: number;
  rank_average: number;
  rank_change: number;
  reviews: number;
  rating: number;
  profit_margin: number;
  inventory_value: number;
  launch_date: string;
  is_primary: boolean;
  variations: number;
  fba: boolean;
  listing_quality: string;
  competition_level: string;
}

export interface ASINSummary {
  totalASINs: number;
  totalRevenue: number;
  avgMargin: number;
  totalInventoryValue: number;
}

export class ASINService {
  /**
   * Fetch ASINs for a specific deal
   */
  static async fetchDealASINs(dealId: string): Promise<ASINData[]> {
    try {
      // Use the foreign key relationship to get deal ASINs with ASIN details
      const { data, error } = await supabase
        .from('deal_asins')
        .select(`
          id,
          is_primary,
          notes,
          added_at,
          asins (
            asin,
            title,
            category,
            subcategory,
            brand,
            current_price,
            current_bsr,
            review_count,
            review_rating,
            main_image_url
          )
        `)
        .eq('deal_id', dealId);

      if (error) {
        console.error('Error fetching deal ASINs:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform the data to match the expected interface
      return data.map(item => {
        const asinDetail = item.asins;
        
        return {
          id: item.id,
          asin: asinDetail?.asin || 'Unknown',
          product_name: asinDetail?.title || 'Unknown Product',
          category: asinDetail?.category || 'Unknown',
          subcategory: asinDetail?.subcategory || 'Unknown',
          brand: asinDetail?.brand || 'Unknown',
          monthly_revenue: 0, // Not available in current schema
          monthly_units: 0, // Not available in current schema
          price: asinDetail?.current_price || 0,
          rank_current: asinDetail?.current_bsr || 0,
          rank_average: asinDetail?.current_bsr || 0,
          rank_change: 0, // Not available without historical data
          reviews: asinDetail?.review_count || 0,
          rating: asinDetail?.review_rating || 0,
          profit_margin: 0, // Not available in current schema
          inventory_value: 0, // Not available in current schema
          launch_date: '2023-01-01', // Default for now
          is_primary: item.is_primary || false,
          variations: 1, // Default for now
          fba: true, // Default for now
          listing_quality: this.calculateListingQuality(asinDetail?.review_rating, asinDetail?.review_count),
          competition_level: this.calculateCompetitionLevel(asinDetail?.current_bsr)
        };
      });
    } catch (error) {
      console.error('Error in fetchDealASINs:', error);
      return [];
    }
  }

  /**
   * Add an ASIN to a deal
   */
  static async addASINToDeal(dealId: string, asinData: Partial<ASINData>): Promise<boolean> {
    try {
      // First, ensure the ASIN exists in the asins table
      const { data: existingASIN, error: fetchError } = await supabase
        .from('asins')
        .select('id')
        .eq('asin', asinData.asin)
        .single();

      let asinId: string;

      if (fetchError && fetchError.code === 'PGRST116') {
        // ASIN doesn't exist, create it
        const { data: newASIN, error: createError } = await supabase
          .from('asins')
          .insert({
            asin: asinData.asin,
            title: asinData.product_name,
            category: asinData.category,
            subcategory: asinData.subcategory,
            brand: asinData.brand,
            current_price: asinData.price,
            review_rating: asinData.rating,
            review_count: asinData.reviews,
            current_bsr: asinData.rank_current
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating ASIN:', createError);
          return false;
        }

        asinId = newASIN.id;
      } else if (fetchError) {
        console.error('Error fetching ASIN:', fetchError);
        return false;
      } else {
        asinId = existingASIN.id;
      }

      // Now add the deal-asin relationship
      const { error: insertError } = await supabase
        .from('deal_asins')
        .insert({
          deal_id: dealId,
          asin_id: asinId,
          is_primary: asinData.is_primary || false,
          notes: ''
        });

      if (insertError) {
        console.error('Error adding ASIN to deal:', insertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addASINToDeal:', error);
      return false;
    }
  }

  /**
   * Calculate ASIN summary statistics
   */
  static calculateSummary(asins: ASINData[]): ASINSummary {
    if (asins.length === 0) {
      return {
        totalASINs: 0,
        totalRevenue: 0,
        avgMargin: 0,
        totalInventoryValue: 0
      };
    }

    const totalRevenue = asins.reduce((sum, asin) => sum + asin.monthly_revenue, 0);
    const avgMargin = asins.reduce((sum, asin) => sum + asin.profit_margin, 0) / asins.length;
    const totalInventoryValue = asins.reduce((sum, asin) => sum + asin.inventory_value, 0);

    return {
      totalASINs: asins.length,
      totalRevenue,
      avgMargin,
      totalInventoryValue
    };
  }

  /**
   * Calculate rank change
   */
  private static calculateRankChange(current: number, average: number): number {
    if (!current || !average) return 0;
    return current - average;
  }

  /**
   * Calculate listing quality based on rating and review count
   */
  private static calculateListingQuality(rating: number, reviewCount: number): string {
    if (rating >= 4.5 && reviewCount >= 1000) return 'Excellent';
    if (rating >= 4.0 && reviewCount >= 500) return 'Good';
    if (rating >= 3.5 && reviewCount >= 100) return 'Fair';
    return 'Poor';
  }

  /**
   * Calculate competition level based on rank
   */
  private static calculateCompetitionLevel(rank: number): string {
    if (!rank) return 'Unknown';
    if (rank <= 1000) return 'High';
    if (rank <= 5000) return 'Medium';
    return 'Low';
  }

  /**
   * Extract ASINs from text content
   */
  static extractASINsFromText(text: string): string[] {
    const asinRegex = /\b[A-Z0-9]{10}\b/g;
    const matches = text.match(asinRegex) || [];
    
    // Filter to likely ASINs (start with B and have right format)
    return matches.filter(match => 
      match.startsWith('B') && 
      /^[A-Z0-9]{10}$/.test(match)
    );
  }

  /**
   * Bulk add ASINs to a deal from extracted text
   */
  static async bulkAddASINsFromExtraction(
    dealId: string, 
    asins: string[], 
    defaultMetrics: Partial<ASINData> = {}
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const asin of asins) {
      try {
        const added = await this.addASINToDeal(dealId, {
          asin,
          product_name: `Product ${asin}`,
          category: 'Unknown',
          subcategory: 'Unknown',
          brand: 'Unknown',
          monthly_revenue: 0,
          monthly_units: 0,
          price: 0,
          rank_current: 0,
          rank_average: 0,
          reviews: 0,
          rating: 0,
          profit_margin: 0,
          inventory_value: 0,
          is_primary: false,
          ...defaultMetrics
        });

        if (added) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error adding ASIN ${asin}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
} 