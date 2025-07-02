import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPIBizBuySellScraper extends BaseScraper {
  readonly sourceName = 'BizBuySell';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting BizBuySell scraping session with ScraperAPI');
    
    try {
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`BizBuySell scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('BizBuySell scraping failed:', error);
      
      return {
        success: false,
        listings: [],
        errors: [errorMessage],
      };
    }
  }

  private async fetchWithScraperAPI(url: string): Promise<string> {
    const params = new URLSearchParams({
      api_key: this.scraperApiKey,
      url: url,
      render: 'true' // Enable JavaScript rendering
    });

    const apiUrl = `${this.scraperApiUrl}?${params.toString()}`;
    
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      logger.error(`Failed to fetch ${url} via ScraperAPI:`, error);
      throw error;
    }
  }

  private async scrapeListings(): Promise<RawListing[]> {
    const listings: RawListing[] = [];
    let currentPage = 1;
    const maxPages = this.config.maxPages || 3;

    while (currentPage <= maxPages) {
      try {
        logger.info(`Scraping BizBuySell page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        const html = await this.fetchWithScraperAPI(url);
        
        const pageListings = this.extractListingsFromHtml(html);
        listings.push(...pageListings);
        
        this.recordSuccess();
        logger.info(`Page ${currentPage}: ${pageListings.length} listings extracted`);
        
        // Check if there's a next page
        const hasNextPage = this.checkForNextPage(html);
        if (!hasNextPage) {
          logger.info('No more pages available');
          break;
        }
        
        currentPage++;
        await this.delay(this.config.delayBetweenRequests || 2000);
        
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
    const baseUrl = 'https://www.bizbuysell.com/businesses-for-sale/';
    const params = new URLSearchParams({
      page: page.toString(),
      sort: 'newest',
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  private extractListingsFromHtml(html: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    // Try multiple selectors
    const selectors = [
      '.result-list-item',
      '.listing-item',
      '.business-listing-item',
      '.search-result',
      '.listing-card',
      '[class*="listing"]'
    ];

    let elements = $();
    for (const selector of selectors) {
      elements = $(selector);
      if (elements.length > 0) {
        logger.info(`Found ${elements.length} elements with selector: ${selector}`);
        break;
      }
    }

    elements.each((index, element) => {
      try {
        const $el = $(element);
        
        // Extract name
        const name = $el.find('.listing-title, .business-name, h3 a, h2 a, .title').first().text().trim();
        
        // Extract price
        const priceText = $el.find('.price, .asking-price, [class*="price"]').first().text().trim();
        const askingPrice = DataProcessor.extractPrice(priceText);
        
        // Extract revenue
        let revenueText = $el.find('.revenue, .annual-revenue, [class*="revenue"]').first().text().trim();
        if (!revenueText) {
          // Try to extract from text content
          const fullText = $el.text().toLowerCase();
          const revenueMatch = fullText.match(/revenue[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i);
          if (revenueMatch) {
            revenueText = revenueMatch[1];
          }
        }
        const annualRevenue = DataProcessor.extractRevenue(revenueText);
        
        // Extract location
        const location = $el.find('.location, .business-location, [class*="location"]').first().text().trim();
        
        // Extract industry
        const industry = $el.find('.industry, .business-type, .category, [class*="industry"]').first().text().trim();
        
        // Extract description
        const description = $el.find('.description, .business-description, p').first().text().trim();
        
        // Extract link
        const linkEl = $el.find('a[href*="/business-for-sale/"], a[href*="/listing/"], a[href]').first();
        let originalUrl = linkEl.attr('href') || '';
        if (originalUrl && !originalUrl.startsWith('http')) {
          originalUrl = `https://www.bizbuysell.com${originalUrl}`;
        }
        
        // Extract image
        const imageEl = $el.find('img').first();
        let imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://www.bizbuysell.com${imageUrl}`;
        }

        // Log debugging info for first few listings
        if (index < 3) {
          logger.info(`Listing ${index + 1}: ${JSON.stringify({
            name: name.substring(0, 50),
            priceText,
            revenueText,
            location,
            industry
          })}`);
        }

        // Only include meaningful listings
        if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0 || description.length > 50)) {
          listings.push({
            name: DataProcessor.cleanText(name),
            description: description || `${industry} business opportunity from BizBuySell`,
            askingPrice,
            annualRevenue,
            location: location || '',
            industry: industry || 'Business',
            source: this.sourceName,
            originalUrl,
            imageUrl: DataProcessor.isValidUrl(imageUrl) ? imageUrl : undefined,
            highlights: DataProcessor.extractHighlights(description),
            scrapedAt: new Date(),
          });
        }
      } catch (error) {
        logger.warn('Error extracting listing:', error);
      }
    });

    return listings;
  }

  private checkForNextPage(html: string): boolean {
    const $ = cheerio.load(html);
    const nextButton = $('.pagination .next:not(.disabled), .pagination a[aria-label="Next"]');
    return nextButton.length > 0;
  }
}