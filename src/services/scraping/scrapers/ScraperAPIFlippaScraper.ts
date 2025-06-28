import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPIFlippaScraper extends BaseScraper {
  readonly sourceName = 'Flippa';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Flippa scraping session with ScraperAPI');
    
    try {
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
    }
  }

  private async fetchWithScraperAPI(url: string): Promise<string> {
    const params = new URLSearchParams({
      api_key: this.scraperApiKey,
      url: url,
      render: 'true',
      premium: 'true'  // Flippa likely has more protection
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

    // Fixed URL based on troubleshooting - use search endpoint
    const urls = [
      'https://flippa.com/search?filter_category=website',
      'https://flippa.com/search?filter_category=app',
      'https://flippa.com/search?filter_category=ecommerce'
    ];

    for (const url of urls.slice(0, 2)) { // Limit to 2 URLs for now
      try {
        logger.info(`Scraping Flippa URL: ${url}`);
        
        const html = await this.fetchWithScraperAPI(url);
        const pageListings = this.extractListingsFromHtml(html);
        listings.push(...pageListings);
        
        this.recordSuccess();
        logger.info(`URL ${url}: ${pageListings.length} listings extracted`);
        
        await this.delay(this.config.delayBetweenRequests || 3000);
        
      } catch (error) {
        const errorMessage = `URL ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.recordFailure(errorMessage);
        logger.error(errorMessage);
      }
    }

    return listings;
  }

  private extractListingsFromHtml(html: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    // Try multiple selectors for Flippa
    const selectors = [
      '.listing-card',
      '.auction-card',
      '.business-card',
      '[class*="card"]',
      '[class*="listing"]',
      '[class*="auction"]'
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
        const name = $el.find('h2, h3, h4, .title, .listing-title, .auction-title').first().text().trim();
        
        // Extract price/bid info
        const priceText = $el.find('.price, .current-bid, .asking-price, .bid-amount, [class*="price"]').first().text().trim();
        const askingPrice = DataProcessor.extractPrice(priceText);
        
        // Extract revenue information
        let revenueText = $el.find('.revenue, .monthly-revenue, .profit, [class*="revenue"]').first().text().trim();
        
        // Flippa often shows monthly revenue, convert to annual
        const monthlyRevenueMatch = $el.text().match(/\$?([\d,]+)\/month|\$?([\d,]+)\s*monthly/i);
        let annualRevenue = 0;
        if (monthlyRevenueMatch) {
          const monthlyAmount = DataProcessor.extractRevenue(monthlyRevenueMatch[1] || monthlyRevenueMatch[2]);
          annualRevenue = monthlyAmount * 12;
        } else {
          annualRevenue = DataProcessor.extractRevenue(revenueText);
        }
        
        // Extract description
        const description = $el.find('.description, .summary, .excerpt, p').first().text().trim();
        
        // Extract industry/category from URL or content
        const industry = this.extractIndustry($el.text());
        
        // Extract metrics
        const metrics = this.extractMetrics($el);
        
        // Extract link
        const linkEl = $el.find('a').first();
        let originalUrl = linkEl.attr('href') || '';
        if (originalUrl && !originalUrl.startsWith('http')) {
          originalUrl = `https://flippa.com${originalUrl}`;
        }
        
        // Extract image
        const imageEl = $el.find('img').first();
        let imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http') && imageUrl.startsWith('/')) {
          imageUrl = `https://flippa.com${imageUrl}`;
        }

        // Log debugging info for first few listings
        if (index < 3) {
          logger.info(`Listing ${index + 1}: ${JSON.stringify({
            name: name.substring(0, 50),
            priceText,
            askingPrice,
            annualRevenue,
            industry,
            metrics
          })}`);
        }

        // Only include meaningful listings
        if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0)) {
          listings.push({
            name: DataProcessor.cleanText(name),
            description: description || `${industry} business opportunity from Flippa`,
            askingPrice,
            annualRevenue,
            location: 'Global', // Flippa is international
            industry,
            source: this.sourceName,
            originalUrl,
            imageUrl: DataProcessor.isValidUrl(imageUrl) ? imageUrl : undefined,
            highlights: this.createHighlights(metrics, description),
            scrapedAt: new Date(),
          });
        }
      } catch (error) {
        logger.warn('Error extracting listing:', error);
      }
    });

    return listings;
  }

  private extractIndustry(text: string): string {
    const lowerText = text.toLowerCase();
    
    const industries = {
      'Amazon FBA': /\b(amazon|fba|fulfillment)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|shopify|store|retail|dropship)\b/,
      'SaaS': /\b(saas|software|platform|subscription|app)\b/,
      'Content': /\b(blog|content|media|newsletter|publication|youtube|instagram)\b/,
      'Affiliate': /\b(affiliate|commission|referral)\b/,
      'Technology': /\b(tech|ai|automation|api|development|mobile)\b/,
      'Cryptocurrency': /\b(crypto|bitcoin|blockchain|nft|defi)\b/,
      'Gaming': /\b(gaming|game|esports|twitch)\b/,
      'Domain': /\b(domain|website|url)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(lowerText)) {
        return industry;
      }
    }
    
    return 'Online Business';
  }

  private extractMetrics(element: any): any {
    const $ = cheerio.load(element.html() || '');
    const metrics: any = {};
    
    // Look for common Flippa metrics
    const text = $.text().toLowerCase();
    
    // Page views
    const pageViewsMatch = text.match(/([\d,]+)\s*page\s*views?/i);
    if (pageViewsMatch) {
      metrics.pageViews = parseInt(pageViewsMatch[1].replace(/,/g, ''));
    }
    
    // Profit margin
    const profitMatch = text.match(/profit[:\s]*\$?([\d,]+)/i);
    if (profitMatch) {
      metrics.profit = parseInt(profitMatch[1].replace(/,/g, ''));
    }
    
    // Age
    const ageMatch = text.match(/([\d.]+)\s*years?\s*old/i);
    if (ageMatch) {
      metrics.age = parseFloat(ageMatch[1]);
    }
    
    return metrics;
  }

  private createHighlights(metrics: any, description: string): string[] {
    const highlights: string[] = [];
    
    if (metrics.pageViews) {
      highlights.push(`${metrics.pageViews.toLocaleString()} page views`);
    }
    
    if (metrics.profit) {
      highlights.push(`$${metrics.profit.toLocaleString()} profit`);
    }
    
    if (metrics.age) {
      highlights.push(`${metrics.age} years established`);
    }
    
    // Add description highlights if we don't have enough metrics
    if (highlights.length < 2 && description) {
      const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 20).slice(0, 2);
      highlights.push(...sentences.map(s => s.trim()));
    }
    
    return highlights;
  }
}