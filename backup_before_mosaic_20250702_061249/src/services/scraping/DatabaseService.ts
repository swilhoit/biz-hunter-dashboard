import { createClient } from '@supabase/supabase-js';
import { RawListing } from './types';

// Use environment variables or fallback to import from main client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Simple console-based logger for browser environment
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
};

export class DatabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveListings(listings: RawListing[]): Promise<{ saved: number; errors: number }> {
    let saved = 0;
    let errors = 0;

    logger.info(`Attempting to save ${listings.length} listings to database`);

    for (const listing of listings) {
      try {
        const dbListing = this.transformListingForDb(listing);
        
        const { error } = await this.supabase
          .from('business_listings')
          .upsert([dbListing], { 
            onConflict: 'name,original_url,source',
            ignoreDuplicates: false 
          });

        if (error) {
          logger.error(`Failed to save listing "${listing.name}":`, error);
          errors++;
        } else {
          saved++;
        }
      } catch (error) {
        logger.error(`Error processing listing "${listing.name}":`, error);
        errors++;
      }
    }

    logger.info(`Database save completed: ${saved} saved, ${errors} errors`);
    return { saved, errors };
  }

  async getListingsBySource(source: string, limit: number = 100): Promise<RawListing[]> {
    const { data, error } = await this.supabase
      .from('business_listings')
      .select('*')
      .eq('source', source)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(`Failed to fetch listings for source ${source}:`, error);
      return [];
    }

    return data?.map(this.transformDbToListing) || [];
  }

  async getAllListings(limit: number = 100): Promise<RawListing[]> {
    const { data, error } = await this.supabase
      .from('business_listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch all listings:', error);
      return [];
    }

    return data?.map(this.transformDbToListing) || [];
  }

  async getListingStats(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('business_listings')
      .select('source')
      .not('source', 'is', null);

    if (error) {
      logger.error('Failed to fetch listing stats:', error);
      return {};
    }

    const stats: Record<string, number> = {};
    data?.forEach(item => {
      stats[item.source] = (stats[item.source] || 0) + 1;
    });

    return stats;
  }

  private transformListingForDb(listing: RawListing): any {
    return {
      name: listing.name,
      asking_price: listing.askingPrice,
      annual_revenue: listing.annualRevenue,
      industry: listing.industry,
      location: listing.location,
      description: listing.description,
      highlights: listing.highlights?.join(', ') || null,
      original_url: listing.originalUrl,
      image_url: listing.imageUrl,
      source: listing.source,
      scraped_at: listing.scrapedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    };
  }

  private transformDbToListing(dbRow: any): RawListing {
    return {
      name: dbRow.name,
      askingPrice: dbRow.asking_price || 0,
      annualRevenue: dbRow.annual_revenue || 0,
      industry: dbRow.industry || '',
      location: dbRow.location || '',
      description: dbRow.description,
      highlights: dbRow.highlights ? dbRow.highlights.split(', ') : [],
      originalUrl: dbRow.original_url,
      imageUrl: dbRow.image_url,
      source: dbRow.source,
      scrapedAt: new Date(dbRow.scraped_at || dbRow.created_at),
    };
  }
}