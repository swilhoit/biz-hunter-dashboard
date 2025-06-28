import { chromium, Browser, Page } from 'playwright';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class FlipaScraper extends BaseScraper {
  readonly sourceName = 'Flippa';
  private browser?: Browser;
  private page?: Page;

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Flippa scraping session');
    
    try {
      await this.initBrowser();
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`Flippa scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Flippa scraping failed:', error);
      
      return {
        success: false,
        listings: [],
        errors: [errorMessage],
      };
    } finally {
      await this.cleanup();
    }
  }

  private async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage({
      userAgent: this.config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    
    this.page.setDefaultTimeout(this.config.timeout || 30000);
  }

  private async scrapeListings(): Promise<RawListing[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const listings: RawListing[] = [];
    let currentPage = 1;
    const maxPages = this.config.maxPages || 3;

    while (currentPage <= maxPages) {
      try {
        logger.info(`Scraping Flippa page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 
        });
        
        // Wait for content to load - flexible selectors
        try {
          await this.page.waitForSelector('body, main, .content, [class*="card"], [class*="listing"]', { timeout: 10000 });
          await this.page.waitForTimeout(3000); // Let dynamic content load
        } catch (error) {
          logger.warn(`Page ${currentPage}: No content selectors found, continuing...`);
        }
        
        const rawPageListings = await this.extractListingsFromPage();
        const processedPageListings = this.processListings(rawPageListings);
        listings.push(...processedPageListings);
        
        this.recordSuccess();
        logger.info(`Page ${currentPage}: ${processedPageListings.length} listings extracted`);
        
        const hasNextPage = await this.hasNextPage();
        if (!hasNextPage) {
          logger.info('No more pages available');
          break;
        }
        
        currentPage++;
        await this.delay(this.config.delayBetweenRequests || 3000);
        
      } catch (error) {
        const errorMessage = `Page ${currentPage}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.recordFailure(errorMessage);
        logger.error(errorMessage);
        break;
      }
    }

    return listings;
  }

  private buildSearchUrl(page: number): string {
    // Flippa URL structure for businesses
    return `https://flippa.com/search?type=business&page=${page}`;
  }

  private async extractListingsFromPage(): Promise<RawListing[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const listings: RawListing[] = [];
      
      const listingElements = document.querySelectorAll('.listing-card, .auction-card, .business-card, .asset-card');
      
      listingElements.forEach((element) => {
        try {
          const nameEl = element.querySelector('h3, h2, .asset-title, .listing-title');
          const priceEl = element.querySelector('.price, .current-bid, .buy-now-price');
          const revenueEl = element.querySelector('.revenue, .monthly-revenue, .net-profit');
          const locationEl = element.querySelector('.location, .country');
          const industryEl = element.querySelector('.category, .industry, .type');
          const descriptionEl = element.querySelector('.description, .summary, .asset-description');
          const linkEl = element.querySelector('a[href*="/listing/"], a[href*="/auction/"]');
          const imageEl = element.querySelector('img');
          const metricsEl = element.querySelector('.metrics, .stats, .performance');
          const trafficEl = element.querySelector('.traffic, .visitors, .pageviews');

          if (!nameEl) return;

          const name = nameEl.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          const revenueText = revenueEl?.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || '';
          const industry = industryEl?.textContent?.trim() || 'Website';
          const description = descriptionEl?.textContent?.trim() || '';
          const originalUrl = linkEl?.getAttribute('href') || '';
          const imageUrl = imageEl?.getAttribute('src') || '';
          const metrics = metricsEl?.textContent?.trim() || '';
          const traffic = trafficEl?.textContent?.trim() || '';

          if (name && priceText) {
            const askingPrice = this.parsePrice(priceText);
            const annualRevenue = this.parsePrice(revenueText || '0');
            
            listings.push({
              name,
              description: `${description} ${metrics ? `Metrics: ${metrics}` : ''} ${traffic ? `Traffic: ${traffic}` : ''}`.trim(),
              askingPrice,
              annualRevenue,
              location: location || '',
              industry: industry || '',
              source: 'Flippa',
              originalUrl: originalUrl.startsWith('http') ? originalUrl : `https://flippa.com${originalUrl}`,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `https://flippa.com${imageUrl}` : undefined),
            });
          }
        } catch (error) {
          console.warn('Error extracting Flippa listing:', error);
        }
      });

      return listings;
    });
  }

  private async hasNextPage(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const nextButton = await this.page.$('.pagination .next:not(.disabled), .page-next:not(.disabled)');
      return nextButton !== null;
    } catch {
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  private processListings(rawListings: RawListing[]): RawListing[] {
    const processedListings: RawListing[] = [];

    for (const raw of rawListings) {
      try {
        const processed: RawListing = {
          name: DataProcessor.cleanText(raw.name),
          description: raw.description ? DataProcessor.cleanText(raw.description) : undefined,
          askingPrice: raw.askingPrice,
          annualRevenue: raw.annualRevenue,
          industry: DataProcessor.normalizeIndustry(raw.industry),
          location: DataProcessor.cleanText(raw.location),
          source: this.sourceName,
          highlights: DataProcessor.extractHighlights(raw.description || ''),
          imageUrl: DataProcessor.isValidUrl(raw.imageUrl || '') ? raw.imageUrl : undefined,
          originalUrl: DataProcessor.isValidUrl(raw.originalUrl || '') ? raw.originalUrl : undefined,
          scrapedAt: new Date(),
        };

        const validatedListing = DataProcessor.validateListing(processed);
        if (validatedListing) {
          processedListings.push(validatedListing);
          this.metrics.listingsFound++;
        }
      } catch (error) {
        logger.warn('Failed to process Flippa listing:', error);
      }
    }

    return processedListings;
  }

  private parsePrice(priceText: string): number {
    const cleanPrice = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleanPrice) || 0;
  }
}