import axios from 'axios';
import OpenAIService from './OpenAIService';

interface JungleScoutConfig {
  apiKey: string;
  keyName: string;
}

interface RainforestConfig {
  apiKey: string;
}

interface ProductData {
  asin: string;
  title: string;
  brand?: string;
  price?: number;
  reviews?: number;
  rating?: number;
  sales?: number;
  revenue?: number;
  category?: string;
  imageUrl?: string;
  amazonUrl?: string;
  sellerCountry?: string;
  fulfillment?: string;
  dateFirstAvailable?: string;
  attributes?: any[];
  featureBullets?: string[];
}

interface StoreAnalysis {
  storeUrl: string;
  products: ProductData[];
  totalProducts: number;
  totalRevenue: number;
  averagePrice: number;
  topCategories: string[];
  performanceMetrics: {
    totalSales: number;
    averageRating: number;
    averageReviews: number;
  };
  lastUpdated: Date;
}

export class AmazonAnalyticsService {
  private jungleScoutConfig: JungleScoutConfig;
  private rainforestConfig: RainforestConfig;
  private openAIService: OpenAIService;
  private cache: Map<string, { data: any; timestamp: number; expiresAt: number }>;
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.jungleScoutConfig = {
      apiKey: process.env.REACT_APP_JUNGLE_SCOUT_API_KEY || '',
      keyName: process.env.REACT_APP_JUNGLE_SCOUT_KEY_NAME || ''
    };
    this.rainforestConfig = {
      apiKey: process.env.REACT_APP_RAINFOREST_API_KEY || ''
    };
    this.openAIService = new OpenAIService();
    this.cache = new Map();
  }

  private getJungleScoutHeaders() {
    return {
      'Authorization': `${this.jungleScoutConfig.keyName}:${this.jungleScoutConfig.apiKey}`,
      'X-API-Type': 'junglescout',
      'Accept': 'application/vnd.junglescout.v1+json',
      'Content-Type': 'application/vnd.api+json'
    };
  }

  private getCacheKey(type: string, identifier: string): string {
    return `${type}:${identifier}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });
  }

  async fetchProductsByASINs(asins: string[]): Promise<ProductData[]> {
    if (!asins.length) return [];
    
    const cacheKey = this.getCacheKey('asins', asins.sort().join(','));
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Returning cached ASIN data');
      return cached;
    }

    console.log(`Fetching data for ${asins.length} ASINs`);
    
    try {
      // Use Jungle Scout for bulk product data
      const products = await this.fetchJungleScoutProductData(asins);
      
      // Enrich with Rainforest if needed (for detailed attributes)
      const enrichedProducts = products.length > 0 ? products : await this.fetchRainforestProductData(asins);
      
      this.setCache(cacheKey, enrichedProducts);
      return enrichedProducts;
    } catch (error) {
      console.error('Error fetching product data:', error);
      return [];
    }
  }

  private async fetchJungleScoutProductData(asins: string[]): Promise<ProductData[]> {
    const baseUrl = 'https://developer.junglescout.com/api/product_database_query';
    const queryParams = new URLSearchParams({
      marketplace: 'us',
      sort: '-revenue',
      'page[size]': '100'
    });

    const payload = {
      data: {
        type: "product_database_query",
        attributes: {
          include_keywords: asins, // Use ASINs as search terms
          exclude_unavailable_products: true,
          min_sales: 1
        }
      }
    };

    try {
      const response = await axios.post(
        `${baseUrl}?${queryParams.toString()}`,
        payload,
        { headers: this.getJungleScoutHeaders() }
      );

      if (response.data?.data) {
        return response.data.data.map((item: any) => this.processJungleScoutItem(item));
      }
      return [];
    } catch (error) {
      console.error('Jungle Scout API error:', error);
      return [];
    }
  }

  private async fetchRainforestProductData(asins: string[]): Promise<ProductData[]> {
    const results: ProductData[] = [];
    
    for (const asin of asins) {
      try {
        const response = await this.fetchWithExponentialBackoff(
          () => axios.get('https://api.rainforestapi.com/request', {
            params: {
              api_key: this.rainforestConfig.apiKey,
              type: 'product',
              amazon_domain: 'amazon.com',
              asin: asin
            }
          })
        );

        if (response.data?.product) {
          results.push(this.processRainforestItem(response.data.product));
        }
      } catch (error) {
        console.error(`Error fetching ASIN ${asin}:`, error);
      }
    }

    return results;
  }

  private async fetchWithExponentialBackoff(
    fetchFunction: () => Promise<any>,
    retries: number = 5,
    delay: number = 1000
  ): Promise<any> {
    try {
      return await fetchFunction();
    } catch (error: any) {
      if (error.response && (error.response.status === 429 || error.response.status >= 500) && retries > 0) {
        const jitter = Math.random() * 1000;
        console.log(`Rate limit or server error. Retrying in ${delay + jitter} ms`);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        return this.fetchWithExponentialBackoff(fetchFunction, retries - 1, delay * 2);
      } else {
        throw error;
      }
    }
  }

  private processJungleScoutItem(item: any): ProductData {
    const attributes = item.attributes;
    return {
      asin: item.id.replace('us/', ''),
      title: attributes.title || '',
      brand: attributes.brand || '',
      price: parseFloat(attributes.price || 0),
      reviews: parseInt(attributes.reviews || 0),
      rating: parseFloat(attributes.rating || 0),
      sales: parseInt(attributes.approximate_30_day_units_sold || 0),
      revenue: Math.round(parseFloat(attributes.approximate_30_day_revenue || 0)),
      category: attributes.category || '',
      imageUrl: attributes.image_url || '',
      amazonUrl: `https://www.amazon.com/dp/${item.id.replace('us/', '')}`,
      sellerCountry: attributes.seller_country || '',
      fulfillment: attributes.fulfillment || '',
      dateFirstAvailable: attributes.date_first_available || '',
      attributes: attributes.attributes || [],
      featureBullets: attributes.feature_bullets || []
    };
  }

  private processRainforestItem(product: any): ProductData {
    return {
      asin: product.asin,
      title: product.title,
      price: parseFloat(product.buybox_price) || 0,
      rating: product.rating,
      reviews: product.ratings_total,
      imageUrl: product.images?.[0]?.link || '',
      amazonUrl: `https://www.amazon.com/dp/${product.asin}`,
      featureBullets: product.feature_bullets || [],
      attributes: product.specifications || []
    };
  }

  async searchProductsByKeywords(keywords: string[]): Promise<ProductData[]> {
    if (!keywords.length) return [];

    const cacheKey = this.getCacheKey('keywords', keywords.sort().join(','));
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Returning cached keyword search data');
      return cached;
    }

    try {
      const baseUrl = 'https://developer.junglescout.com/api/product_database_query';
      const queryParams = new URLSearchParams({
        marketplace: 'us',
        sort: '-revenue',
        'page[size]': '100'
      });

      const payload = {
        data: {
          type: "product_database_query",
          attributes: {
            include_keywords: keywords,
            exclude_unavailable_products: true,
            min_sales: 1
          }
        }
      };

      const response = await axios.post(
        `${baseUrl}?${queryParams.toString()}`,
        payload,
        { headers: this.getJungleScoutHeaders() }
      );

      const products = response.data?.data ? 
        response.data.data.map((item: any) => this.processJungleScoutItem(item)) : [];

      this.setCache(cacheKey, products);
      return products;
    } catch (error) {
      console.error('Error searching products by keywords:', error);
      return [];
    }
  }

  async analyzeStoreByUrl(storeUrl: string): Promise<StoreAnalysis | null> {
    const cacheKey = this.getCacheKey('store', storeUrl);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Returning cached store analysis');
      return cached;
    }

    try {
      // Extract store name or identifier from URL
      const storeIdentifier = this.extractStoreIdentifier(storeUrl);
      if (!storeIdentifier) {
        throw new Error('Unable to extract store identifier from URL');
      }

      // Search for products associated with this store
      // This is a simplified approach - in reality you'd need specific store search capabilities
      const products = await this.searchProductsByKeywords([storeIdentifier]);
      
      if (products.length === 0) {
        return null;
      }

      const analysis = this.calculateStoreMetrics(storeUrl, products);
      this.setCache(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing store:', error);
      return null;
    }
  }

  async analyzeProductPortfolio(products: ProductData[]) {
    console.log(`Analyzing portfolio of ${products.length} products`);
    return await this.openAIService.analyzePortfolioPerformance(products);
  }

  async extractASINsFromDocuments(text: string): Promise<string[]> {
    return await this.openAIService.extractASINsFromText(text);
  }

  private extractStoreIdentifier(storeUrl: string): string | null {
    try {
      const url = new URL(storeUrl);
      const pathParts = url.pathname.split('/');
      
      // Try to extract store/brand name from various Amazon URL patterns
      if (url.hostname.includes('amazon')) {
        // Pattern: /stores/BrandName/page/...
        const storeIndex = pathParts.indexOf('stores');
        if (storeIndex >= 0 && pathParts[storeIndex + 1]) {
          return pathParts[storeIndex + 1];
        }
        
        // Pattern: /s?k=BrandName or similar
        const searchParams = url.searchParams;
        const k = searchParams.get('k');
        if (k) return k;
        
        const rh = searchParams.get('rh');
        if (rh) return rh;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting store identifier:', error);
      return null;
    }
  }

  private calculateStoreMetrics(storeUrl: string, products: ProductData[]): StoreAnalysis {
    const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
    const averagePrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length;
    const averageRating = products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length;
    const averageReviews = products.reduce((sum, p) => sum + (p.reviews || 0), 0) / products.length;
    
    const categoryCount = products.reduce((acc, p) => {
      if (p.category) {
        acc[p.category] = (acc[p.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      storeUrl,
      products,
      totalProducts: products.length,
      totalRevenue,
      averagePrice,
      topCategories,
      performanceMetrics: {
        totalSales,
        averageRating,
        averageReviews
      },
      lastUpdated: new Date()
    };
  }

  async getKeywordData(keyword: string) {
    const cacheKey = this.getCacheKey('keyword', keyword);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = 'https://developer.junglescout.com/api/keywords/keywords_by_keyword_query';
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

      const response = await axios.post(
        `${url}?${queryParams.toString()}`,
        payload,
        { headers: this.getJungleScoutHeaders() }
      );

      const keywordData = response.data?.data?.map((item: any) => ({
        keyword: item.attributes.name,
        searchVolume: item.attributes.monthly_search_volume_exact,
        relevancyScore: item.attributes.relevancy_score,
        monthlyTrend: item.attributes.monthly_trend,
        quarterlyTrend: item.attributes.quarterly_trend,
        ppcBidBroad: item.attributes.ppc_bid_broad,
        ppcBidExact: item.attributes.ppc_bid_exact,
        organicProductCount: item.attributes.organic_product_count,
        sponsoredProductCount: item.attributes.sponsored_product_count
      })) || [];

      this.setCache(cacheKey, keywordData);
      return keywordData;
    } catch (error) {
      console.error('Error fetching keyword data:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default AmazonAnalyticsService;