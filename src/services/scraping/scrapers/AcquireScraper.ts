import { chromium, Browser, Page } from 'playwright';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class AcquireScraper extends BaseScraper {
  readonly sourceName = 'Acquire';
  private browser?: Browser;
  private page?: Page;

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Acquire scraping session');
    
    try {
      await this.initBrowser();
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`Acquire scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Acquire scraping failed:', error);
      
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
    
    await this.page.setDefaultTimeout(this.config.timeout || 30000);
  }

  private async scrapeListings(): Promise<RawListing[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const listings: RawListing[] = [];
    let currentPage = 1;
    const maxPages = this.config.maxPages || 3;

    while (currentPage <= maxPages) {
      try {
        logger.info(`Scraping Acquire page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 
        });
        
        // Wait for content to load - be more flexible
        try {
          await this.page.waitForSelector('body, main, .content, [class*="card"]', { timeout: 10000 });
          await this.page.waitForTimeout(2000); // Let dynamic content load
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
    // Try multiple Acquire.com URL structures
    if (page === 1) {
      return 'https://acquire.com/search?type=startup&status=for-sale';
    }
    return `https://acquire.com/search?type=startup&status=for-sale&page=${page}`;
  }

  private async extractListingsFromPage(): Promise<RawListing[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const listings: RawListing[] = [];
      
      const listingElements = document.querySelectorAll('.startup, .business-listing, .acquisition-card, .listing, .company-card, [class*="card"], [class*="startup"], [class*="company"]');
      
      listingElements.forEach((element) => {
        try {
          const nameEl = element.querySelector('h2, h3, .company-name, .startup-name, .title');
          const priceEl = element.querySelector('.price, .valuation, .asking-price, .sale-price');
          const revenueEl = element.querySelector('.revenue, .mrr, .arr, .monthly-revenue, .annual-revenue');
          const locationEl = element.querySelector('.location, .geography, .region');
          const industryEl = element.querySelector('.industry, .category, .vertical, .sector, .tag');
          const descriptionEl = element.querySelector('.description, .summary, .about, .pitch');
          const linkEl = element.querySelector('a[href*="/startup/"], a[href*="/company/"], a[href*="/business/"]');
          const imageEl = element.querySelector('img');
          const metricsEl = element.querySelector('.metrics, .stats, .kpis');
          const usersEl = element.querySelector('.users, .customers, .subscribers');

          if (!nameEl) return;

          const name = nameEl.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          const revenueText = revenueEl?.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || 'Remote';
          const industry = industryEl?.textContent?.trim() || 'SaaS';
          const description = descriptionEl?.textContent?.trim() || '';
          const originalUrl = linkEl?.getAttribute('href') || '';
          const imageUrl = imageEl?.getAttribute('src') || '';
          const metrics = metricsEl?.textContent?.trim() || '';
          const users = usersEl?.textContent?.trim() || '';

          // Log debugging info
          if (listings.length < 3) {
            console.log(`Acquire listing ${listings.length + 1}:`, {
              name: name.substring(0, 50),
              priceText: priceText.substring(0, 30),
              revenueText: revenueText.substring(0, 30),
              location: location.substring(0, 30),
              industry: industry.substring(0, 30)
            });
          }

          if (name && name.length > 3 && (priceText || revenueText || description.length > 50)) {
            const askingPrice = this.parsePrice(priceText);
            const annualRevenue = this.parseRevenue(revenueText);
            
            listings.push({
              name,
              description: `${description} ${metrics ? `Metrics: ${metrics}` : ''} ${users ? `Users: ${users}` : ''}`.trim() || `${industry} startup from Acquire`,
              askingPrice,
              annualRevenue,
              location: location || 'Remote',
              industry: industry || 'SaaS',
              source: 'Acquire',
              originalUrl: originalUrl.startsWith('http') ? originalUrl : `https://acquire.com${originalUrl}`,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `https://acquire.com${imageUrl}` : undefined),
              scrapedAt: new Date(),
            });
          }
        } catch (error) {
          console.warn('Error extracting Acquire listing:', error);
        }
      });

      return listings;
    });
  }

  private async hasNextPage(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const nextButton = await this.page.$('.pagination .next:not(.disabled), .load-more:not(.disabled), [aria-label="Next page"]');
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
          askingPrice: DataProcessor.extractPrice(raw.priceText),
          annualRevenue: DataProcessor.extractRevenue(raw.revenueText),
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
        logger.warn('Failed to process Acquire listing:', error);
      }
    }

    return processedListings;
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    return DataProcessor.extractPrice(priceText);
  }

  private parseRevenue(revenueText: string): number {
    if (!revenueText) return 0;
    return DataProcessor.extractRevenue(revenueText);
  }
}