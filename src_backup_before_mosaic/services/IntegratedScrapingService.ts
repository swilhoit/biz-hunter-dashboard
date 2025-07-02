import { ScraperManager } from './scraping/ScraperManager';
import { DatabaseService } from './scraping/DatabaseService';
import { ScrapingConfig, ScrapingResult } from './scraping/types';
import { createScraper, getAllScraperNames } from './scraping/scrapers/server';
import { ScraperName, getScraperInfo } from './scraping/scrapers';
// Simple console-based logger for browser environment
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
};

export interface ScrapingOperation {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentScraper?: string;
  totalScrapers: number;
  completedScrapers: number;
  startTime: Date;
  endTime?: Date;
  results?: {
    totalListings: number;
    newListings: number;
    errors: number;
    scraperResults: Record<string, { success: boolean; listings: number; errors: string[] }>;
  };
  error?: string;
}

class IntegratedScrapingService {
  private scraperManager: ScraperManager;
  private dbService: DatabaseService;
  private currentOperation?: ScrapingOperation;
  private progressCallbacks: Set<(operation: ScrapingOperation) => void> = new Set();

  constructor() {
    this.scraperManager = new ScraperManager();
    this.dbService = new DatabaseService();
  }

  async runFullScraping(config?: ScrapingConfig): Promise<ScrapingOperation> {
    // In browser environment, this should call the API instead
    if (typeof window !== 'undefined') {
      logger.warn('Scraping should be run on server side. Use the API endpoint instead.');
      throw new Error('Scraping not available in browser. Use server-side API.');
    }
    
    const operationId = this.generateOperationId();
    const scraperNames = getAllScraperNames();
    
    this.currentOperation = {
      id: operationId,
      status: 'running',
      progress: 0,
      totalScrapers: scraperNames.length,
      completedScrapers: 0,
      startTime: new Date(),
    };

    this.notifyProgress();

    try {
      logger.info(`Starting integrated scraping operation ${operationId}`);
      
      const scraperResults: Record<string, { success: boolean; listings: number; errors: string[] }> = {};
      let totalNewListings = 0;
      let totalErrors = 0;

      for (let i = 0; i < scraperNames.length; i++) {
        const scraperName = scraperNames[i];
        const scraperInfo = getScraperInfo()[scraperName];
        
        this.currentOperation.currentScraper = scraperInfo.name;
        this.currentOperation.progress = (i / scraperNames.length) * 100;
        this.notifyProgress();

        logger.info(`Running scraper: ${scraperInfo.name}`);

        try {
          const result = await this.scraperManager.scrapeOne(scraperName, config);
          
          scraperResults[scraperName] = {
            success: result.success,
            listings: result.listings.length,
            errors: result.errors || []
          };

          if (result.success && result.listings.length > 0) {
            const saveResult = await this.dbService.saveListings(result.listings);
            totalNewListings += saveResult.saved;
            totalErrors += saveResult.errors;
            
            logger.info(`${scraperInfo.name}: ${saveResult.saved} saved, ${saveResult.errors} errors`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error running ${scraperInfo.name}:`, error);
          
          scraperResults[scraperName] = {
            success: false,
            listings: 0,
            errors: [errorMessage]
          };
          totalErrors++;
        }

        this.currentOperation.completedScrapers = i + 1;
      }

      this.currentOperation.status = 'completed';
      this.currentOperation.progress = 100;
      this.currentOperation.endTime = new Date();
      this.currentOperation.results = {
        totalListings: totalNewListings,
        newListings: totalNewListings,
        errors: totalErrors,
        scraperResults
      };

      logger.info(`Scraping operation ${operationId} completed: ${totalNewListings} listings, ${totalErrors} errors`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Scraping operation ${operationId} failed:`, error);
      
      this.currentOperation.status = 'failed';
      this.currentOperation.error = errorMessage;
      this.currentOperation.endTime = new Date();
    }

    this.notifyProgress();
    return this.currentOperation;
  }

  async runSingleScraper(scraperName: ScraperName, config?: ScrapingConfig): Promise<ScrapingOperation> {
    // In browser environment, this should call the API instead
    if (typeof window !== 'undefined') {
      logger.warn('Scraping should be run on server side. Use the API endpoint instead.');
      throw new Error('Scraping not available in browser. Use server-side API.');
    }
    
    const operationId = this.generateOperationId();
    const scraperInfo = getScraperInfo()[scraperName];
    
    this.currentOperation = {
      id: operationId,
      status: 'running',
      progress: 0,
      currentScraper: scraperInfo.name,
      totalScrapers: 1,
      completedScrapers: 0,
      startTime: new Date(),
    };

    this.notifyProgress();

    try {
      logger.info(`Starting single scraper operation: ${scraperInfo.name}`);
      
      this.currentOperation.progress = 50;
      this.notifyProgress();

      const result = await this.scraperManager.scrapeOne(scraperName, config);
      
      let newListings = 0;
      let errors = 0;

      if (result.success && result.listings.length > 0) {
        const saveResult = await this.dbService.saveListings(result.listings);
        newListings = saveResult.saved;
        errors = saveResult.errors;
      }

      this.currentOperation.status = 'completed';
      this.currentOperation.progress = 100;
      this.currentOperation.completedScrapers = 1;
      this.currentOperation.endTime = new Date();
      this.currentOperation.results = {
        totalListings: newListings,
        newListings,
        errors,
        scraperResults: {
          [scraperName]: {
            success: result.success,
            listings: result.listings.length,
            errors: result.errors || []
          }
        }
      };

      logger.info(`Single scraper operation completed: ${newListings} listings, ${errors} errors`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Single scraper operation failed:`, error);
      
      this.currentOperation.status = 'failed';
      this.currentOperation.error = errorMessage;
      this.currentOperation.endTime = new Date();
    }

    this.notifyProgress();
    return this.currentOperation;
  }

  getCurrentOperation(): ScrapingOperation | null {
    return this.currentOperation || null;
  }

  onProgress(callback: (operation: ScrapingOperation) => void): () => void {
    this.progressCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  async getListingStats() {
    return await this.dbService.getListingStats();
  }

  async getListingsBySource(source: string, limit?: number) {
    return await this.dbService.getListingsBySource(source, limit);
  }

  getAvailableScrapers() {
    return getScraperInfo();
  }

  private notifyProgress() {
    if (this.currentOperation) {
      this.progressCallbacks.forEach(callback => {
        try {
          callback(this.currentOperation!);
        } catch (error) {
          logger.error('Error in progress callback:', error);
        }
      });
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const integratedScrapingService = new IntegratedScrapingService();
export default integratedScrapingService;