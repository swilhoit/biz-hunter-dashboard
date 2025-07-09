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
  image_url?: string;
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
   * Remove an ASIN from a deal
   */
  static async removeASINFromDeal(dealId: string, asinId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deal_asins')
        .delete()
        .eq('deal_id', dealId)
        .eq('id', asinId);

      if (error) {
        console.error('Error removing ASIN from deal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeASINFromDeal:', error);
      return false;
    }
  }

  /**
   * Remove multiple ASINs from a deal
   */
  static async removeMultipleASINsFromDeal(dealId: string, asinIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deal_asins')
        .delete()
        .eq('deal_id', dealId)
        .in('id', asinIds);

      if (error) {
        console.error('Error removing multiple ASINs from deal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeMultipleASINsFromDeal:', error);
      return false;
    }
  }
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
            id,
            asin,
            title,
            category,
            subcategory,
            brand,
            current_price,
            current_bsr,
            review_count,
            review_rating,
            main_image_url,
            monthly_revenue,
            monthly_units,
            seller_name,
            fulfillment,
            date_first_available
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
          id: asinDetail?.id || item.id, // Use asins table ID for keyword queries
          deal_asin_id: item.id, // Keep deal_asins table ID for reference
          asin: asinDetail?.asin || 'Unknown',
          product_name: asinDetail?.title || 'Unknown Product',
          category: asinDetail?.category || 'Unknown',
          subcategory: asinDetail?.subcategory || 'Unknown',
          brand: asinDetail?.brand || 'Unknown',
          monthly_revenue: asinDetail?.monthly_revenue || 0,
          monthly_units: asinDetail?.monthly_units || 0,
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
          competition_level: this.calculateCompetitionLevel(asinDetail?.current_bsr),
          image_url: asinDetail?.main_image_url
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
      // Validate ASIN format
      if (!asinData.asin || !/^[A-Z0-9]{10}$/.test(asinData.asin)) {
        console.error('Invalid ASIN format:', asinData.asin);
        return false;
      }

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
            current_bsr: asinData.rank_current,
            monthly_revenue: asinData.monthly_revenue,
            monthly_units: asinData.monthly_units,
            main_image_url: asinData.image_url
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
        
        // Update existing ASIN with new data from JungleScout
        const { error: updateASINError } = await supabase
          .from('asins')
          .update({
            title: asinData.product_name,
            category: asinData.category,
            subcategory: asinData.subcategory,
            brand: asinData.brand,
            current_price: asinData.price,
            review_rating: asinData.rating,
            review_count: asinData.reviews,
            current_bsr: asinData.rank_current,
            monthly_revenue: asinData.monthly_revenue,
            monthly_units: asinData.monthly_units,
            main_image_url: asinData.image_url
          })
          .eq('id', asinId);
          
        if (updateASINError) {
          console.error('Error updating ASIN data:', updateASINError);
        }
      }

      // Check if the relationship already exists
      const { data: existingRelation, error: checkError } = await supabase
        .from('deal_asins')
        .select('id')
        .eq('deal_id', dealId)
        .eq('asin_id', asinId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing relation:', checkError);
        return false;
      }

      // If relationship already exists, update it instead
      if (existingRelation) {
        const { error: updateError } = await supabase
          .from('deal_asins')
          .update({
            is_primary: asinData.is_primary || false,
            notes: ''
          })
          .eq('id', existingRelation.id);

        if (updateError) {
          console.error('Error updating ASIN relation:', updateError);
          return false;
        }
        console.log('Updated existing ASIN relation');
        return true;
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
      // Validate URL is not empty
      if (!url || url.trim() === '') {
        return null;
      }
      
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
      // Don't log error for invalid URLs during typing
      return null;
    }
  }

  /**
   * Lookup ASINs from an Amazon store URL
   */
  static async lookupASINsFromStoreURL(storeUrl: string): Promise<StoreURLLookupResult> {
    try {
      // Call server endpoint to scrape store
      const response = await fetch('/api/amazon/store-asins', {
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
      console.log('Fetching bulk ASIN data for:', asins);
      const results: ASINData[] = [];
      
      // JungleScout has a limit on how many products we can search at once
      // We'll batch the requests
      const batchSize = 10;
      
      for (let i = 0; i < asins.length; i += batchSize) {
        const batch = asins.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1}:`, batch);
        
        try {
          // Search for products by ASIN using the asins parameter
          const response = await fetchProductDatabaseQuery({
            marketplace: 'us',
            asins: batch,
            pageSize: 50
          });
          
          console.log('JungleScout response:', response);
          
          if (response?.data) {
            // Log the first product to see its structure
            if (response.data.length > 0) {
              console.log('First product structure:', JSON.stringify(response.data[0], null, 2));
            }
            const products = response.data.map((product: any) => this.transformJungleScoutProduct(product)).filter(Boolean);
            console.log('Transformed products:', products);
            results.push(...products);
          }
        } catch (error: any) {
          console.error(`Error fetching batch ${i / batchSize + 1}:`, error);
          
          // If JungleScout fails, create basic ASIN entries with minimal data
          console.log('Falling back to basic ASIN data for batch:', batch);
          const fallbackProducts = batch.map(asin => ({
            id: asin,
            asin: asin,
            product_name: `Product ${asin}`,
            category: 'Unknown',
            subcategory: 'Unknown',
            brand: 'Unknown',
            monthly_revenue: 0,
            monthly_units: 0,
            price: 0,
            rank_current: 0,
            rank_average: 0,
            rank_change: 0,
            reviews: 0,
            rating: 0,
            profit_margin: 0,
            inventory_value: 0,
            launch_date: new Date().toISOString(),
            is_primary: false,
            variations: 1,
            fba: true,
            listing_quality: 'Unknown',
            competition_level: 'Unknown'
          }));
          results.push(...fallbackProducts);
        }
      }
      
      console.log('Total ASIN data fetched:', results.length);
      return results;
    } catch (error) {
      console.error('Error in fetchBulkASINData:', error);
      return [];
    }
  }

  /**
   * Transform JungleScout product data to our ASINData format
   */
  private static transformJungleScoutProduct(product: any): ASINData {
    const attributes = product.attributes || {};
    
    // Log available image fields
    console.log('Product image fields:', {
      image_url: attributes.image_url,
      image: attributes.image,
      main_image: attributes.main_image,
      images: attributes.images,
      product_image_url: attributes.product_image_url
    });
    
    // Extract ASIN from id which may include marketplace prefix (e.g., "us/B079HFZ2Z1")
    const asinMatch = product.id.match(/([A-Z0-9]{10})$/);
    const asin = asinMatch ? asinMatch[1] : product.id;
    
    return {
      id: asin,
      asin: asin,
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
      competition_level: this.calculateCompetitionLevel(attributes.rank),
      image_url: attributes.image_url || attributes.image || attributes.main_image || attributes.product_image_url
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
    console.log('Adding store ASINs to deal:', { dealId, asinCount: asins.length, markPrimary });
    let success = 0;
    let failed = 0;

    for (let i = 0; i < asins.length; i++) {
      const asin = asins[i];
      console.log(`Adding ASIN ${i + 1}/${asins.length}:`, asin.asin);
      try {
        const added = await this.addASINToDeal(dealId, {
          ...asin,
          is_primary: markPrimary && i === 0 // Mark first ASIN as primary if requested
        });

        if (added) {
          console.log(`Successfully added ASIN: ${asin.asin}`);
          success++;
        } else {
          console.log(`Failed to add ASIN: ${asin.asin}`);
          failed++;
        }
      } catch (error) {
        console.error(`Error adding ASIN ${asin.asin}:`, error);
        failed++;
      }
    }

    console.log('Store ASINs addition complete:', { success, failed });
    return { success, failed };
  }
} 