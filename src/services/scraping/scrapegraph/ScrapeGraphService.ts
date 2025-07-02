import { smartScraper, getCredits } from 'scrapegraph-js';
import { z } from 'zod';
import { formatPrice } from '../utils/dataProcessor';

// Use Node-compatible supabase client when running in Node environment
let supabase: any;
if (typeof window === 'undefined') {
  // Node.js environment
  const { supabase: nodeSupabase } = require('../../../lib/supabase-node');
  supabase = nodeSupabase;
} else {
  // Browser environment
  const { supabase: browserSupabase } = require('../../../lib/supabase');
  supabase = browserSupabase;
}

// Define the exact schema we need for business listings
const BusinessListingSchema = z.object({
  listings: z.array(z.object({
    // Core identifiers
    name: z.string().optional(),
    listingUrl: z.string().optional(),
    listingId: z.string().optional(),
    
    // Financial data
    askingPrice: z.union([z.string(), z.number()]).optional(),
    annualRevenue: z.union([z.string(), z.number()]).optional(),
    annualProfit: z.union([z.string(), z.number()]).optional(),
    monthlyRevenue: z.union([z.string(), z.number()]).optional(),
    profitMultiple: z.union([z.string(), z.number()]).optional(),
    
    // Business details
    description: z.string().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    businessModel: z.string().optional(),
    niche: z.string().optional(),
    
    // Additional metadata
    dateListed: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    established: z.union([z.string(), z.number()]).optional(),
    employees: z.union([z.string(), z.number()]).optional(),
    
    // FBA specific
    isFBA: z.boolean().optional(),
    amazonCategories: z.array(z.string()).optional(),
  }))
});

type BusinessListing = z.infer<typeof BusinessListingSchema>['listings'][0];

export interface ScrapeGraphConfig {
  apiKey: string;
  maxPages?: number;
  delayBetweenRequests?: number;
  verbose?: boolean;
}

export interface ScraperSite {
  name: string;
  baseUrl: string;
  searchUrl: string;
  detailPrompt: string;
  listPrompt: string;
  pagination?: {
    type: 'page' | 'offset' | 'loadMore';
    parameter: string;
    increment: number;
  };
}

// Define scraper configurations for each site
const SCRAPER_SITES: Record<string, ScraperSite> = {
  quietlight: {
    name: 'QuietLight',
    baseUrl: 'https://quietlight.com',
    searchUrl: 'https://quietlight.com/listings/',
    listPrompt: `Extract ALL business listings from this page. For EACH listing, extract:
      - listingUrl: The FULL URL to the listing detail page (must start with https://quietlight.com/listings/ and include the ID)
      - name: Business name or title
      - askingPrice: The asking price (convert to number, e.g., "$1.2M" = 1200000)
      - annualRevenue: Annual revenue if shown
      - annualProfit: Annual profit/earnings if shown
      - profitMultiple: The profit multiple (e.g., "3.5x")
      - industry: Business type/industry
      - description: Brief description
      - isFBA: true if it mentions Amazon FBA, false otherwise
      
      Return ONLY valid JSON with a "listings" array containing all found listings.`,
    detailPrompt: `Extract complete business details from this listing page:
      - All financial metrics (revenue, profit, cash flow)
      - Complete business description
      - Location
      - Date established
      - Employee count
      - Business model details
      - For FBA businesses: product categories, Amazon-specific metrics`
  },
  
  bizbuysell: {
    name: 'BizBuySell',
    baseUrl: 'https://www.bizbuysell.com',
    searchUrl: 'https://www.bizbuysell.com/business-opportunities/?q=amazon+fba+ecommerce',
    listPrompt: `Extract ALL business listings from this BizBuySell search results page. For EACH listing:
      - listingUrl: FULL URL to the listing (include https://www.bizbuysell.com)
      - listingId: The listing ID number
      - name: Business title/name
      - askingPrice: Asking price as a number
      - annualRevenue: Gross revenue/sales
      - location: City, State
      - industry: Business category
      - description: The listing description snippet
      - isFBA: true if mentions Amazon/FBA/ecommerce
      
      Return valid JSON with "listings" array.`,
    pagination: {
      type: 'page',
      parameter: 'page',
      increment: 1
    }
  },
  
  flippa: {
    name: 'Flippa',
    baseUrl: 'https://flippa.com',
    searchUrl: 'https://flippa.com/search?filter[property_type]=website,business&filter[monetization]=ecommerce&search_terms=amazon%20fba',
    listPrompt: `Extract ALL business/website listings from Flippa. For EACH:
      - listingUrl: Full URL to listing
      - name: Listing title
      - askingPrice: Current price/bid
      - monthlyRevenue: Monthly revenue
      - monthlyProfit: Monthly profit
      - profitMultiple: Profit multiple
      - businessModel: Type (ecommerce/content/saas)
      - niche: Business niche/category
      - established: Age of business
      - isFBA: true if Amazon FBA business
      
      Return JSON with "listings" array.`,
    detailPrompt: `Extract all details including traffic data, monetization methods, growth trends`
  },
  
  empireflippers: {
    name: 'Empire Flippers',
    baseUrl: 'https://empireflippers.com',
    searchUrl: 'https://empireflippers.com/marketplace/',
    listPrompt: `Extract ALL listings from Empire Flippers marketplace. Focus on:
      - listingUrl: Full URL
      - listingId: EF listing number
      - askingPrice: Listed price
      - monthlyProfit: Net monthly profit
      - profitMultiple: Multiple
      - businessModel: Business type
      - niche: Industry/niche
      - established: Months old
      - isFBA: true for Amazon FBA businesses
      
      Return JSON with "listings" array.`,
    detailPrompt: `Extract comprehensive metrics, traffic sources, growth history`
  }
};

