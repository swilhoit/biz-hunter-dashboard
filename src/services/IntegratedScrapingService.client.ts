import { ScrapingConfig } from './scraping/types';
import { ScraperName, getScraperInfo } from './scraping/scrapers';

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
  private currentOperation: ScrapingOperation | null = null;
  private progressCallbacks: ((operation: ScrapingOperation) => void)[] = [];

  async runFullScraping(config?: ScrapingConfig): Promise<ScrapingOperation> {
    // This should call the server API instead of running scrapers directly
    const operation: ScrapingOperation = {
      id: Date.now().toString(),
      status: 'running',
      progress: 0,
      totalScrapers: Object.keys(getScraperInfo()).length,
      completedScrapers: 0,
      startTime: new Date(),
    };

    this.currentOperation = operation;
    this.notifyProgress(operation);

    // TODO: Replace with actual API call to server
    console.warn('IntegratedScrapingService: runFullScraping should call server API');
    
    return operation;
  }

  async runSingleScraper(scraperName: ScraperName, config?: ScrapingConfig): Promise<ScrapingOperation> {
    const operation: ScrapingOperation = {
      id: Date.now().toString(),
      status: 'running',
      progress: 0,
      currentScraper: scraperName,
      totalScrapers: 1,
      completedScrapers: 0,
      startTime: new Date(),
    };

    this.currentOperation = operation;
    this.notifyProgress(operation);

    // TODO: Replace with actual API call to server
    console.warn('IntegratedScrapingService: runSingleScraper should call server API');
    
    return operation;
  }

  getAvailableScrapers() {
    return getScraperInfo();
  }

  getCurrentOperation(): ScrapingOperation | null {
    return this.currentOperation;
  }

  onProgress(callback: (operation: ScrapingOperation) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  private notifyProgress(operation: ScrapingOperation): void {
    this.progressCallbacks.forEach(callback => callback(operation));
  }
}

export const integratedScrapingService = new IntegratedScrapingService();