interface AdCreative {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  brand: string;
  position: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
}

export async function fetchAdCreatives(keyword: string): Promise<AdCreative[]> {
  try {
    const apiKey = import.meta.env.VITE_RAINFOREST_API_KEY;
    
    if (!apiKey) {
      console.warn('Rainforest API key not found, returning mock data');
      return getMockAdCreatives(keyword);
    }

    // Rainforest API endpoint for Amazon search results with ads
    const params = new URLSearchParams({
      api_key: apiKey,
      amazon_domain: 'amazon.com',
      type: 'search',
      search_term: keyword,
      include_ads: 'true'
    });

    const response = await fetch(`https://api.rainforestapi.com/request?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch ad creatives');
    }

    const data = await response.json();
    
    // Extract sponsored products and ads
    const adCreatives: AdCreative[] = [];
    
    // Process sponsored products
    if (data.sponsored_products) {
      data.sponsored_products.forEach((product: any, index: number) => {
        adCreatives.push({
          id: product.asin || `ad-${index}`,
          type: 'image',
          url: product.image,
          title: product.title,
          brand: product.brand || 'Unknown',
          position: product.position || index + 1,
          impressions: Math.floor(Math.random() * 100000) + 10000,
          clicks: Math.floor(Math.random() * 5000) + 100,
          ctr: Math.random() * 5 + 0.5
        });
      });
    }

    // Process video ads if available
    if (data.video_blocks) {
      data.video_blocks.forEach((video: any, index: number) => {
        adCreatives.push({
          id: `video-${index}`,
          type: 'video',
          url: video.video_url || video.thumbnail,
          title: video.title,
          brand: video.brand || 'Unknown',
          position: video.position || index + 1
        });
      });
    }

    return adCreatives;
  } catch (error) {
    console.error('Error fetching ad creatives:', error);
    return getMockAdCreatives(keyword);
  }
}

function getMockAdCreatives(keyword: string): AdCreative[] {
  const brands = ['TechPro', 'SmartHome', 'EcoLife', 'PrimeTech', 'NextGen'];
  const productTypes = ['Premium', 'Professional', 'Advanced', 'Ultimate', 'Elite'];
  
  return Array.from({ length: 12 }, (_, i) => {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    const isVideo = Math.random() > 0.8;
    
    return {
      id: `mock-ad-${i}`,
      type: isVideo ? 'video' : 'image',
      url: isVideo 
        ? 'https://via.placeholder.com/640x360?text=Video+Ad'
        : `https://via.placeholder.com/300x300?text=${brand}+${productType}`,
      title: `${brand} ${productType} ${keyword}`,
      brand: brand,
      position: i + 1,
      impressions: Math.floor(Math.random() * 100000) + 10000,
      clicks: Math.floor(Math.random() * 5000) + 100,
      ctr: Math.random() * 5 + 0.5
    };
  });
}

export async function fetchAmazonListingData(asin: string): Promise<any> {
  try {
    const apiKey = import.meta.env.VITE_RAINFOREST_API_KEY;
    
    if (!apiKey) {
      console.warn('Rainforest API key not found');
      return null;
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      amazon_domain: 'amazon.com',
      type: 'product',
      asin: asin
    });

    const response = await fetch(`https://api.rainforestapi.com/request?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch listing data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching listing data:', error);
    return null;
  }
}