/**
 * Generate Amazon product image URLs from ASIN
 * Amazon has multiple image servers and formats
 */
export function getAmazonImageUrl(asin: string, size: 'small' | 'medium' | 'large' = 'large'): string {
  // Use Amazon's widget service which is more reliable for getting product images
  // This service accepts ASINs directly and returns product images
  const sizeMap = {
    small: '_SL160_',
    medium: '_SL250_',
    large: '_SL500_'
  };
  
  // Amazon widget service URL that works with ASINs
  return `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=${sizeMap[size]}&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822`;
}

export function getAmazonImageUrls(asin: string): string[] {
  // Return empty array since the widget URLs are causing DNS errors
  // and the direct ASIN URLs don't work without the proper image ID
  // Images should come from JungleScout/DataForSEO instead
  return [];
}

/**
 * Transform an Amazon image URL to a different size
 * Takes URLs like: https://m.media-amazon.com/images/I/31JjerlZllL._SL75_.jpg
 * And converts to: https://m.media-amazon.com/images/I/31JjerlZllL._SL500_.jpg
 */
export function transformAmazonImageSize(url: string, size: 'small' | 'medium' | 'large' = 'large'): string {
  if (!url || typeof url !== 'string') return url;
  
  const sizeMap = {
    small: '_SL160_',
    medium: '_SL250_',
    large: '_SL500_'
  };
  
  // Check if it's an Amazon image URL with a size parameter
  if (url.includes('amazon') && url.includes('_SL')) {
    // Replace the size parameter with the desired size
    return url.replace(/_SL\d+_/, sizeMap[size]);
  }
  
  return url;
}

/**
 * Get a placeholder image URL for when Amazon images aren't available
 */
export function getPlaceholderImageUrl(text: string, width: number = 400, height: number = 400): string {
  // Return empty string to use CSS-based placeholder instead
  // via.placeholder.com is causing certificate errors
  return '';
}