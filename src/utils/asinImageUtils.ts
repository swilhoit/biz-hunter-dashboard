// Utility functions for ASIN product images

export const getProductPlaceholderImage = (category: string, asin: string): string => {
  // Map categories to relevant Unsplash search terms
  const categoryKeywords: { [key: string]: string } = {
    'Home & Kitchen': 'kitchen gadget',
    'Electronics': 'consumer electronics',
    'Tools & Home Improvement': 'tools hardware',
    'Sports & Outdoors': 'sports equipment',
    'Beauty & Personal Care': 'beauty products',
    'Health & Household': 'health products',
    'Toys & Games': 'toys games',
    'Office Products': 'office supplies',
    'Automotive': 'car accessories',
    'Pet Supplies': 'pet products',
    'Clothing & Accessories': 'fashion clothing',
    'Books': 'books reading',
    'Garden & Outdoor': 'garden tools',
    'Baby Products': 'baby products',
    'Grocery & Gourmet Food': 'food products'
  };

  // Get the search keyword based on category
  const searchKeyword = categoryKeywords[category] || 'product';
  
  // Use a deterministic approach to get consistent images for the same ASIN
  const seed = asin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Unsplash URL with specific parameters for consistent product-like images
  // Using 400x400 for product thumbnails
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(searchKeyword)}&sig=${seed}`;
};

export const getProductDetailImage = (category: string, asin: string): string => {
  // For detail pages, use larger images
  const categoryKeywords: { [key: string]: string } = {
    'Home & Kitchen': 'kitchen gadget',
    'Electronics': 'consumer electronics',
    'Tools & Home Improvement': 'tools hardware',
    'Sports & Outdoors': 'sports equipment',
    'Beauty & Personal Care': 'beauty products',
    'Health & Household': 'health products',
    'Toys & Games': 'toys games',
    'Office Products': 'office supplies',
    'Automotive': 'car accessories',
    'Pet Supplies': 'pet products',
    'Clothing & Accessories': 'fashion clothing',
    'Books': 'books reading',
    'Garden & Outdoor': 'garden tools',
    'Baby Products': 'baby products',
    'Grocery & Gourmet Food': 'food products'
  };

  const searchKeyword = categoryKeywords[category] || 'product';
  const seed = asin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Larger image for detail pages
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(searchKeyword)}&sig=${seed}`;
};

// Generate multiple product images for galleries
export const getProductGalleryImages = (category: string, asin: string, count: number = 4): string[] => {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `${asin}_${i}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    images.push(`https://source.unsplash.com/600x600/?${encodeURIComponent(category)}&sig=${seed}`);
  }
  return images;
};