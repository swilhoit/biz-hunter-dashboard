import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPIAcquireScraper extends BaseScraper {
  readonly sourceName = 'Acquire.com';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Acquire.com scraping session with ScraperAPI');
    
    try {
      const listings = await this.scrapeListings();
      
      this.finishMetrics();
      logger.info(`Acquire.com scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Acquire.com scraping failed:', error);
      
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
      premium: 'true'  // Use premium for better protection bypass
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
      // MicroAcquire is now Acquire.com - scrape the main homepage which shows featured listings
      const url = 'https://microacquire.com/';  // Redirects to acquire.com
      logger.info(`Scraping Acquire.com homepage: ${url}`);
      
      const html = await this.fetchWithScraperAPI(url);
      const pageListings = this.extractListingsFromHtml(html);
      listings.push(...pageListings);
      
      this.recordSuccess();
      logger.info(`Acquire.com: ${pageListings.length} listings extracted`);
      
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

    logger.info(`Analyzing Acquire.com homepage for startup listings...`);

    // Look for the featured startup listings that were found in the investigation
    // These appear to be in app.acquire.com links
    const startupLinks = [];
    $('a[href*="app.acquire.com/startup"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        startupLinks.push({ href, text });
      }
    });

    logger.info(`Found ${startupLinks.length} startup links on homepage`);

    startupLinks.forEach((link, index) => {
      try {
        const text = link.text.toLowerCase();
        
        // Extract startup type
        let industry = 'Technology';
        if (text.includes('saas')) industry = 'SaaS';
        else if (text.includes('agency')) industry = 'Agency';
        else if (text.includes('ecommerce') || text.includes('e-commerce')) industry = 'E-commerce';
        else if (text.includes('marketplace')) industry = 'Marketplace';
        
        // Extract location
        const locationMatch = text.match(/(united states|sweden|united arab emirates|usa|uk|canada)/i);
        const location = locationMatch ? locationMatch[1] : 'Global';
        
        // Extract price
        const priceMatch = text.match(/asking price\s*\$?([\d.]+[km]?)/i);
        let askingPrice = 0;
        if (priceMatch) {
          const priceStr = priceMatch[1];
          if (priceStr.includes('k')) {
            askingPrice = parseFloat(priceStr) * 1000;
          } else if (priceStr.includes('m')) {
            askingPrice = parseFloat(priceStr) * 1000000;
          } else {
            askingPrice = parseFloat(priceStr);
          }
        }
        
        // Extract multiple (to calculate revenue)
        const multipleMatch = text.match(/([\d.]+)x profit/i);
        let annualRevenue = 0;
        if (multipleMatch && askingPrice > 0) {
          const multiple = parseFloat(multipleMatch[1]);
          annualRevenue = Math.round(askingPrice / multiple);
        }
        
        // Extract description
        const descriptionLines = text.split('\n').filter(line => 
          line.trim().length > 20 && 
          !line.includes('asking price') && 
          !line.includes('startup in')
        );
        const description = descriptionLines[0] || `${industry} business opportunity from Acquire.com`;
        
        // Create name from description or first meaningful line
        const name = DataProcessor.cleanText(description.substring(0, 80));
        
        if (name && name.length > 10 && (askingPrice > 0 || annualRevenue > 0)) {
          listings.push({
            name,
            description: DataProcessor.cleanText(description),
            askingPrice,
            annualRevenue,
            location,
            industry,
            source: this.sourceName,
            originalUrl: link.href,
            highlights: this.createHighlights(text, multiple, askingPrice),
            scrapedAt: new Date(),
          });
          
          // Log first few for debugging
          if (index < 3) {
            logger.info(`Listing ${index + 1}: ${JSON.stringify({
              name: name.substring(0, 50),
              askingPrice,
              annualRevenue,
              industry,
              location
            })}`);
          }
        }
        
      } catch (error) {
        logger.warn('Error extracting startup listing:', error);
      }
    });

    return listings;
  }

  private createHighlights(text: string, multiple: number | undefined, askingPrice: number): string[] {
    const highlights: string[] = [];
    
    if (multiple) {
      highlights.push(`${multiple}x profit multiple`);
    }
    
    if (askingPrice > 1000000) {
      highlights.push('Premium business opportunity');
    } else if (askingPrice > 500000) {
      highlights.push('Mid-market opportunity');
    }
    
    if (text.includes('profitable')) {
      highlights.push('Profitable business');
    }
    
    if (text.includes('growth')) {
      highlights.push('Growing business');
    }
    
    if (text.includes('automated') || text.includes('systemized')) {
      highlights.push('Automated systems');
    }
    
    return highlights.slice(0, 3); // Limit to 3 highlights
  }
}