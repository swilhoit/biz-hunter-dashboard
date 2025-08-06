// Utility functions for ASIN product images

// Alternative placeholder services
const PLACEHOLDER_SERVICES = {
  picsum: (width: number, height: number, seed: string) => 
    `https://picsum.photos/seed/${seed}/${width}/${height}`,
  placeholder: (width: number, height: number, text: string, bgColor: string = '7c3aed', textColor: string = 'ffffff') => 
    `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`,
  dummyimage: (width: number, height: number, text: string, bgColor: string = '7c3aed', textColor: string = 'fff') =>
    `https://dummyimage.com/${width}x${height}/${bgColor}/${textColor}&text=${encodeURIComponent(text)}`
};

export const getProductPlaceholderImage = (category: string, asin: string): string => {
  // Map categories to relevant search terms
  const categoryKeywords: { [key: string]: string } = {
    'Home & Kitchen': 'kitchen-gadget',
    'Electronics': 'electronics',
    'Tools & Home Improvement': 'tools',
    'Sports & Outdoors': 'sports',
    'Beauty & Personal Care': 'beauty',
    'Health & Household': 'health',
    'Toys & Games': 'toys',
    'Office Products': 'office',
    'Automotive': 'car',
    'Pet Supplies': 'pets',
    'Clothing & Accessories': 'fashion',
    'Books': 'books',
    'Garden & Outdoor': 'garden',
    'Baby Products': 'baby',
    'Grocery & Gourmet Food': 'food'
  };

  // Get the search keyword based on category
  const searchKeyword = categoryKeywords[category] || 'product';
  
  // Use a deterministic approach to get consistent images for the same ASIN
  const seed = asin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use placeholder.com as primary since it's more reliable
  // Shows ASIN code on colored background
  return PLACEHOLDER_SERVICES.placeholder(400, 400, asin.substring(0, 6), '7c3aed', 'ffffff');
  
  // Alternative options if needed:
  // return PLACEHOLDER_SERVICES.dummyimage(400, 400, asin.substring(0, 6), '7c3aed', 'fff');
  // return PLACEHOLDER_SERVICES.picsum(400, 400, `${searchKeyword}-${seed}`);
};

export const getProductDetailImage = (category: string, asin: string): string => {
  // For detail pages, use larger images with placeholder.com
  return PLACEHOLDER_SERVICES.placeholder(800, 600, asin.substring(0, 6), '7c3aed', 'ffffff');
};

// Generate multiple product images for galleries
export const getProductGalleryImages = (category: string, asin: string, count: number = 4): string[] => {
  const images: string[] = [];
  
  // Generate variations of the ASIN for gallery
  for (let i = 0; i < count; i++) {
    const variant = i === 0 ? asin.substring(0, 6) : `${asin.substring(0, 4)}-${i}`;
    images.push(PLACEHOLDER_SERVICES.placeholder(600, 600, variant, '7c3aed', 'ffffff'));
  }
  return images;
};