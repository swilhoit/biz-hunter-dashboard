import { supabase } from '../supabaseClient';

/**
 * Utility to clean up bad brand data in the database
 * This fixes detected_brand values that are actually product descriptions
 */
export class BrandDataCleanup {
  
  /**
   * Check if a string is likely a brand name vs a product description
   */
  static isValidBrandName(name: string | null): boolean {
    if (!name) return false;
    
    // Reject if it's too long
    if (name.length > 50) return false;
    
    // Reject if it's just a number
    if (/^\d+$/.test(name)) return false;
    
    // Reject if it starts with a number followed by product keywords
    if (/^[0-9]+\s+(Pack|Count|Pcs|Pieces|oz|ml|inch|CT)/.test(name)) return false;
    
    // Reject if it starts with generic product descriptors
    if (/^(Scented|Unscented|Large|Small|Medium|Natural|Luxury|Premium)\s+(Candle|Candles)/.test(name)) return false;
    
    // Reject if it contains size measurements
    if (/\d+\s*["'x×]/.test(name)) return false;
    
    // Reject generic product terms
    const genericTerms = [
      'Candle', 'Candles', 'Scented Candles', 'Scented Candles Gift Set',
      'Scented Candles for Home', 'Gift Set', 'Pack', 'Set'
    ];
    if (genericTerms.includes(name)) return false;
    
    // Accept if it looks like a proper brand name
    // (starts with capital letter, reasonable length, no obvious product keywords)
    return /^[A-Z][A-Za-z0-9\s&\.\-']{1,40}$/.test(name) && 
           !/(Candle|Pack|Set|Gift|Count|Pieces|Scented|Unscented)/.test(name);
  }
  
  /**
   * Extract a brand name from a product title
   */
  static extractBrandFromTitle(title: string): string | null {
    if (!title) return null;
    
    // Try to extract brand name from "by BrandName" pattern
    const byMatch = title.match(/\bby\s+([A-Z][A-Za-z0-9\s&\.\-]+?)(?:\s*[,|\-]|$)/i);
    if (byMatch && byMatch[1] && this.isValidBrandName(byMatch[1])) {
      return byMatch[1].trim();
    }
    
    // Known brand patterns in titles
    const knownBrands = [
      'Yankee Candle', 'Bath & Body Works', 'White Barn', 'Paddywax', 
      'Voluspa', 'Nest Fragrances', 'Diptyque', 'Jo Malone', 'Capri Blue',
      'WoodWick', 'Glade', 'Air Wick', 'Febreze', 'Mrs. Meyer\'s',
      'Better Homes & Gardens', 'Mainstays', 'Colonial Candle',
      'Village Candle', 'Homesick', 'Boy Smells', 'Otherland',
      'Brooklyn Candle Studio', 'P.F. Candle Co.', 'Anthropologie',
      'Threshold', 'Hearth & Hand', 'Magnolia', 'DW Home'
    ];
    
    for (const brand of knownBrands) {
      if (title.includes(brand)) {
        return brand;
      }
    }
    
    return null;
  }
  
  /**
   * Clean up keyword_rankings detected_brand field
   */
  static async cleanupKeywordRankings(): Promise<number> {
    try {
      console.log('[BrandCleanup] Starting keyword_rankings cleanup...');
      
      // First, get all unique detected_brand values
      const { data: brands, error: fetchError } = await supabase
        .from('keyword_rankings')
        .select('detected_brand')
        .not('detected_brand', 'is', null)
        .limit(1000);
        
      if (fetchError) {
        console.error('[BrandCleanup] Error fetching brands:', fetchError);
        return 0;
      }
      
      // Get unique brands
      const uniqueBrands = [...new Set(brands?.map(b => b.detected_brand) || [])];
      console.log(`[BrandCleanup] Found ${uniqueBrands.length} unique brand values to check`);
      
      // Categorize brands
      const invalidBrands: string[] = [];
      const validBrands: string[] = [];
      
      for (const brand of uniqueBrands) {
        if (!this.isValidBrandName(brand)) {
          invalidBrands.push(brand);
        } else {
          validBrands.push(brand);
        }
      }
      
      console.log(`[BrandCleanup] Found ${invalidBrands.length} invalid brands and ${validBrands.length} valid brands`);
      
      // Update invalid brands to NULL in batches
      let totalUpdated = 0;
      const batchSize = 50;
      
      for (let i = 0; i < invalidBrands.length; i += batchSize) {
        const batch = invalidBrands.slice(i, i + batchSize);
        
        const { error: updateError } = await supabase
          .from('keyword_rankings')
          .update({ detected_brand: null })
          .in('detected_brand', batch);
          
        if (updateError) {
          console.error('[BrandCleanup] Error updating batch:', updateError);
        } else {
          totalUpdated += batch.length;
          console.log(`[BrandCleanup] Updated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(invalidBrands.length/batchSize)}`);
        }
      }
      
      console.log(`[BrandCleanup] Completed! Set ${totalUpdated} invalid brand values to NULL`);
      
      // Log some examples of what was cleaned
      console.log('[BrandCleanup] Examples of cleaned brands:', invalidBrands.slice(0, 10));
      console.log('[BrandCleanup] Examples of kept brands:', validBrands.slice(0, 10));
      
      return totalUpdated;
    } catch (error) {
      console.error('[BrandCleanup] Error in cleanupKeywordRankings:', error);
      return 0;
    }
  }
  
  /**
   * Clean up ASINs brand field
   */
  static async cleanupASINs(): Promise<number> {
    try {
      console.log('[BrandCleanup] Starting ASINs cleanup...');
      
      // Get ASINs with potentially bad brand data
      const { data: asins, error: fetchError } = await supabase
        .from('asins')
        .select('asin, brand, title')
        .not('brand', 'is', null)
        .limit(1000);
        
      if (fetchError) {
        console.error('[BrandCleanup] Error fetching ASINs:', fetchError);
        return 0;
      }
      
      let totalUpdated = 0;
      const updates: Array<{asin: string, brand: string}> = [];
      
      for (const item of asins || []) {
        if (!this.isValidBrandName(item.brand)) {
          // Try to extract brand from title
          const extractedBrand = this.extractBrandFromTitle(item.title);
          
          updates.push({
            asin: item.asin,
            brand: extractedBrand || 'Unknown'
          });
        }
      }
      
      // Update in batches
      const batchSize = 50;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        // Update each item individually (Supabase doesn't support bulk updates with different values)
        for (const update of batch) {
          const { error } = await supabase
            .from('asins')
            .update({ brand: update.brand })
            .eq('asin', update.asin);
            
          if (!error) {
            totalUpdated++;
          }
        }
        
        console.log(`[BrandCleanup] Updated ASINs batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`);
      }
      
      console.log(`[BrandCleanup] Completed! Updated ${totalUpdated} ASIN brand values`);
      return totalUpdated;
    } catch (error) {
      console.error('[BrandCleanup] Error in cleanupASINs:', error);
      return 0;
    }
  }
  
  /**
   * Run full cleanup
   */
  static async runFullCleanup(): Promise<void> {
    console.log('[BrandCleanup] Starting full brand data cleanup...');
    
    const keywordRankingsUpdated = await this.cleanupKeywordRankings();
    const asinsUpdated = await this.cleanupASINs();
    
    console.log('[BrandCleanup] Full cleanup completed!');
    console.log(`[BrandCleanup] Total updates: ${keywordRankingsUpdated} keyword rankings, ${asinsUpdated} ASINs`);
  }
}