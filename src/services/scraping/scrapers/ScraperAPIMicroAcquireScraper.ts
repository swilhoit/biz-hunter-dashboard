import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPIMicroAcquireScraper extends BaseScraper {
  readonly sourceName = 'MicroAcquire';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting MicroAcquire scraping session with ScraperAPI');
    
    try {
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`MicroAcquire scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('MicroAcquire scraping failed:', error);
      
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
    
    try {
      const url = 'https://microacquire.com/startups';
      logger.info(`Scraping MicroAcquire startups: ${url}`);
      
      const html = await this.fetchWithScraperAPI(url);
      const pageListings = this.extractListingsFromHtml(html);
      listings.push(...pageListings);
      
      this.recordSuccess();
      logger.info(`MicroAcquire: ${pageListings.length} listings extracted`);
      
    } catch (error) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.recordFailure(errorMessage);
      logger.error(errorMessage);
    }

    return listings;
  }

  private extractListingsFromHtml(html: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    // Try multiple selectors for MicroAcquire
    const selectors = [
      '.startup-card',
      '.company-card',
      '.listing-card',
      '[class*="startup"]',
      '[class*="company"]',
      '[class*="card"]',
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
        
        // Extract name/title
        const name = $el.find('h2, h3, h4, .title, .company-name, .startup-name').first().text().trim();
        
        // Extract valuation/price
        const priceText = $el.find('.price, .valuation, .asking-price, [class*="price"], [class*="valuation"]').first().text().trim();
        const askingPrice = DataProcessor.extractPrice(priceText);
        
        // Extract revenue
        const revenueText = $el.find('.revenue, .arr, .mrr, [class*="revenue"]').first().text().trim();
        let annualRevenue = DataProcessor.extractRevenue(revenueText);
        
        // Check for MRR (Monthly Recurring Revenue) and convert to ARR
        const mrrMatch = $el.text().match(/mrr[:\s]*\$?([\d,]+)/i);
        if (mrrMatch && annualRevenue === 0) {
          const mrr = DataProcessor.extractRevenue(mrrMatch[1]);
          annualRevenue = mrr * 12; // Convert MRR to ARR
        }
        
        // Extract description
        const description = $el.find('.description, .summary, .about, p').first().text().trim();
        
        // Extract industry/category
        const industry = this.extractIndustry($el.text());
        
        // Extract metrics
        const metrics = this.extractMetrics($el);
        
        // Extract link
        const linkEl = $el.find('a').first();
        let originalUrl = linkEl.attr('href') || '';
        if (originalUrl && !originalUrl.startsWith('http')) {
          originalUrl = `https://microacquire.com${originalUrl}`;
        }
        
        // Extract image
        const imageEl = $el.find('img').first();
        let imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http') && imageUrl.startsWith('/')) {
          imageUrl = `https://microacquire.com${imageUrl}`;
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
        if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0 || description.length > 20)) {
          listings.push({
            name: DataProcessor.cleanText(name),
            description: description || `${industry} startup from MicroAcquire`,
            askingPrice,
            annualRevenue,
            location: 'Global', // MicroAcquire is international
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
      'SaaS': /\b(saas|software|platform|subscription|app|api)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|marketplace|retail|store)\b/,
      'Fintech': /\b(fintech|finance|payment|banking|crypto|blockchain)\b/,
      'Healthcare': /\b(health|medical|telemedicine|wellness|fitness)\b/,
      'EdTech': /\b(education|edtech|learning|training|course)\b/,
      'AI/ML': /\b(ai|artificial intelligence|machine learning|ml|automation)\b/,
      'Mobile App': /\b(mobile|ios|android|app store)\b/,
      'B2B Tools': /\b(b2b|enterprise|productivity|tools|crm)\b/,
      'Media': /\b(media|content|newsletter|publication|streaming)\b/,
      'Gaming': /\b(gaming|game|esports)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(lowerText)) {
        return industry;
      }
    }
    
    return 'Technology';
  }

  private extractMetrics(element: any): any {
    const $ = cheerio.load(element.html() || '');
    const metrics: any = {};
    
    const text = $.text().toLowerCase();
    
    // Employees
    const employeesMatch = text.match(/([\d,]+)\s*employees?/i);
    if (employeesMatch) {
      metrics.employees = parseInt(employeesMatch[1].replace(/,/g, ''));
    }
    
    // Users
    const usersMatch = text.match(/([\d,]+)\s*users?/i);
    if (usersMatch) {
      metrics.users = parseInt(usersMatch[1].replace(/,/g, ''));
    }
    
    // Growth rate
    const growthMatch = text.match(/([\d.]+)%\s*growth/i);
    if (growthMatch) {
      metrics.growth = parseFloat(growthMatch[1]);
    }
    
    // Founded year
    const foundedMatch = text.match(/founded[:\s]*(20\d{2})/i);
    if (foundedMatch) {
      metrics.founded = parseInt(foundedMatch[1]);
    }
    
    return metrics;
  }

  private createHighlights(metrics: any, description: string): string[] {
    const highlights: string[] = [];
    
    if (metrics.users) {
      highlights.push(`${metrics.users.toLocaleString()} users`);
    }
    
    if (metrics.employees) {
      highlights.push(`${metrics.employees} employees`);
    }
    
    if (metrics.growth) {
      highlights.push(`${metrics.growth}% growth`);
    }
    
    if (metrics.founded) {
      const age = new Date().getFullYear() - metrics.founded;
      highlights.push(`${age} years old`);
    }
    
    // Add description highlights if we don't have enough metrics
    if (highlights.length < 2 && description) {
      const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 20).slice(0, 2);
      highlights.push(...sentences.map(s => s.trim()));
    }
    
    return highlights;
  }
}