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
      
      const { data, error } = await this.supabase
        .from('business_listings')
        .insert(listings)
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
        .order('scraped_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('Failed to get recent listings:', error);
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      logger.error('Error getting recent listings:', error);
      throw error;
    }
  }
}