import { supabase } from '../lib/supabase';
import DataForSEOService from './DataForSEOService';

interface ImageFetchResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ProductImageService {
  /**
   * Fetch and update product image for an ASIN
   */
  static async fetchAndUpdateProductImage(asin: string): Promise<ImageFetchResult> {
    try {
      // First check if we already have an image
      const { data: existingASIN, error: fetchError } = await supabase
        .from('asins')
        .select('id, main_image_url')
        .eq('asin', asin)
        .single();

      if (fetchError || !existingASIN) {
        return { success: false, error: 'ASIN not found' };
      }

      // If we already have a valid image URL, return it
      if (existingASIN.main_image_url && 
          !existingASIN.main_image_url.includes('placeholder') &&
          existingASIN.main_image_url !== 'null' &&
          existingASIN.main_image_url !== 'undefined') {
        return { success: true, imageUrl: existingASIN.main_image_url };
      }

      // Try to fetch image using DataForSEO API
      try {
        const dataForSEOService = new DataForSEOService();
        const response = await dataForSEOService.fetchProductByASIN(asin);
        
        if (response && response.image_url) {
          // Update the database with the new image URL
          await supabase
            .from('asins')
            .update({ main_image_url: response.image_url })
            .eq('id', existingASIN.id);

          return { success: true, imageUrl: response.image_url };
        }
      } catch (error) {
        console.error('DataForSEO API error:', error);
      }

      // If API fails, return no image
      return { success: false, error: 'No image found for this ASIN' };

    } catch (error) {
      console.error('Error fetching product image:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch fetch images for multiple ASINs
   */
  static async batchFetchProductImages(asins: string[]): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    
    // Process in smaller batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < asins.length; i += batchSize) {
      const batch = asins.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (asin) => {
          const result = await this.fetchAndUpdateProductImage(asin);
          if (result.success && result.imageUrl) {
            imageMap.set(asin, result.imageUrl);
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < asins.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return imageMap;
  }
}