/**
 * Utility functions for handling product and business images
 */

// Categories for Unsplash placeholder images that are relevant to business/product listings
const BUSINESS_CATEGORIES = [
  'business',
  'technology',
  'office',
  'workspace',
  'computer',
  'laptop',
  'phone',
  'tablet',
  'electronics',
  'ecommerce',
  'shopping',
  'package',
  'delivery',
  'warehouse',
  'product',
  'startup'
];

/**
 * Generate a placeholder image URL from Unsplash
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param category - Optional category for more relevant images
 * @param seed - Optional seed for consistent images for the same item
 * @returns Unsplash image URL
 */
export const getPlaceholderImage = (
  width: number = 400,
  height: number = 300,
  category?: string,
  seed?: string
): string => {
  const baseUrl = 'https://images.unsplash.com';
  
  // Use provided category or pick a random business-related category
  const imageCategory = category || BUSINESS_CATEGORIES[Math.floor(Math.random() * BUSINESS_CATEGORIES.length)];
  
  // If we have a seed (like business name or ID), use it for consistent images
  if (seed) {
    // Create a simple hash from the seed for consistency
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const categoryIndex = Math.abs(hash) % BUSINESS_CATEGORIES.length;
    const finalCategory = BUSINESS_CATEGORIES[categoryIndex];
    
    return `${baseUrl}/${width}x${height}/?${finalCategory}&random=${Math.abs(hash)}`;
  }
  
  return `${baseUrl}/${width}x${height}/?${imageCategory}&random=${Math.random()}`;
};

/**
 * Generate product image for Amazon FBA businesses
 * @param businessName - Business name for consistent images
 * @param size - Image size (square, landscape, portrait)
 * @returns Product placeholder image URL
 */
export const getProductImage = (
  businessName?: string,
  size: 'square' | 'landscape' | 'portrait' = 'square'
): string => {
  const dimensions = {
    square: { width: 300, height: 300 },
    landscape: { width: 400, height: 300 },
    portrait: { width: 300, height: 400 }
  };
  
  const { width, height } = dimensions[size];
  
  // Use product-focused categories for Amazon FBA businesses
  const productCategories = [
    'product',
    'ecommerce',
    'shopping',
    'electronics',
    'gadget',
    'device',
    'accessories',
    'home',
    'lifestyle'
  ];
  
  const category = productCategories[Math.floor(Math.random() * productCategories.length)];
  
  return getPlaceholderImage(width, height, category, businessName);
};

/**
 * Generate business/office image for deals and listings
 * @param businessName - Business name for consistent images
 * @returns Business placeholder image URL
 */
export const getBusinessImage = (businessName?: string): string => {
  const businessCategories = [
    'business',
    'office',
    'workspace',
    'technology',
    'startup',
    'meeting',
    'computer'
  ];
  
  const category = businessCategories[Math.floor(Math.random() * businessCategories.length)];
  
  return getPlaceholderImage(400, 300, category, businessName);
};

/**
 * Get fallback image when primary image fails to load
 */
export const getFallbackImage = (): string => {
  return getPlaceholderImage(400, 300, 'business');
};

/**
 * Extract Amazon product image from ASIN (mock for now)
 * In a real app, this would call Amazon Product Advertising API
 */
export const getAmazonProductImage = (asin: string): string => {
  // Mock Amazon product image - in reality would fetch from Amazon API
  return `https://images.unsplash.com/400x400/?product&random=${asin}`;
};