import { chromium, Browser, Page } from 'playwright';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class BizQuestScraper extends BaseScraper {
  readonly sourceName = 'BizQuest';
  private browser?: Browser;
  private page?: Page;

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting BizQuest scraping session');
    
    try {
      await this.initBrowser();
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`BizQuest scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('BizQuest scraping failed:', error);
      
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
        logger.info(`Scraping BizQuest page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 
        });
        
        // Wait for content - be more flexible
        try {
          await this.page.waitForSelector('body, main, .content, article', { timeout: 10000 });
          await this.page.waitForTimeout(2000);
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
        await this.delay(this.config.delayBetweenRequests || 2500);
        
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
    // BizQuest URL structure
    if (page === 1) {
      return 'https://www.bizquest.com/businesses-for-sale/';
    }
    return `https://www.bizquest.com/businesses-for-sale/?page=${page}`;
  }

  private async extractListingsFromPage(): Promise<RawListing[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const listings: RawListing[] = [];
      
      const listingElements = document.querySelectorAll('.listing-item, .business-card, .search-result, .business-listing, .result, [class*="listing"], [class*="business"], article');
      
      listingElements.forEach((element) => {
        try {
          const nameEl = element.querySelector('.business-name, .listing-title, h3, h2');
          const priceEl = element.querySelector('.price, .asking-price, .sale-price');
          const revenueEl = element.querySelector('.revenue, .gross-revenue, .annual-revenue');
          const locationEl = element.querySelector('.location, .city-state, .geography');
          const industryEl = element.querySelector('.industry, .category, .business-type');
          const descriptionEl = element.querySelector('.description, .summary, .details');
          const linkEl = element.querySelector('a[href*="/business-for-sale/"]');
          const imageEl = element.querySelector('img');

          if (!nameEl) return;

          const name = nameEl.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          const revenueText = revenueEl?.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || '';
          const industry = industryEl?.textContent?.trim() || 'Business';
          const description = descriptionEl?.textContent?.trim() || '';
          const originalUrl = linkEl?.getAttribute('href') || '';
          const imageUrl = imageEl?.getAttribute('src') || '';

          if (name && priceText) {
            listings.push({
              name,
              description,
              priceText,
              revenueText,
              location,
              industry,
              originalUrl: originalUrl.startsWith('http') ? originalUrl : `https://www.bizquest.com${originalUrl}`,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `https://www.bizquest.com${imageUrl}` : undefined),
            });
          }
        } catch (error) {
          console.warn('Error extracting BizQuest listing:', error);
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
        logger.warn('Failed to process BizQuest listing:', error);
      }
    }

    return processedListings;
  }
}