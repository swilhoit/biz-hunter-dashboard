import { Browser } from 'playwright';
import { BaseScraper } from './index';
import { RawListing, ScrapingResult } from '../types';
import { createScrapeGraphService, ScrapeGraphService } from '../scrapegraph/ScrapeGraphService';

/**
 * Universal scraper using ScrapeGraph AI
 * This scraper can handle multiple sites using AI-powered extraction
 */
export class ScrapeGraphUniversalScraper extends BaseScraper {
  private scrapeGraphService: ScrapeGraphService | null = null;
  private targetSite: string;
  
  constructor(targetSite: string = 'all') {
    super();
    this.targetSite = targetSite;
  }
  
  async initialize(): Promise<void> {
    try {
      this.scrapeGraphService = await createScrapeGraphService();
      console.log('✅ ScrapeGraph AI service initialized');
    } catch (error) {
      console.error('Failed to initialize ScrapeGraph:', error);
      throw new Error('ScrapeGraph API key not configured. Add VITE_SCRAPEGRAPH_API_KEY to .env');
    }
  }
  
  protected getSearchUrl(query: string): string {
    // This is handled internally by ScrapeGraph service
    return query;
  }
  
  async scrapeListings(
    browser: Browser,
    query: string = 'amazon fba ecommerce',
    maxPages: number = 3
  ): Promise<ScrapingResult> {
    // Make sure service is initialized
    if (!this.scrapeGraphService) {
      await this.initialize();
    }
    
    console.log(`🤖 Starting ScrapeGraph AI scraping for: ${this.targetSite}`);
    const startTime = Date.now();
    const listings: RawListing[] = [];
    const errors: Array<{ error: string; context?: any }> = [];
    
    try {
      let scraperResults;
      
      if (this.targetSite === 'all') {
        // Scrape all configured sites
        scraperResults = await this.scrapeGraphService!.scrapeAllSites(maxPages);
      } else {
        // Scrape specific site
        const siteListings = await this.scrapeGraphService!.scrapeSite(this.targetSite, maxPages);
        scraperResults = { [this.targetSite]: siteListings };
      }
      
      // Convert ScrapeGraph results to our RawListing format
      for (const [siteName, siteListings] of Object.entries(scraperResults)) {
        console.log(`Processing ${siteListings.length} listings from ${siteName}`);
        
        for (const listing of siteListings) {
          try {
            // Map to RawListing format
            const rawListing: RawListing = {
              // Basic info
              title: listing.name || 'Unknown Business',
              url: listing.listingUrl || '',
              description: listing.description || '',
              
              // Financial data
              price: this.formatPriceString(listing.askingPrice),
              revenue: this.formatPriceString(listing.annualRevenue || listing.monthlyRevenue),
              profit: this.formatPriceString(listing.annualProfit),
              
              // Additional fields
              location: listing.location,
              industry: listing.industry || listing.niche,
              multiple: listing.profitMultiple?.toString(),
              
              // Metadata
              source: this.mapSiteNameToSource(siteName),
              scrapedAt: new Date()
            };
            
            // Add FBA flag to description if applicable
            if (listing.isFBA) {
              rawListing.description = `[Amazon FBA Business] ${rawListing.description}`;
            }
            
            listings.push(rawListing);
          } catch (error) {
            console.error(`Error processing listing from ${siteName}:`, error);
            errors.push({ 
              error: `Failed to process listing: ${error.message}`,
              context: { siteName, listing }
            });
          }
        }
      }
      
      console.log(`✅ ScrapeGraph scraping completed. Found ${listings.length} total listings`);
      
    } catch (error) {
      console.error('ScrapeGraph scraping error:', error);
      errors.push({ 
        error: error.message || 'Unknown ScrapeGraph error',
        context: { targetSite: this.targetSite }
      });
    }
    
    return {
      listings,
      errors,
      metrics: {
        totalListings: listings.length,
        successfulPages: errors.length === 0 ? maxPages : 0,
        failedPages: errors.length > 0 ? 1 : 0,
        scrapingDuration: Date.now() - startTime,
        errors: errors.length
      }
    };
  }
  
  /**
   * Format price value to string representation
   */
  private formatPriceString(price: any): string | undefined {
    if (!price) return undefined;
    
    if (typeof price === 'number') {
      if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`;
      } else if (price >= 1000) {
        return `$${(price / 1000).toFixed(0)}K`;
      }
      return `$${price}`;
    }
    
    // Already a string
    return price.toString();
  }
  
  /**
   * Map internal site names to source names used in database
   */
  private mapSiteNameToSource(siteName: string): string {
    const mapping: Record<string, string> = {
      'quietlight': 'QuietLight',
      'bizbuysell': 'BizBuySell',
      'flippa': 'Flippa',
      'empireflippers': 'Empire Flippers',
      'bizquest': 'BizQuest',
      'exitadviser': 'Exit Adviser'
    };
    
    return mapping[siteName.toLowerCase()] || siteName;
  }
}

// Convenience function to create scrapers for specific sites
export function createScrapeGraphScraper(site?: string): ScrapeGraphUniversalScraper {
  return new ScrapeGraphUniversalScraper(site || 'all');
}