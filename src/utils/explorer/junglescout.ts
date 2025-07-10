import axios from 'axios';

// Types
interface SearchParams {
  marketplace?: string;
  sort?: string;
  pageSize?: number;
  includeKeywords?: string[];
  asins?: string[];
  excludeUnavailableProducts?: boolean;
}

interface ProductAttributes {
  title: string;
  brand: string;
  price: number;
  reviews: number;
  rating: number;
  approximate_30_day_units_sold: number;
  approximate_30_day_revenue: number;
  seller_country: string;
  fulfillment: string;
  date_first_available: string;
  category: string;
  image_url: string;
  attributes?: string[];
  feature_bullets?: string[];
}

interface JungleScoutProduct {
  id: string;
  type: string;
  attributes: ProductAttributes;
}

interface KeywordData {
  keyword: string;
  search_volume: number;
  relevancy_score: number;
  monthly_trend: number;
  quarterly_trend: number;
  recommended_promotions: number;
  ppc_bid_broad: number;
  ppc_bid_exact: number;
  organic_product_count: number;
  sponsored_product_count: number;
}

// Get API credentials from environment variables
const getAPICredentials = () => {
  const apiKey = import.meta.env.VITE_JUNGLE_SCOUT_API_KEY;
  const keyName = import.meta.env.VITE_JUNGLE_SCOUT_KEY_NAME;
  
  if (!apiKey || !keyName) {
    console.warn('JungleScout API credentials not found in environment variables');
    console.warn('Please set VITE_JUNGLE_SCOUT_API_KEY and VITE_JUNGLE_SCOUT_KEY_NAME in your .env file');
  }
  
  return { apiKey, keyName };
};

// Test API credentials
export const testJungleScoutAPI = async (): Promise<boolean> => {
  const { apiKey, keyName } = getAPICredentials();
  if (!apiKey || !keyName) {
    return false;
  }
  
  try {
    // Try a simple API call to test credentials
    const url = 'https://developer.junglescout.com/api/keywords/keywords_by_keyword_query';
    const queryParams = new URLSearchParams({
      marketplace: 'us',
      'page[size]': '1'
    });
    
    const payload = {
      data: {
        type: "keywords_by_keyword_query",
        attributes: {
          search_terms: "test"
        }
      }
    };
    
    await axios.post(`${url}?${queryParams.toString()}`, payload, { 
      headers: createHeaders() 
    });
    
    console.log('JungleScout API test successful');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('JungleScout API test failed:', error.response?.status);
      if (error.response?.status === 403) {
        console.error('API access denied. Check your subscription includes keyword API access.');
      }
    }
    return false;
  }
};

// Create headers for API requests
const createHeaders = () => {
  const { apiKey, keyName } = getAPICredentials();
  
  // Log credentials availability (without exposing them)
  console.log('[JungleScout] API Key Name available:', !!keyName);
  console.log('[JungleScout] API Key available:', !!apiKey);
  
  return {
    'Authorization': `${keyName}:${apiKey}`,
    'X-API-Type': 'junglescout',
    'Accept': 'application/vnd.junglescout.v1+json',
    'Content-Type': 'application/vnd.api+json'
  };
};

