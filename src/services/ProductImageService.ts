import { supabase } from '../lib/supabase';
import axios from 'axios';

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

      // Try to fetch image using Rainforest API if available
      const rainforestApiKey = import.meta.env.VITE_RAINFOREST_API_KEY;
      if (rainforestApiKey) {
        try {
          const response = await axios.get('https://api.rainforestapi.com/request', {
            params: {
              api_key: rainforestApiKey,
              type: 'product',
              amazon_domain: 'amazon.com',
              asin: asin
            }
          });

          if (response.data && response.data.product) {
            const imageUrl = response.data.product.main_image?.link || 
                           response.data.product.images?.[0]?.link ||
                           response.data.product.image;

            if (imageUrl) {
              // Update the database with the new image URL
              await supabase
                .from('asins')
                .update({ main_image_url: imageUrl })
                .eq('id', existingASIN.id);

              return { success: true, imageUrl };
            }
          }
        } catch (error) {
          console.error('Rainforest API error:', error);
        }
      }

      // If all else fails, generate a widget URL
      const widgetUrl = `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL500_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822`;
      
      // Update the database with the widget URL
      await supabase
        .from('asins')
        .update({ main_image_url: widgetUrl })
        .eq('id', existingASIN.id);

      return { success: true, imageUrl: widgetUrl };

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