import { ScraperAPIBizBuySellScraper } from './scrapers/ScraperAPIBizBuySellScraper';
import { ScraperAPIEmpireFlippersScraper } from './scrapers/ScraperAPIEmpireFlippersScraper';
import { ExitAdviserScraper } from './scrapers/ExitAdviserScraper';
import { BaseScraper, ScrapingResult, RawListing, ScrapingConfig } from './types';
import { supabase } from '../../integrations/supabase/client';
import logger from './utils/logger';
import { DataProcessor } from './utils/dataProcessor';

export interface ScrapingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  totalListings: number;
  sources: string[];
  errors: string[];
}

export class ScrapingService {
  private scrapers: Map<string, BaseScraper> = new Map();
  private currentSession?: ScrapingSession;

  constructor() {
    this.initializeScrapers();
  }

  private initializeScrapers(): void {
    // Initialize available scrapers - now using ScraperAPI
    this.scrapers.set('bizbuysell', new ScraperAPIBizBuySellScraper());
    this.scrapers.set('empireflippers', new ScraperAPIEmpireFlippersScraper());
    this.scrapers.set('exitadviser', new ExitAdviserScraper());
    // Additional scrapers can be added here
  }

  async scrapeAll(config: ScrapingConfig = {}): Promise<ScrapingSession> {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      status: 'running',
      totalListings: 0,
      sources: Array.from(this.scrapers.keys()),
      errors: [],
    };

    logger.info(`Starting scraping session ${sessionId}`);

    const allListings: RawListing[] = [];
    const sessionErrors: string[] = [];

    for (const [sourceName, scraper] of this.scrapers) {
      try {
        logger.info(`Running scraper: ${sourceName}`);
        
        // Configure scraper
        scraper.updateConfig(config);
        
        const result = await scraper.scrape();
        
        if (result.success) {
          allListings.push(...result.listings);
          logger.info(`${sourceName}: ${result.listings.length} listings scraped`);
        } else {
          const errors = result.errors || [`${sourceName} scraping failed`];
          sessionErrors.push(...errors);
          logger.error(`${sourceName} failed:`, errors);
        }
        
        // Add delay between scrapers to be respectful
        await this.delay(5000);
        
      } catch (error) {
        const errorMessage = `${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        sessionErrors.push(errorMessage);
        logger.error(errorMessage);
      }
    }

    // Save listings to database
    try {
      const savedCount = await this.saveListingsToDatabase(allListings);
      logger.info(`Saved ${savedCount} listings to database`);
    } catch (error) {
      const errorMessage = `Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      sessionErrors.push(errorMessage);
      logger.error(errorMessage);
    }

    // Update session
    this.currentSession.endTime = new Date();
    this.currentSession.status = sessionErrors.length === 0 ? 'completed' : 'failed';
    this.currentSession.totalListings = allListings.length;
    this.currentSession.errors = sessionErrors;

    logger.info(`Scraping session ${sessionId} completed: ${allListings.length} listings, ${sessionErrors.length} errors`);

    return this.currentSession;
  }

  async scrapeSource(sourceName: string, config: ScrapingConfig = {}): Promise<ScrapingResult> {
    const scraper = this.scrapers.get(sourceName.toLowerCase());
    
    if (!scraper) {
      throw new Error(`Scraper not found for source: ${sourceName}`);
    }

    logger.info(`Running single scraper: ${sourceName}`);
    
    // Configure scraper
    scraper.updateConfig(config);
    
    const result = await scraper.scrape();
    
    if (result.success && result.listings.length > 0) {
      try {
        const savedCount = await this.saveListingsToDatabase(result.listings);
        logger.info(`Saved ${savedCount} listings from ${sourceName} to database`);
      } catch (error) {
        logger.error(`Failed to save ${sourceName} listings:`, error);
      }
    }

    return result;
  }

  private async saveListingsToDatabase(listings: RawListing[]): Promise<number> {
    if (listings.length === 0) return 0;

    const dbListings = listings.map(listing => ({
      name: listing.name,
      description: listing.description || null,
      asking_price: listing.askingPrice,
      annual_revenue: listing.annualRevenue,
      industry: listing.industry,
      location: listing.location,
      source: listing.source,
      highlights: listing.highlights,
      image_url: listing.imageUrl || null,
      status: 'active' as const,
    }));

    const { data, error } = await supabase
      .from('business_listings')
      .upsert(dbListings, {
        onConflict: 'name,source', // Avoid duplicates based on name and source
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data?.length || 0;
  }

  getAvailableScrapers(): string[] {
    return Array.from(this.scrapers.keys());
  }

  getCurrentSession(): ScrapingSession | undefined {
    return this.currentSession;
  }

  getScraperMetrics(sourceName: string) {
    const scraper = this.scrapers.get(sourceName.toLowerCase());
    return scraper?.getMetrics();
  }

  private generateSessionId(): string {
    return `scraping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}