import { BaseScraper, RawListing, ScrapingResult } from '../types';
import logger from '../utils/logger';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class EmpireFlippersScraper extends BaseScraper {
  readonly sourceName = 'EmpireFlippers';
  private scraperAPIKey: string = process.env.SCRAPER_API_KEY || '';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Empire Flippers scraping session');
    
    if (!this.scraperAPIKey) {
      const errorMessage = 'No ScraperAPI key found in environment variables';
      logger.error(errorMessage);
      return {
        success: false,
        listings: [],
        errors: [errorMessage],
        totalFound: 0,
        totalScraped: 0
      };
    }
    
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Empire Flippers scraping failed: ${errorMessage}`);
      
      this.recordFailure(errorMessage);
      this.finishMetrics();
      
      return {
        success: false,
        listings: [],
        errors: [errorMessage],
        totalFound: 0,
        totalScraped: 0
      };
    }
  }

  private async fetchWithScraperAPI(url: string): Promise<string> {
    logger.info(`Fetching with ScraperAPI: ${url}`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true`;
      const response = await axios.get(scraperUrl, { timeout: this.config.timeout || 60000 });
      
      if (response.status !== 200) {
        throw new Error(`ScraperAPI returned status code ${response.status}`);
      }
      
      logger.info(`Successfully fetched ${url} with ScraperAPI`);
      return response.data;
    } catch (error) {
      this.recordFailure(`ScraperAPI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private buildSearchUrl(page: number = 1): string {
    return `https://empireflippers.com/marketplace${page > 1 ? `/page/${page}` : ''}`;
  }

  private async scrapeListings(): Promise<RawListing[]> {
    const listings: RawListing[] = [];
    const maxPages = this.config.maxPages || 3;
    
    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = this.buildSearchUrl(page);
      
      try {
        logger.info(`Scraping Empire Flippers page ${page}: ${pageUrl}`);
        
        // Use ScraperAPI to fetch the page
        const html = await this.fetchWithScraperAPI(pageUrl);
        
        // Extract data from page
        const pageListings = this.extractListingsFromHTML(html, pageUrl);
        listings.push(...pageListings);
        
        this.recordSuccess();
        logger.info(`Found ${pageListings.length} listings on page ${page}`);
        
        // Check if there's a next page using cheerio
        const $ = cheerio.load(html);
        const hasNextPage = $('.pagination .next').length > 0;
        if (!hasNextPage || page >= maxPages) {
          break;
        }
        
        // Add delay between pages
        await this.delay(this.config.delayBetweenRequests || 3000);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.recordFailure(`Failed to scrape page ${page}: ${errorMessage}`);
        logger.error(`Error scraping page ${page}: ${errorMessage}`);
        break;
      }
    }
    
    return listings;
  }

  private extractListingsFromHTML(html: string, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];
    
    // Add debug logging
    logger.info(`Page content length: ${html.length} characters`);
    logger.info(`Page title: ${$('title').text().trim()}`);
    logger.info(`First heading: ${$('h1').first().text().trim()}`);
    
    // Log the available DOM structure to understand what selectors to use
    logger.info(`Found ${$('div').length} divs, ${$('a').length} links, ${$('article').length} articles on page`);

    // Try broader selectors to find any business listings
    $('.listing, .listing-container, .ef-marketplace-listing, .business-card, article, .card, div[class*="listing"]').each((index, element) => {
      try {
        const el = $(element);
        
        // Extract listing details based on Empire Flippers' current structure
        const titleEl = el.find('.ef-listing-title, .listing-title, .title');
        const name = titleEl.text().trim() || el.find('h2, h3, h4, .name, .business-name').first().text().trim();
        // Improved URL extraction with multiple strategies
        let detailUrl = '';
        
        // Strategy 1: Find link in the title
        detailUrl = titleEl.find('a').attr('href') || '';
        
        // Strategy 2: Find first link with href containing 'listing' or 'business'
        if (!detailUrl) {
          const listingLinks = el.find('a[href*="listing"], a[href*="business"]');
          if (listingLinks.length > 0) {
            detailUrl = $(listingLinks[0]).attr('href') || '';
          }
        }
        
        // Strategy 3: Find any link in the element
        if (!detailUrl) {
          detailUrl = el.find('a').attr('href') || '';
        }
        
        // Strategy 4: Find any link in the parent
        if (!detailUrl) {
          detailUrl = el.parent().find('a').attr('href') || '';
        }
        
        const priceText = el.find('.ef-listing-price, .listing-price, .price, [data-label="Asking Price:"]').text().trim();
        const askingPrice = this.extractPrice(priceText);
        
        const description = el.find('.ef-listing-description, .listing-description, .description, .summary, .excerpt, .content').text().trim();
        
        // Additional metrics
        const metrics = this.extractMetrics(el);
        const annualRevenue = (metrics.monthlyRevenue || 0) * 12;
        
        // Create the listing object
        const listing: RawListing = {
          name,
          askingPrice,
          description,
          originalUrl: this.normalizeUrl(detailUrl, sourceUrl),
          source: this.sourceName,
          location: this.extractLocation(description) || 'Unknown',
          industry: this.extractIndustry(name, description),
          annualRevenue,
          highlights: this.extractHighlights(description),
          scrapedAt: new Date(),
        };
        
        listings.push(listing);
      } catch (error) {
        logger.error(`Error extracting listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return listings;
  }

  private extractPrice(priceText: string): number {
    if (!priceText) return 0;
    
    // Remove currency symbols and formatting
    const numericString = priceText.replace(/[^0-9.]/g, '');
    const price = parseFloat(numericString);
    
    return isNaN(price) ? 0 : price;
  }

  private extractMetrics(element: any): {
    monthlyRevenue?: number;
    monthlyProfit?: number;
    multiple?: number;
    additionalMetrics?: Record<string, any>;
  } {
    const $ = cheerio.load(element.html() || '');
    const result: ReturnType<typeof this.extractMetrics> = {
      additionalMetrics: {},
    };
    
    try {
      // Extract revenue
      const revenueText = $('.revenue, .monthly-revenue').text().trim();
      if (revenueText) {
        const revenue = parseFloat(revenueText.replace(/[^0-9.]/g, ''));
        if (!isNaN(revenue)) {
          result.monthlyRevenue = revenue;
        }
      }
      
      // Extract profit
      const profitText = $('.profit, .monthly-profit').text().trim();
      if (profitText) {
        const profit = parseFloat(profitText.replace(/[^0-9.]/g, ''));
        if (!isNaN(profit)) {
          result.monthlyProfit = profit;
        }
      }
      
      // Extract multiple
      const multipleText = $('.multiple, .listing-multiple').text().trim();
      if (multipleText) {
        const multiple = parseFloat(multipleText.replace(/[^0-9.]/g, ''));
        if (!isNaN(multiple)) {
          result.multiple = multiple;
        }
      }
      
      // Additional metrics
      $('.metrics li, .listing-metrics div').each((i, el) => {
        const metricText = $(el).text().trim();
        if (metricText.includes(':')) {
          const [key, value] = metricText.split(':').map(part => part.trim());
          if (key && value) {
            result.additionalMetrics![key] = value;
          }
        }
      });
      
    } catch (error) {
      logger.error(`Error extracting metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return result;
  }

  private extractHighlights(description: string): string[] {
    if (!description) return [];
    
    const highlights: string[] = [];
    
    // Extract bullet points if they exist
    const bulletPointRegex = /[•\-\*]\s*([^•\-\*\n]+)/g;
    let match;
    
    while ((match = bulletPointRegex.exec(description)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        highlights.push(match[1].trim());
      }
    }
    
    // If no bullet points, extract sentences (max 3)
    if (highlights.length === 0) {
      const sentences = description
        .split(/[.!?]\s+/)
        .filter(s => s.trim().length > 10)
        .slice(0, 3);
      
      highlights.push(...sentences);
    }
    
    return highlights;
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

  private normalizeUrl(url: string, baseUrl: string): string {
    // If no URL is provided, use the base URL as a fallback
    if (!url) {
      logger.warn('Missing detail URL, using page URL as fallback');
      return baseUrl;
    }
    
    if (url.startsWith('http')) return url;
    
    const base = 'https://empireflippers.com';
    return url.startsWith('/') 
      ? `${base}${url}`
      : `${base}/${url}`;
  }

  // Use BaseScraper's protected delay method instead
  // Protected method already defined in BaseScraper
}
