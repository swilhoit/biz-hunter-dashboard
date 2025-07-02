export interface BusinessListing {
  id: string;
  name: string;
  description: string | null;
  asking_price: number;
  annual_revenue: number;
  industry: string;
  location: string;
  source: string;
  highlights: string[];
  image_url?: string | null;
  original_url?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

// REMOVED: All mock listings have been deleted to ensure only REAL data
// The app now only uses real scraped listings from BizBuySell
// Use the admin panel to scrape fresh real listings
export const mockListings: BusinessListing[] = [];