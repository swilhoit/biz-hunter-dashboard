// Frontend API interface for integrated scraping
// This runs scrapers on the server side and saves to database

interface ScrapingResponse {
  success: boolean;
  message: string;
  operationId?: string;
  results?: {
    totalListings: number;
    newListings: number;
    errors: number;
    scraperResults: Record<string, { success: boolean; listings: number; errors: string[] }>;
  };
}

interface ScrapingProgress {
  operationId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentScraper?: string;
  message?: string;
}

class IntegratedScrapingAPI {
  private baseUrl = 'http://localhost:3001';

  async runAllScrapers(): Promise<ScrapingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraping/run-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            maxPages: 2,
            delayBetweenRequests: 3000,
            headless: true,
            timeout: 30000,
          }
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to run scrapers:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async runSingleScraper(scraperName: string): Promise<ScrapingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraping/run-single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraperName,
          config: {
            maxPages: 2,
            delayBetweenRequests: 3000,
            headless: true,
            timeout: 30000,
          }
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to run scraper:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getScrapingStatus(operationId: string): Promise<ScrapingProgress | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraping/status/${operationId}`);
      
      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get scraping status:', error);
      return null;
    }
  }

  async getListingStats(): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraping/stats`);
      const result = await response.json();
      return result.stats || {};
    } catch (error) {
      console.error('Failed to get listing stats:', error);
      return {};
    }
  }
}

export const integratedScrapingAPI = new IntegratedScrapingAPI();
export default integratedScrapingAPI;