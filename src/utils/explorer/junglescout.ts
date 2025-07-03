import axios from 'axios';

// Types
interface SearchParams {
  marketplace?: string;
  sort?: string;
  pageSize?: number;
  includeKeywords?: string[];
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
  }
  
  return { apiKey, keyName };
};

// Create headers for API requests
const createHeaders = () => {
  const { apiKey, keyName } = getAPICredentials();
  
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

  const payload = {
    data: {
      type: "product_database_query",
      attributes: {
        include_keywords: searchParams.includeKeywords || [],
        exclude_unavailable_products: searchParams.excludeUnavailableProducts !== false,
        "min_sales": 1,
      }
    }
  };

  try {
    const response = await axios.post(url, payload, { headers: createHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching product database query results:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Function to fetch data for multiple keywords
export const fetchDataForKeywords = async (keywords: string[]): Promise<KeywordData[]> => {
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
  
  let allResults: KeywordData[] = [];

  for (const keyword of keywords) {
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
        allResults = [...allResults, ...results];
      }
    } catch (error) {
      console.error("API request failed:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
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