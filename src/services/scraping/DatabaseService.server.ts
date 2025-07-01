import { createClient } from '@supabase/supabase-js';
import { RawListing } from './types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Use process.env for Node.js environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Simple console-based logger for server environment
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
};

export class DatabaseService {
  private supabase;

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('DatabaseService initialized for server environment');
  }

  async initialize(): Promise<void> {
    try {
      // Test the connection
      const { data, error } = await this.supabase
        .from('business_listings')
        .select('count')
        .limit(1);
      
      if (error) {
        logger.error('Database connection test failed:', error);
        throw error;
      }
      
      logger.info('Database connection verified');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async saveListings(listings: RawListing[]): Promise<number> {
    try {
      logger.info(`Saving ${listings.length} listings to database`);
      
      // Transform camelCase to snake_case for database with validation
      const transformedListings = listings.map(listing => {
        // Validate and cap numeric values to prevent database errors
        const maxBigInt = 9000000000000000000; // Safe max value for PostgreSQL bigint (under JavaScript's MAX_SAFE_INTEGER)
        const safeBigInt = (value: number) => {
          if (!isFinite(value) || isNaN(value)) return 0;
          return Math.min(Math.max(Math.floor(value), 0), maxBigInt);
        };

        // Build enhanced description with all the rich data
        const enhancedDescription = this.buildEnhancedDescription(listing);
        
        // Build enhanced highlights with all the extra data
        const enhancedHighlights = this.buildEnhancedHighlights(listing);

        return {
          name: listing.name || 'Unknown Business',
          description: enhancedDescription,
          asking_price: safeBigInt(listing.askingPrice || 0),
          annual_revenue: safeBigInt(listing.annualRevenue || 0),
          industry: listing.industry || 'Business',
          location: listing.location || 'Unknown',
          source: listing.source,
          highlights: enhancedHighlights,
          image_url: listing.imageUrl || null,
          original_url: listing.originalUrl || null,
        };
      });
      
      const { data, error } = await this.supabase
        .from('business_listings')
        .insert(transformedListings)
        .select();
      
      if (error) {
        logger.error('Failed to save listings:', error);
        throw error;
      }
      
      const savedCount = data?.length || 0;
      logger.info(`Successfully saved ${savedCount} new listings`);
      return savedCount;
      
    } catch (error) {
      logger.error('Error saving listings:', error);
      throw error;
    }
  }

  private buildEnhancedDescription(listing: RawListing): string {
    let description = listing.description || '';
    
    // Add business model and niche information
    if (listing.businessModel) {
      description += `\n\n🏢 Business Model: ${listing.businessModel}`;
    }
    if (listing.niche) {
      description += `\n🎯 Niche: ${listing.niche}`;
    }
    if (listing.provider) {
      description += `\n🔗 Original Provider: ${listing.provider}`;
    }
    
    // Add financial details
    const financialDetails = [];
    if (listing.grossRevenue) {
      financialDetails.push(`Gross Revenue: $${listing.grossRevenue.toLocaleString()}`);
    }
    if (listing.netRevenue) {
      financialDetails.push(`Net Revenue: $${listing.netRevenue.toLocaleString()}`);
    }
    if (listing.monthlyRevenue) {
      financialDetails.push(`Monthly Revenue: $${listing.monthlyRevenue.toLocaleString()}`);
    }
    if (listing.annualProfit) {
      financialDetails.push(`Annual Profit: $${listing.annualProfit.toLocaleString()}`);
    }
    if (listing.profitMultiple) {
      financialDetails.push(`Profit Multiple: ${listing.profitMultiple}x`);
    }
    
    if (financialDetails.length > 0) {
      description += `\n\n💰 Financial Details:\n${financialDetails.join(' | ')}`;
    }
    
    // Add operational details
    const operationalDetails = [];
    if (listing.employees) {
      operationalDetails.push(`${listing.employees} employees`);
    }
    if (listing.establishedYear) {
      operationalDetails.push(`Est. ${listing.establishedYear}`);
    }
    if (listing.growthRate) {
      operationalDetails.push(`${listing.growthRate}% growth`);
    }
    
    if (operationalDetails.length > 0) {
      description += `\n\n📊 Operations: ${operationalDetails.join(' | ')}`;
    }
    
    // Add technology information
    if (listing.technologyStack && listing.technologyStack.length > 0) {
      description += `\n\n⚙️ Tech Stack: ${listing.technologyStack.join(', ')}`;
    }
    if (listing.trafficSources && listing.trafficSources.length > 0) {
      description += `\n📈 Traffic Sources: ${listing.trafficSources.join(', ')}`;
    }
    if (listing.monetizationModel) {
      description += `\n💸 Monetization: ${listing.monetizationModel}`;
    }
    
    return description.trim();
  }

  private buildEnhancedHighlights(listing: RawListing): string[] {
    const highlights = [...(listing.highlights || [])];
    
    // Add financial highlights
    if (listing.profitMultiple) {
      highlights.push(`${listing.profitMultiple}x Multiple`);
    }
    if (listing.rIndex) {
      highlights.push(`R-Index: ${listing.rIndex}`);
    }
    if (listing.growthRate && listing.growthRate > 20) {
      highlights.push(`High Growth: ${listing.growthRate}%`);
    }
    
    // Add qualification highlights
    if (listing.sbaQualified) {
      highlights.push('SBA Qualified');
    }
    if (listing.booposQualified) {
      highlights.push('Boopos Qualified');
    }
    
    // Add status highlights
    if (listing.newListing) {
      highlights.push('New Listing');
    }
    if (listing.priceReduced) {
      highlights.push('Price Reduced');
    }
    if (listing.underOffer) {
      highlights.push('Under Offer');
    }
    
    // Add business model highlights
    if (listing.businessModel) {
      highlights.push(listing.businessModel);
    }
    if (listing.niche) {
      highlights.push(listing.niche);
    }
    
    // Add provider highlight
    if (listing.provider) {
      highlights.push(`via ${listing.provider}`);
    }
    
    return highlights;
  }

  async getScrapingStats(): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from('business_listings')
        .select('source')
        .not('source', 'is', null);
      
      if (error) {
        logger.error('Failed to get scraping stats:', error);
        throw error;
      }
      
      // Count listings by source
      const stats: Record<string, number> = {};
      data?.forEach(listing => {
        const source = listing.source || 'Unknown';
        stats[source] = (stats[source] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      logger.error('Error getting scraping stats:', error);
      throw error;
    }
  }

  async getRecentListings(limit: number = 10): Promise<RawListing[]> {
    try {
      const { data, error } = await this.supabase
        .from('business_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('Failed to get recent listings:', error);
        throw error;
      }
      
      // Transform snake_case back to camelCase
      const transformedData = data?.map(listing => ({
        name: listing.name,
        description: listing.description,
        askingPrice: listing.asking_price,
        annualRevenue: listing.annual_revenue,
        industry: listing.industry,
        location: listing.location,
        source: listing.source,
        highlights: listing.highlights,
        imageUrl: listing.image_url,
        originalUrl: listing.original_url,
        scrapedAt: listing.scraped_at || listing.created_at,
      })) || [];
      
      return transformedData;
      
    } catch (error) {
      logger.error('Error getting recent listings:', error);
      throw error;
    }
  }
}