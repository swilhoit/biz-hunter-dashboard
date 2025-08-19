import CacheService from './CacheService';

export interface BusinessListing {
  id: string;
  business_name: string;
  asking_price: number;
  monthly_revenue: number;
  monthly_profit: number;
  ttm_revenue: number;
  ttm_profit: number;
  asking_multiple: number;
  description: string;
  category: string;
  subcategory: string;
  source: string;
  listing_url: string;
  image_url: string;
  location: string;
  year_established: number;
  employees: string;
  created_at: string;
  updated_at: string;
  status: string;
  ecommerce_platform?: string;
  monthly_sessions?: number;
  conversion_rate?: number;
  aov?: number;
  inventory_value?: number;
  supplier_count?: number;
  sku_count?: number;
  is_ecommerce?: boolean;
}

export interface ListingsFilter {
  searchTerm?: string;
  priceRange?: { min: string; max: string };
  monthlyRevenue?: { min: string; max: string };
  monthlyProfit?: { min: string; max: string };
  source?: string;
  category?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class BigQueryService {
  private apiUrl = '/api/listings';

  async getListings(filters: ListingsFilter = {}, useCache: boolean = true): Promise<{ listings: BusinessListing[]; total: number }> {
    // Generate cache key
    const cacheKey = CacheService.getListingsKey(filters);
    
    // Try to get from cache first
    if (useCache) {
      const cached = CacheService.get<{ listings: BusinessListing[]; total: number }>(cacheKey);
      if (cached) {
        console.log('Returning cached listings');
        return cached;
      }
    }
    
    try {
      const params = new URLSearchParams();
      
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.priceRange?.min) params.append('minPrice', filters.priceRange.min);
      if (filters.priceRange?.max) params.append('maxPrice', filters.priceRange.max);
      if (filters.monthlyRevenue?.min) params.append('minRevenue', filters.monthlyRevenue.min);
      if (filters.monthlyRevenue?.max) params.append('maxRevenue', filters.monthlyRevenue.max);
      if (filters.monthlyProfit?.min) params.append('minProfit', filters.monthlyProfit.min);
      if (filters.monthlyProfit?.max) params.append('maxProfit', filters.monthlyProfit.max);
      if (filters.source) params.append('source', filters.source);
      if (filters.category) params.append('category', filters.category);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${this.apiUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      const result = {
        listings: data.listings || [],
        total: data.total || 0
      };
      
      // Cache the result
      if (useCache) {
        CacheService.set(cacheKey, result, 60 * 1000); // Cache for 1 minute (reduced for viewport loading)
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  async getListingById(id: string, useCache: boolean = true): Promise<BusinessListing> {
    const cacheKey = `listing_${id}`;
    
    // Try cache first
    if (useCache) {
      const cached = CacheService.get<BusinessListing>(cacheKey);
      if (cached) {
        console.log('Returning cached listing detail');
        return cached;
      }
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listing: ${response.statusText}`);
      }

      const listing = await response.json();
      
      // Cache the result
      if (useCache) {
        CacheService.set(cacheKey, listing, 10 * 60 * 1000); // Cache for 10 minutes (longer for details since prefetched)
      }
      
      return listing;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  }

}

export default new BigQueryService();