// Function to fetch product database query results
export const fetchProductDatabaseQuery = async (searchParams: SearchParams) => {
  const { apiKey } = getAPICredentials();
  if (!apiKey) {
    throw new Error('JungleScout API key not configured');
  }

  const baseUrl = 'https://developer.junglescout.com/api/product_database_query';
  const queryParams = new URLSearchParams({
    marketplace: searchParams.marketplace || 'us',
    sort: searchParams.sort || '-revenue',
    'page[size]': (searchParams.pageSize || 100).toString(),
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  const attributes: any = {
    exclude_unavailable_products: searchParams.excludeUnavailableProducts !== false,
    "min_sales": 1,
  };

  // If ASINs are provided, use them in the include_keywords field
  // JungleScout API accepts ASINs through the include_keywords parameter
  if (searchParams.asins && searchParams.asins.length > 0) {
    attributes.include_keywords = searchParams.asins;
  } else if (searchParams.includeKeywords && searchParams.includeKeywords.length > 0) {
    attributes.include_keywords = searchParams.includeKeywords;
  }

  const payload = {
    data: {
      type: "product_database_query",
      attributes: attributes
    }
  };

  try {
    console.log('JungleScout API Request:', {
      url,
      payload: JSON.stringify(payload, null, 2),
      headers: createHeaders()
    });
    
    const response = await axios.post(url, payload, { headers: createHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching product database query results:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
      
      // Check for specific error messages
      if (error.response.status === 400) {
        console.error('Bad Request - Check if ASINs are valid or if the API key has proper permissions');
      }
    }
    throw error;
  }
};

// Function to fetch data for multiple keywords
export const fetchDataForKeywords = async (keywords: string[]): Promise<KeywordData[]> => {
  const { apiKey } = getAPICredentials();
  if (!apiKey) {
    console.error('JungleScout API key not configured');
    return [];
  }

  const url = `https://developer.junglescout.com/api/keywords/keywords_by_keyword_query`;
  const queryParams = new URLSearchParams({
    marketplace: 'us',
    sort: '-monthly_search_volume_exact',
    'page[size]': '50'
  });
  
  let allResults: KeywordData[] = [];

  for (const keyword of keywords) {
    console.log(`[JungleScout] Searching for keyword: "${keyword}"`);
    
    // Try exact match first
    const payload = {
      data: {
        type: "keywords_by_keyword_query",
        attributes: {
          search_terms: keyword
        }
      }
    };

    try {
      const response = await axios.post(`${url}?${queryParams.toString()}`, payload, { headers: createHeaders() });
      console.log(`[JungleScout] Response status for "${keyword}":`, response.status);
      console.log(`[JungleScout] Response data available:`, !!response.data);
      console.log(`[JungleScout] Number of results:`, response.data?.data?.length || 0);
      
      if (response.data && Array.isArray(response.data.data)) {
        const results = response.data.data.map((item: any) => ({
          keyword: item.attributes.name,
          search_volume: item.attributes.monthly_search_volume_exact,
          relevancy_score: item.attributes.relevancy_score,
          monthly_trend: item.attributes.monthly_trend,
          quarterly_trend: item.attributes.quarterly_trend,
          recommended_promotions: item.attributes.recommended_promotions,
          ppc_bid_broad: item.attributes.ppc_bid_broad,
          ppc_bid_exact: item.attributes.ppc_bid_exact,
          organic_product_count: item.attributes.organic_product_count,
          sponsored_product_count: item.attributes.sponsored_product_count
        }));
        
        console.log(`[JungleScout] Found ${results.length} results for "${keyword}"`);
        if (results.length > 0) {
          console.log(`[JungleScout] First result:`, results[0]);
        }
        
        allResults = [...allResults, ...results];
      } else {
        console.log(`[JungleScout] No data array in response for "${keyword}"`);
        console.log(`[JungleScout] Full response structure:`, JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error(`[JungleScout] API request failed for keyword "${keyword}":`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[JungleScout] Response data:', error.response.data);
        console.error('[JungleScout] Response status:', error.response.status);
        console.error('[JungleScout] Response headers:', error.response.headers);
        
        // Log detailed error information
        if (error.response.data?.errors) {
          error.response.data.errors.forEach((err: any) => {
            console.error('[JungleScout] Error detail:', err);
          });
        }
        
        // Handle specific error cases
        if (error.response.status === 403) {
          console.error('[JungleScout] API access denied. Please check your API credentials and subscription plan.');
        } else if (error.response.status === 400) {
          console.error('[JungleScout] Bad request - check API parameters');
        } else if (error.response.status === 404) {
          console.error('[JungleScout] Endpoint not found - check API URL');
        }
      }
    }
  }

  return allResults;
};

// Function to fetch related keywords
export const fetchRelatedKeywords = async (keyword: string): Promise<KeywordData[]> => {
  const { apiKey } = getAPICredentials();
  if (!apiKey) {
    throw new Error('JungleScout API key not configured');
  }

  const url = `https://developer.junglescout.com/api/keywords/keywords_by_keyword_query`;
  const queryParams = new URLSearchParams({
    marketplace: 'us',
    sort: '-monthly_search_volume_exact',
    'page[size]': '50'
  });
  
  const payload = {
    data: {
      type: "keywords_by_keyword_query",
      attributes: {
        search_terms: keyword
      }
    }
  };

  try {
    const response = await axios.post(`${url}?${queryParams.toString()}`, payload, { headers: createHeaders() });
    return response.data.data.map((item: any) => ({
      keyword: item.attributes.name,
      search_volume: item.attributes.monthly_search_volume_exact,
      relevancy_score: item.attributes.relevancy_score,
      monthly_trend: item.attributes.monthly_trend,
      quarterly_trend: item.attributes.quarterly_trend,
      recommended_promotions: item.attributes.recommended_promotions,
      ppc_bid_broad: item.attributes.ppc_bid_broad,
      ppc_bid_exact: item.attributes.ppc_bid_exact,
      organic_product_count: item.attributes.organic_product_count,
      sponsored_product_count: item.attributes.sponsored_product_count
    }));
  } catch (error) {
    console.error("Error fetching related keywords:", error);
    throw error;
  }
};

// Function to fetch historical search volume data
export const fetchHistoricalData = async (keyword: string) => {
  const { apiKey } = getAPICredentials();
  if (!apiKey) {
    throw new Error('JungleScout API key not configured');
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setFullYear(endDate.getFullYear() - 1);

  const url = `https://developer.junglescout.com/api/keywords/historical_search_volume`;
  const queryParams = new URLSearchParams({
    marketplace: 'us',
    keyword: keyword,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  });

  try {
    const response = await axios.get(`${url}?${queryParams.toString()}`, { headers: createHeaders() });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    throw error;
  }
};

// Combined function to fetch both related keywords and historical data
export const fetchKeywordData = async (keyword: string) => {
  try {
    const [relatedKeywordsData, historicalData] = await Promise.all([
      fetchRelatedKeywords(keyword),
      fetchHistoricalData(keyword)
    ]);

    return {
      relatedKeywords: relatedKeywordsData,
      historicalData: historicalData
    };
  } catch (error) {
    console.error("Error fetching keyword data:", error);
    throw error;
  }
};

