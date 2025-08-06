// BigQuery Service for Business Listings
// This service will connect to BigQuery to fetch business listings data

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
}

class BigQueryService {
  private baseUrl: string;

  constructor() {
    // This will be configured to point to your BigQuery API endpoint
    this.baseUrl = process.env.VITE_BIGQUERY_API_URL || '/api/bigquery';
  }

  async getListings(filters?: ListingsFilter): Promise<BusinessListing[]> {
    // For now, return mock data
    // In production, this will fetch from BigQuery
    return this.getMockListings(filters);
  }

  async getListingById(id: string): Promise<BusinessListing | null> {
    const listings = await this.getMockListings();
    return listings.find(l => l.id === id) || null;
  }

  async getOffMarketDeals(): Promise<BusinessListing[]> {
    const listings = await this.getMockListings();
    return listings.filter(l => l.source === 'off-market');
  }

  private getMockListings(filters?: ListingsFilter): BusinessListing[] {
    // Mock data for development
    const mockListings: BusinessListing[] = [
      {
        id: '1',
        business_name: 'Premium Amazon FBA Electronics Store',
        asking_price: 2500000,
        annual_revenue: 5000000,
        cash_flow: 750000,
        location: 'United States',
        industry: 'E-commerce',
        description: 'Established Amazon FBA business selling premium electronics with strong brand presence',
        listing_url: 'https://example.com/listing/1',
        source: 'BizBuySell',
        date_listed: '2024-01-15',
        multiple: 3.3,
        inventory_value: 250000,
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        business_name: 'Health & Beauty Amazon Brand',
        asking_price: 1800000,
        annual_revenue: 3200000,
        cash_flow: 540000,
        location: 'California',
        industry: 'Health & Beauty',
        description: 'Fast-growing health and beauty brand on Amazon with proprietary products',
        listing_url: 'https://example.com/listing/2',
        source: 'QuietLight',
        date_listed: '2024-01-20',
        multiple: 3.3,
        inventory_value: 180000,
        status: 'active',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
      },
      {
        id: '3',
        business_name: 'Pet Supplies Amazon Business',
        asking_price: 950000,
        annual_revenue: 1800000,
        cash_flow: 285000,
        location: 'Texas',
        industry: 'Pet Supplies',
        description: 'Profitable pet supplies business with recurring customers',
        listing_url: '',
        source: 'off-market',
        date_listed: '2024-01-25',
        seller_name: 'John Doe',
        seller_email: 'john@example.com',
        multiple: 3.3,
        inventory_value: 95000,
        status: 'active',
        created_at: '2024-01-25T10:00:00Z',
        updated_at: '2024-01-25T10:00:00Z'
      }
    ];

    // Apply filters if provided
    let filtered = [...mockListings];

    if (filters) {
      if (filters.minPrice) {
        filtered = filtered.filter(l => l.asking_price >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        filtered = filtered.filter(l => l.asking_price <= filters.maxPrice!);
      }
      if (filters.minRevenue) {
        filtered = filtered.filter(l => l.annual_revenue >= filters.minRevenue!);
      }
      if (filters.maxRevenue) {
        filtered = filtered.filter(l => l.annual_revenue <= filters.maxRevenue!);
      }
      if (filters.industry) {
        filtered = filtered.filter(l => l.industry.toLowerCase().includes(filters.industry!.toLowerCase()));
      }
      if (filters.location) {
        filtered = filtered.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      if (filters.source) {
        filtered = filtered.filter(l => l.source === filters.source);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(l => 
          l.business_name.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.industry.toLowerCase().includes(term)
        );
      }
    }

    return filtered;
  }

  // Future BigQuery integration
  async executeBigQuery(query: string): Promise<any> {
    // This will execute actual BigQuery queries
    // For now, it's a placeholder
    console.log('BigQuery query:', query);
    return { rows: [] };
  }
}

export default new BigQueryService();