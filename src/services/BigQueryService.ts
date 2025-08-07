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

  async getListings(filters: ListingsFilter = {}): Promise<{ listings: BusinessListing[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.searchTerm) params.append('search', filters.searchTerm);
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
      return {
        listings: data.listings || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  async getListingById(id: string): Promise<BusinessListing> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listing: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  }

}

export default new BigQueryService();