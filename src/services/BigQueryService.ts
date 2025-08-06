// BigQuery Service for Business Listings
import axios from 'axios';

export interface BusinessListing {
  id: string;
  business_name: string;
  asking_price: number;
  annual_revenue: number;
  cash_flow: number;
  location: string;
  industry: string;
  description: string;
  listing_url: string;
  source: string;
  date_listed: string;
  seller_name?: string;
  seller_email?: string;
  multiple?: number;
  inventory_value?: number;
  is_amazon_fba?: boolean;
  amazon_business_type?: string;
  established_year?: string;
  monthly_traffic?: string;
  seller_financing?: string;
  reason_for_selling?: string;
  status: 'active' | 'pending' | 'sold';
  created_at: string;
  updated_at: string;
}

export interface ListingsFilter {
  minPrice?: number;
  maxPrice?: number;
  minRevenue?: number;
  maxRevenue?: number;
  industry?: string;
  location?: string;
  source?: string;
  searchTerm?: string;
  isAmazonFba?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListingsResponse {
  listings: BusinessListing[];
  total: number;
  offset: number;
  limit: number;
}

class BigQueryService {
  private baseUrl: string;

  constructor() {
    // Detect if we're on Vercel or local development
    if (typeof window !== 'undefined') {
      // Client-side
      const isVercel = window.location.hostname.includes('vercel.app') || 
                      window.location.hostname !== 'localhost';
      
      if (isVercel) {
        // Use relative URLs for Vercel (will use the same domain)
        this.baseUrl = '';
      } else {
        // Local development
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      }
    } else {
      // Server-side (shouldn't happen in a Vite app, but just in case)
      this.baseUrl = process.env.VITE_API_BASE_URL || '';
    }
  }

  async getListings(filters?: ListingsFilter): Promise<BusinessListing[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.minRevenue) params.append('minRevenue', filters.minRevenue.toString());
        if (filters.maxRevenue) params.append('maxRevenue', filters.maxRevenue.toString());
        if (filters.industry) params.append('industry', filters.industry);
        if (filters.location) params.append('location', filters.location);
        if (filters.source) params.append('source', filters.source);
        if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
        if (filters.isAmazonFba !== undefined) params.append('isAmazonFba', filters.isAmazonFba.toString());
        params.append('limit', (filters.limit || 100).toString());
        params.append('offset', (filters.offset || 0).toString());
      }

      const url = `${this.baseUrl}/api/bigquery/listings?${params.toString()}`;
      console.log('Fetching from URL:', url);
      
      const response = await axios.get<ListingsResponse>(url);
      
      console.log('BigQuery response:', response.data);
      return response.data.listings || [];
    } catch (error) {
      console.error('Failed to fetch listings from BigQuery:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      // Throw the error so we can see it in the UI
      throw error;
    }
  }

  async getListingById(id: string): Promise<BusinessListing | null> {
    try {
      const response = await axios.get<BusinessListing>(
        `${this.baseUrl}/api/bigquery/listings/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch listing from BigQuery:', error);
      return null;
    }
  }

  async getOffMarketDeals(): Promise<BusinessListing[]> {
    // Off-market deals would be filtered by a specific source or flag
    // For now, we'll return listings from specific sources that might be off-market
    return this.getListings({
      source: 'off-market',
      limit: 100
    });
  }

  async getStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/bigquery/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats from BigQuery:', error);
      return null;
    }
  }

  // Get unique sources for filtering
  async getSources(): Promise<string[]> {
    try {
      // For now, return known sources
      return [
        'empireflippers',
        'flippa',
        'quietlight',
        'feinternational',
        'websiteclosers',
        'bizbuysell',
        'bizquest',
        'acquire',
        'websiteproperties'
      ];
    } catch (error) {
      console.error('Failed to fetch sources:', error);
      return [];
    }
  }

  // Execute raw BigQuery query (for advanced use cases)
  async executeBigQuery(query: string): Promise<any> {
    console.log('Executing BigQuery:', query);
    // This would need a separate endpoint on the server
    // For security reasons, we might not want to expose this directly
    return { rows: [] };
  }
}

export default new BigQueryService();