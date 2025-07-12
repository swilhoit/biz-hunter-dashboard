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
  // Return multiple possible image URLs to try, in order of reliability
  return [
    // Amazon widget service (most reliable)
    getAmazonImageUrl(asin, 'large'),
    getAmazonImageUrl(asin, 'medium'),
    // Direct image URLs (less reliable, need specific image IDs)
    `https://m.media-amazon.com/images/I/${asin}_AC_SX679_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}_AC_SL1500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
  ];
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
  // Use a gradient background with the ASIN text
  const bgColor = '7c3aed'; // Violet color to match the app theme
  const textColor = 'ffffff';
  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}