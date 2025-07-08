import { supabase } from '../lib/supabase';
import { fetchProductDatabaseQuery } from '../utils/explorer/junglescout';

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

export interface StoreURLLookupResult {
  storeUrl: string;
  sellerName?: string;
  asins: string[];
  totalFound: number;
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

  /**
   * Extract seller ID from Amazon store URL
   */
  static extractSellerIdFromURL(url: string): string | null {
    try {
      // Handle various Amazon store URL formats
      // https://www.amazon.com/sp?seller=A1234567890
      // https://www.amazon.com/s?me=A1234567890
      // https://www.amazon.com/stores/page/12345678-1234-1234-1234-123456789012
      
      const urlObj = new URL(url);
      
      // Check for seller parameter
      const sellerParam = urlObj.searchParams.get('seller');
      if (sellerParam) return sellerParam;
      
      // Check for me parameter
      const meParam = urlObj.searchParams.get('me');
      if (meParam) return meParam;
      
      // Check for stores page format
      const storesMatch = url.match(/\/stores\/(?:page\/)?([A-Z0-9]+)/i);
      if (storesMatch) return storesMatch[1];
      
      return null;
    } catch (error) {
      console.error('Error extracting seller ID from URL:', error);
      return null;
    }
  }

  /**
   * Lookup ASINs from an Amazon store URL
   */
  static async lookupASINsFromStoreURL(storeUrl: string): Promise<StoreURLLookupResult> {
    try {
      // Call server endpoint to scrape store
      const response = await fetch('http://localhost:3002/api/amazon/store-asins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch store ASINs');
      }

      const data = await response.json();
      
      return {
        storeUrl,
        sellerName: data.sellerName,
        asins: data.asins || [],
        totalFound: data.asins?.length || 0
      };
    } catch (error) {
      console.error('Error looking up ASINs from store URL:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed data for multiple ASINs using JungleScout
   */
  static async fetchBulkASINData(asins: string[]): Promise<ASINData[]> {
    try {
      const results: ASINData[] = [];
      
      // JungleScout has a limit on how many products we can search at once
      // We'll batch the requests
      const batchSize = 10;
      
      for (let i = 0; i < asins.length; i += batchSize) {
        const batch = asins.slice(i, i + batchSize);
        
        try {
          // Search for products by ASIN
          const response = await fetchProductDatabaseQuery({
            marketplace: 'us',
            includeKeywords: batch,
            pageSize: 50
          });
          
          if (response?.data) {
            const products = response.data.map((item: any) => this.transformJungleScoutProduct(item));
            results.push(...products);
          }
        } catch (error) {
          console.error(`Error fetching batch ${i / batchSize + 1}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching bulk ASIN data:', error);
      throw error;
    }
  }

  /**
   * Transform JungleScout product data to our ASINData format
   */
  private static transformJungleScoutProduct(product: any): ASINData {
    const attributes = product.attributes || {};
    
    return {
      id: product.id,
      asin: product.id,
      product_name: attributes.title || 'Unknown Product',
      category: attributes.category || 'Unknown',
      subcategory: attributes.subcategory || attributes.category || 'Unknown',
      brand: attributes.brand || 'Unknown',
      monthly_revenue: attributes.approximate_30_day_revenue || 0,
      monthly_units: attributes.approximate_30_day_units_sold || 0,
      price: attributes.price || 0,
      rank_current: attributes.rank || 0,
      rank_average: attributes.rank || 0,
      rank_change: 0,
      reviews: attributes.reviews || 0,
      rating: attributes.rating || 0,
      profit_margin: 30, // Default estimate
      inventory_value: 0,
      launch_date: attributes.date_first_available || new Date().toISOString(),
      is_primary: false,
      variations: attributes.number_of_variations || 1,
      fba: attributes.fulfillment === 'FBA',
      listing_quality: this.calculateListingQuality(attributes.rating, attributes.reviews),
      competition_level: this.calculateCompetitionLevel(attributes.rank)
    };
  }

  /**
   * Add store ASINs to a deal
   */
  static async addStoreASINsToDeal(
    dealId: string, 
    asins: ASINData[],
    markPrimary: boolean = false
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < asins.length; i++) {
      const asin = asins[i];
      try {
        const added = await this.addASINToDeal(dealId, {
          ...asin,
          is_primary: markPrimary && i === 0 // Mark first ASIN as primary if requested
        });

        if (added) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error adding ASIN ${asin.asin}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
} 