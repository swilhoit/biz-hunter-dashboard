/**
 * Generate Amazon product image URLs from ASIN
 * Amazon has multiple image servers and formats
 */
export function getAmazonImageUrl(asin: string, size: 'small' | 'medium' | 'large' = 'large'): string {
  // For now, return a placeholder that works
  // Amazon's direct image URLs require specific image IDs that we don't have
  // We would need to scrape the product page or use Amazon's API to get the actual image URL
  return `https://via.placeholder.com/200x200.png?text=${asin}`;
}

export function getAmazonImageUrls(asin: string): string[] {
  // Return multiple possible image URLs to try
  return [
    `https://m.media-amazon.com/images/I/${asin}_AC_SX679_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}_AC_SL1500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
    `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL250_`,
  ];
}