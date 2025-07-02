import { createScraper, getAllScraperNames } from './scrapers/server';
import { ScraperName, getScraperInfo } from './scrapers';
import { ScrapingConfig, ScrapingResult, RawListing } from './types';
import logger from './utils/logger';

export interface ScrapingSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  scrapers: ScraperName[];
  results: Record<ScraperName, ScrapingResult>;
  totalListings: number;
  totalErrors: number;
}

export class ScraperManager {
  private currentSession?: ScrapingSession;

  async scrapeAll(config?: ScrapingConfig): Promise<ScrapingSession> {
    const scraperNames = getAllScraperNames();
    return this.scrapeSelected(scraperNames, config);
  }

  async scrapeSelected(scraperNames: ScraperName[], config?: ScrapingConfig): Promise<ScrapingSession> {
    const sessionId = this.generateSessionId();
    const session: ScrapingSession = {
      sessionId,
      startTime: new Date(),
      scrapers: scraperNames,
      results: {} as Record<ScraperName, ScrapingResult>,
      totalListings: 0,
      totalErrors: 0,
    };

    this.currentSession = session;
    logger.info(`Starting scraping session ${sessionId} with scrapers: ${scraperNames.join(', ')}`);

    for (const scraperName of scraperNames) {
      try {
        logger.info(`Starting ${scraperName} scraper...`);
        const scraper = createScraper(scraperName, config);
        const result = await scraper.scrape();
        
        session.results[scraperName] = result;
        session.totalListings += result.listings.length;
        session.totalErrors += result.errors?.length || 0;

        const scraperInfo = getScraperInfo()[scraperName];
        logger.info(`${scraperInfo.name} completed: ${result.listings.length} listings, ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (config?.delayBetweenRequests) {
          await this.delay(config.delayBetweenRequests);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to run ${scraperName} scraper:`, error);
        
        session.results[scraperName] = {
          success: false,
          listings: [],
          errors: [errorMessage],
        };
        session.totalErrors++;
      }
    }

    session.endTime = new Date();
    const duration = session.endTime.getTime() - session.startTime.getTime();
    
    logger.info(`Scraping session ${sessionId} completed in ${duration}ms`);
    logger.info(`Total listings found: ${session.totalListings}`);
    logger.info(`Total errors: ${session.totalErrors}`);

    return session;
  }

  async scrapeOne(scraperName: ScraperName, config?: ScrapingConfig): Promise<ScrapingResult> {
    logger.info(`Running single scraper: ${scraperName}`);
    
    try {
      const scraper = createScraper(scraperName, config);
      const result = await scraper.scrape();
      
      const scraperInfo = getScraperInfo()[scraperName];
      logger.info(`${scraperInfo.name} completed: ${result.listings.length} listings, ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to run ${scraperName} scraper:`, error);
      
      return {
        success: false,
        listings: [],
        errors: [errorMessage],
      };
    }
  }

  getAllListings(): RawListing[] {
    if (!this.currentSession) return [];
    
    const allListings: RawListing[] = [];
    
    for (const result of Object.values(this.currentSession.results)) {
      if (result.success) {
        allListings.push(...result.listings);
      }
    }
    
    return allListings;
  }

  getSessionSummary(): ScrapingSession | null {
    return this.currentSession || null;
  }

  getAvailableScrapers() {
    return getScraperInfo();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}