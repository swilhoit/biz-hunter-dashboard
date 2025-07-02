import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPIEmpireFlippersScraper extends BaseScraper {
  readonly sourceName = 'EmpireFlippers';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Empire Flippers scraping session with ScraperAPI');
    
    try {
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`Empire Flippers scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Empire Flippers scraping failed:', error);
      
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
      render: 'true',
      premium: 'true'
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
        logger.info(`Scraping Empire Flippers page ${currentPage}: ${url}`);
        
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
    return `https://empireflippers.com/marketplace${page > 1 ? `/page/${page}` : ''}`;
  }

  private extractListingsFromHtml(html: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    // Empire Flippers uses .m-listing-wrapper based on troubleshooting
    const selectors = [
      '.m-listing-wrapper',
      '.listing-wrapper',
      '[class*="listing-wrapper"]',
      '.listing',
      '.ef-marketplace-listing',
      'div[class*="listing"]'
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
        const name = $el.find('.ef-listing-title, .listing-title, .title, h2, h3, h4').first().text().trim();
        
        // Extract price
        const priceText = $el.find('.ef-listing-price, .listing-price, .price, [data-label="Asking Price:"]').first().text().trim();
        const askingPrice = DataProcessor.extractPrice(priceText);
        
        // Extract revenue
        let revenueText = $el.find('.revenue, .monthly-revenue, [class*="revenue"]').first().text().trim();
        if (!revenueText) {
          const fullText = $el.text().toLowerCase();
          const revenueMatch = fullText.match(/revenue[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i);
          if (revenueMatch) {
            revenueText = revenueMatch[1];
          }
        }
        
        // Monthly revenue to annual
        const monthlyRevenue = DataProcessor.extractRevenue(revenueText);
        const annualRevenue = monthlyRevenue * 12;
        
        // Extract location
        const location = this.extractLocation($el.text()) || 'Unknown';
        
        // Extract industry
        const description = $el.find('.ef-listing-description, .listing-description, .description, .summary').text().trim();
        const industry = this.extractIndustry(name, description);
        
        // Extract link
        const linkEl = $el.find('a').first();
        let originalUrl = linkEl.attr('href') || '';
        if (originalUrl && !originalUrl.startsWith('http')) {
          originalUrl = `https://empireflippers.com${originalUrl}`;
        }
        
        // Extract image
        const imageEl = $el.find('img').first();
        let imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://empireflippers.com${imageUrl}`;
        }

        // Log debugging info for first few listings
        if (index < 3) {
          logger.info(`Listing ${index + 1}: ${JSON.stringify({
            name: name.substring(0, 50),
            priceText,
            monthlyRevenue,
            annualRevenue,
            location,
            industry
          })}`);
        }

        // Only include meaningful listings
        if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0)) {
          listings.push({
            name: DataProcessor.cleanText(name),
            description: description || `${industry} business opportunity from Empire Flippers`,
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
    const nextButton = $('.pagination .next, .pagination a[aria-label="Next"]');
    return nextButton.length > 0;
  }

  private extractLocation(text: string): string | null {
    if (!text) return null;
    
    const locationPatterns = [
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

  private extractIndustry(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    const industries = {
      'SaaS': /\b(saas|software|platform|app|application|subscription)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|shopify|store|retail|marketplace)\b/,
      'Content': /\b(blog|content|media|newsletter|publication)\b/,
      'Technology': /\b(tech|ai|automation|api|development)\b/,
      'Health': /\b(health|medical|wellness|fitness|supplement)\b/,
      'Education': /\b(education|learning|course|training|school)\b/,
      'Finance': /\b(finance|fintech|payment|trading|crypto)\b/,
      'Food & Beverage': /\b(food|restaurant|beverage|cafe|kitchen)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(text)) {
        return industry;
      }
    }
    
    return 'Online Business';
  }
}