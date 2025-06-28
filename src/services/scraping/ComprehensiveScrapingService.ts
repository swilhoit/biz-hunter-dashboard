import { ScraperAPIBizBuySellScraper } from './scrapers/ScraperAPIBizBuySellScraper';
import { ScraperAPIEmpireFlippersScraper } from './scrapers/ScraperAPIEmpireFlippersScraper';
import { ScraperAPIQuietLightScraper } from './scrapers/ScraperAPIQuietLightScraper';
import { ScraperAPIFlippaScraper } from './scrapers/ScraperAPIFlippaScraper';
import { ScraperAPIAcquireScraper } from './scrapers/ScraperAPIAcquireScraper';
import { BaseScraper, ScrapingResult, RawListing, ScrapingConfig } from './types';
import { supabase } from '../../integrations/supabase/client';
import logger from './utils/logger';

export interface ComprehensiveScrapingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  totalListings: number;
  sources: string[];
  results: Record<string, ScrapingResult>;
  errors: string[];
}

export class ComprehensiveScrapingService {
  private scrapers: Map<string, BaseScraper> = new Map();
  private currentSession?: ComprehensiveScrapingSession;

  constructor() {
    this.initializeScrapers();
  }

  private initializeScrapers(): void {
    // Initialize all fixed ScraperAPI scrapers 
    this.scrapers.set('bizbuysell', new ScraperAPIBizBuySellScraper());
    this.scrapers.set('empireflippers', new ScraperAPIEmpireFlippersScraper());
    this.scrapers.set('quietlight', new ScraperAPIQuietLightScraper());
    this.scrapers.set('flippa', new ScraperAPIFlippaScraper());
    this.scrapers.set('acquire', new ScraperAPIAcquireScraper()); // Fixed: MicroAcquire -> Acquire.com
  }

  async scrapeAllSources(config: ScrapingConfig = {}): Promise<ComprehensiveScrapingSession> {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      status: 'running',
      totalListings: 0,
      sources: Array.from(this.scrapers.keys()),
      results: {},
      errors: [],
    };

    logger.info(`Starting comprehensive scraping session ${sessionId} with sources: ${this.currentSession.sources.join(', ')}`);

    const allListings: RawListing[] = [];
    const sessionErrors: string[] = [];

    // Configure all scrapers
    const scrapingConfig = {
      maxPages: 2, // Limit pages for faster results
      delayBetweenRequests: 3000, // Be respectful
      ...config
    };

    for (const [sourceName, scraper] of this.scrapers) {
      try {
        logger.info(`Starting scraper: ${sourceName}`);
        
        // Configure scraper
        scraper.updateConfig(scrapingConfig);
        
        const result = await scraper.scrape();
        this.currentSession.results[sourceName] = result;
        
        if (result.success) {
          allListings.push(...result.listings);
          logger.info(`${sourceName}: ✅ ${result.listings.length} listings scraped`);
        } else {
          const errors = result.errors || [`${sourceName} scraping failed`];
          sessionErrors.push(...errors);
          logger.error(`${sourceName}: ❌ ${errors.join(', ')}`);
        }
        
        // Add delay between scrapers to be respectful
        if (sourceName !== Array.from(this.scrapers.keys()).pop()) { // Don't delay after last scraper
          await this.delay(5000);
        }
        
      } catch (error) {
        const errorMessage = `${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        sessionErrors.push(errorMessage);
        logger.error(errorMessage);
      }
    }

    // Save all listings to database
    try {
      if (allListings.length > 0) {
        const savedCount = await this.saveListingsToDatabase(allListings);
        logger.info(`💾 Saved ${savedCount} listings to database`);
      } else {
        logger.warn('No listings found to save');
      }
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

    const duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    logger.info(`🎉 Comprehensive scraping session ${sessionId} completed in ${Math.round(duration / 1000)}s: ${allListings.length} total listings, ${sessionErrors.length} errors`);

    // Log summary by source
    logger.info('📊 Results by source:');
    Object.entries(this.currentSession.results).forEach(([source, result]) => {
      logger.info(`  - ${source}: ${result.success ? '✅' : '❌'} ${result.listings.length} listings`);
    });

    return this.currentSession;
  }

  private async saveListingsToDatabase(listings: RawListing[]): Promise<number> {
    if (listings.length === 0) return 0;

    // Deduplicate listings by name and source
    const uniqueListings = listings.filter((listing, index, self) =>
      index === self.findIndex((l) => l.name === listing.name && l.source === listing.source)
    );

    logger.info(`Deduplicating: ${listings.length} → ${uniqueListings.length} unique listings`);

    const dbListings = uniqueListings.map(listing => ({
      name: listing.name,
      description: listing.description || null,
      asking_price: listing.askingPrice,
      annual_revenue: listing.annualRevenue,
      industry: listing.industry,
      location: listing.location,
      source: listing.source,
      highlights: listing.highlights,
      image_url: listing.imageUrl || null,
      original_url: listing.originalUrl || null,
      status: 'active' as const,
    }));

    // Insert in batches to avoid hitting limits
    const batchSize = 100;
    let totalSaved = 0;

    for (let i = 0; i < dbListings.length; i += batchSize) {
      const batch = dbListings.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('business_listings')
          .insert(batch)
          .select();

        if (error) {
          logger.error(`Database batch error (${i}-${i + batch.length}):`, error.message);
          // Continue with next batch rather than failing completely
        } else {
          totalSaved += data?.length || 0;
          logger.info(`Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dbListings.length / batchSize)}: ${data?.length || 0} listings`);
        }
      } catch (batchError) {
        logger.error(`Batch save error (${i}-${i + batch.length}):`, batchError);
      }
    }

    return totalSaved;
  }

  getAvailableScrapers(): string[] {
    return Array.from(this.scrapers.keys());
  }

  getCurrentSession(): ComprehensiveScrapingSession | undefined {
    return this.currentSession;
  }

  getScraperMetrics(sourceName: string) {
    const scraper = this.scrapers.get(sourceName.toLowerCase());
    return scraper?.getMetrics();
  }

  private generateSessionId(): string {
    return `comprehensive-scraping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}