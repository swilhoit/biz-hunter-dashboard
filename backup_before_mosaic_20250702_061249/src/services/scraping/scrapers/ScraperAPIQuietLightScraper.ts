import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPIQuietLightScraper extends BaseScraper {
  readonly sourceName = 'QuietLight';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting QuietLight scraping session with ScraperAPI');
    
    try {
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`QuietLight scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('QuietLight scraping failed:', error);
      
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
      render: 'true'
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
        const url = this.buildSearchUrl(currentPage);
        logger.info(`Scraping QuietLight page ${currentPage}: ${url}`);
        
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
    // Fixed URL based on troubleshooting - use /listings/ not /businesses-for-sale/
    const baseUrl = 'https://quietlight.com/listings/';
    if (page === 1) {
      return baseUrl;
    }
    return `${baseUrl}page/${page}/`;
  }

  private extractListingsFromHtml(html: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    // Try multiple selectors for Quiet Light
    const selectors = [
      '.business-listing',
      '.listing-card',
      '.opportunity',
      '.business-opportunity',
      '[class*="listing"]',
      '[class*="business"]',
      '[class*="opportunity"]'
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
        
        // Extract name/title
        const name = $el.find('h2, h3, h4, .title, .business-name, .listing-title').first().text().trim();
        
        // Extract price
        const priceText = $el.find('.price, .asking-price, .sale-price, [class*="price"]').first().text().trim();
        const askingPrice = DataProcessor.extractPrice(priceText);
        
        // Extract revenue
        const revenueText = $el.find('.revenue, .annual-revenue, .gross-revenue, [class*="revenue"]').first().text().trim();
        const annualRevenue = DataProcessor.extractRevenue(revenueText);
        
        // Extract description
        const description = $el.find('.description, .summary, .excerpt, p').first().text().trim();
        
        // Extract industry/type
        const industry = this.extractIndustry($el.text());
        
        // Extract location
        const location = this.extractLocation($el.text()) || 'Not specified';
        
        // Extract link
        const linkEl = $el.find('a').first();
        let originalUrl = linkEl.attr('href') || '';
        if (originalUrl && !originalUrl.startsWith('http')) {
          originalUrl = `https://quietlight.com${originalUrl}`;
        }
        
        // Extract image
        const imageEl = $el.find('img').first();
        let imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://quietlight.com${imageUrl}`;
        }

        // Log debugging info for first few listings
        if (index < 3) {
          logger.info(`Listing ${index + 1}: ${JSON.stringify({
            name: name.substring(0, 50),
            priceText,
            revenueText,
            askingPrice,
            annualRevenue,
            location,
            industry
          })}`);
        }

        // Only include meaningful listings
        if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0 || description.length > 50)) {
          listings.push({
            name: DataProcessor.cleanText(name),
            description: description || `${industry} business opportunity from Quiet Light`,
            askingPrice,
            annualRevenue,
            location,
            industry,
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
    const nextButton = $('.pagination .next:not(.disabled), .pagination a[rel="next"], .next-page');
    return nextButton.length > 0;
  }

  private extractIndustry(text: string): string {
    const lowerText = text.toLowerCase();
    
    const industries = {
      'SaaS': /\b(saas|software|platform|subscription|app)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|shopify|store|retail|amazon|fba)\b/,
      'Content': /\b(blog|content|media|newsletter|publication|website)\b/,
      'Technology': /\b(tech|ai|automation|api|development|digital)\b/,
      'Health': /\b(health|medical|wellness|fitness|supplement)\b/,
      'Education': /\b(education|learning|course|training|school)\b/,
      'Finance': /\b(finance|fintech|payment|trading|crypto|investment)\b/,
      'Manufacturing': /\b(manufacturing|factory|production|industrial)\b/,
      'Service': /\b(service|consulting|agency|professional)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(lowerText)) {
        return industry;
      }
    }
    
    return 'Business';
  }

  private extractLocation(text: string): string | null {
    const locationPatterns = [
      /location[:\s]*([^,.\n]+)/i,
      /located in ([^,.\n]+)/i,
      /based in ([^,.\n]+)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
      /(United States|USA|US|Remote|Global)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
}