export class ScrapeGraphService {
  private apiKey: string;
  private config: ScrapeGraphConfig;
  
  constructor(config: ScrapeGraphConfig) {
    this.apiKey = config.apiKey;
    this.config = config;
  }
  
  /**
   * Check available API credits
   */
  async checkCredits(): Promise<number> {
    try {
      const credits = await getCredits(this.apiKey);
      return credits;
    } catch (error) {
      console.error('Failed to get credits:', error);
      return -1;
    }
  }
  
  /**
   * Scrape listings from a specific site
   */
  async scrapeSite(siteName: string, maxPages: number = 1): Promise<BusinessListing[]> {
    const site = SCRAPER_SITES[siteName.toLowerCase()];
    if (!site) {
      throw new Error(`Unknown site: ${siteName}`);
    }
    
    const allListings: BusinessListing[] = [];
    
    try {
      // Scrape the listing pages
      for (let page = 1; page <= maxPages; page++) {
        if (this.config.verbose) {
          console.log(`Scraping ${site.name} - Page ${page}...`);
        }
        
        const url = this.buildPageUrl(site, page);
        const listings = await this.scrapeListingPage(url, site);
        
        if (listings.length === 0) {
          break; // No more listings
        }
        
        allListings.push(...listings);
        
        // Delay between pages to be respectful
        if (page < maxPages) {
          await this.delay(this.config.delayBetweenRequests || 3000);
        }
      }
      
      // Optionally scrape detail pages for more info
      // This uses more credits, so only do it for high-value listings
      const enrichedListings = await this.enrichListingsWithDetails(allListings, site);
      
      return enrichedListings;
    } catch (error) {
      console.error(`Error scraping ${site.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Scrape a single listing page
   */
  private async scrapeListingPage(url: string, site: ScraperSite): Promise<BusinessListing[]> {
    try {
      const prompt = site.listPrompt + `
        
        IMPORTANT: Return ONLY valid JSON that matches this exact structure:
        {
          "listings": [
            {
              "name": "string",
              "listingUrl": "string", 
              "askingPrice": number or string,
              "annualRevenue": number or string,
              "annualProfit": number or string,
              "monthlyRevenue": number or string,
              "profitMultiple": number or string,
              "description": "string",
              "industry": "string",
              "location": "string",
              "businessModel": "string",
              "niche": "string",
              "isFBA": boolean,
              "listingId": "string",
              "dateListed": "string",
              "established": number or string
            }
          ]
        }`;
      
      const response = await smartScraper(this.apiKey, url, prompt);
      
      if (this.config.verbose) {
        console.log('Raw response:', response);
      }
      
      // Parse and validate the response
      const parsed = this.parseScraperResponse(response);
      const validated = BusinessListingSchema.parse(parsed);
      
      return validated.listings;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      return [];
    }
  }
  
  /**
   * Enrich listings with detail page data (uses more credits)
   */
  private async enrichListingsWithDetails(
    listings: BusinessListing[], 
    site: ScraperSite,
    maxEnrich: number = 5
  ): Promise<BusinessListing[]> {
    // Only enrich the top listings to conserve credits
    const toEnrich = listings.slice(0, maxEnrich);
    
    const enrichedListings = await Promise.all(
      toEnrich.map(async (listing, index) => {
        if (!listing.listingUrl || !site.detailPrompt) {
          return listing;
        }
        
        try {
          // Add delay between detail scrapes
          if (index > 0) {
            await this.delay(2000);
          }
          
          const detailResponse = await smartScraper(
            this.apiKey,
            listing.listingUrl,
            site.detailPrompt
          );
          
          const details = this.parseScraperResponse(detailResponse);
          
          // Merge with original listing
          return { ...listing, ...details };
        } catch (error) {
          console.error(`Error enriching listing ${listing.name}:`, error);
          return listing;
        }
      })
    );
    
    // Return enriched listings plus the rest
    return [...enrichedListings, ...listings.slice(maxEnrich)];
  }
  
  /**
   * Scrape all configured sites
   */
  async scrapeAllSites(maxPagesPerSite: number = 2): Promise<Record<string, BusinessListing[]>> {
    const results: Record<string, BusinessListing[]> = {};
    
    for (const [key, site] of Object.entries(SCRAPER_SITES)) {
      try {
        console.log(`Starting scrape for ${site.name}...`);
        const listings = await this.scrapeSite(key, maxPagesPerSite);
        results[key] = listings;
        
        console.log(`Found ${listings.length} listings from ${site.name}`);
        
        // Save to database
        await this.saveListingsToDatabase(listings, site.name);
        
        // Delay between sites
        await this.delay(5000);
      } catch (error) {
        console.error(`Failed to scrape ${site.name}:`, error);
        results[key] = [];
      }
    }
    
    return results;
  }
  
  /**
   * Save listings to Supabase
   */
  private async saveListingsToDatabase(listings: BusinessListing[], source: string): Promise<void> {
    if (listings.length === 0) return;
    
    const formattedListings = listings.map(listing => ({
      name: listing.name || 'Unknown Business',
      description: listing.description || '',
      source: source,
      original_url: listing.listingUrl || '',
      asking_price: this.parsePrice(listing.askingPrice),
      annual_revenue: this.parsePrice(listing.annualRevenue),
      annual_profit: this.parsePrice(listing.annualProfit),
      monthly_revenue: this.parsePrice(listing.monthlyRevenue),
      profit_multiple: this.parseMultiple(listing.profitMultiple),
      location: listing.location || '',
      industry: listing.industry || '',
      business_model: listing.businessModel || '',
      niche: listing.niche || '',
      listing_date: listing.dateListed ? new Date(listing.dateListed) : new Date(),
      established_year: this.parseYear(listing.established),
      employees: this.parseNumber(listing.employees),
      highlights: listing.highlights || [],
      listing_status: 'active',
      scraped_at: new Date().toISOString().split('T')[0]
    }));
    
    const { error } = await supabase
      .from('business_listings')
      .upsert(formattedListings, {
        onConflict: 'original_url',
        ignoreDuplicates: true
      });
    
    if (error) {
      console.error('Error saving to database:', error);
    } else {
      console.log(`Saved ${formattedListings.length} listings to database`);
    }
  }
  
  // Helper methods
  private buildPageUrl(site: ScraperSite, page: number): string {
    if (!site.pagination || page === 1) {
      return site.searchUrl;
    }
    
    const url = new URL(site.searchUrl);
    if (site.pagination.type === 'page') {
      url.searchParams.set(site.pagination.parameter, page.toString());
    } else if (site.pagination.type === 'offset') {
      const offset = (page - 1) * site.pagination.increment;
      url.searchParams.set(site.pagination.parameter, offset.toString());
    }
    
    return url.toString();
  }
  
  private parseScraperResponse(response: any): any {
    // The response should already be parsed JSON from smartScraper
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        // Try to extract JSON from the string
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
    return response;
  }
  
  private parsePrice(value: any): number | null {
    if (!value) return null;
    const parsed = formatPrice(value);
    return parsed || null;
  }
  
  private parseMultiple(value: any): number | null {
    if (!value) return null;
    const str = value.toString().replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
  
  private parseYear(value: any): number | null {
    if (!value) return null;
    const currentYear = new Date().getFullYear();
    
    if (typeof value === 'number') {
      return value > 1900 && value <= currentYear ? value : null;
    }
    
    const str = value.toString();
    // Check if it's already a year
    const yearMatch = str.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return parseInt(yearMatch[0]);
    }
    
    // Check if it's age (e.g., "3 years old")
    const ageMatch = str.match(/(\d+)\s*(year|yr)/i);
    if (ageMatch) {
      return currentYear - parseInt(ageMatch[1]);
    }
    
    return null;
  }
  
  private parseNumber(value: any): number | null {
    if (!value) return null;
    const num = parseInt(value.toString().replace(/\D/g, ''));
    return isNaN(num) ? null : num;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export convenience function
export async function createScrapeGraphService(apiKey?: string): Promise<ScrapeGraphService> {
  const key = apiKey || process.env.VITE_SCRAPEGRAPH_API_KEY || process.env.SCRAPEGRAPH_API_KEY;
  
  if (!key) {
    throw new Error('ScrapeGraph API key not found. Set VITE_SCRAPEGRAPH_API_KEY in .env');
  }
  
  return new ScrapeGraphService({
    apiKey: key,
    verbose: true,
    delayBetweenRequests: 3000,
    maxPages: 3
  });
}