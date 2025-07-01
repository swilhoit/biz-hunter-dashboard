import { BaseScraper, RawListing, ScrapingResult } from '../types';
import logger from '../utils/logger';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class ExitAdviserScraper extends BaseScraper {
  readonly sourceName = 'ExitAdviser';
  private scraperAPIKey: string = process.env.SCRAPER_API_KEY || '';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting ExitAdviser scraping session');
    
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
      logger.info(`ExitAdviser scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`ExitAdviser scraping failed: ${errorMessage}`);
      
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
      // Use ScraperAPI to fetch the URL
      const response = await axios.get('http://api.scraperapi.com', {
        params: {
          api_key: process.env.SCRAPER_API_KEY,
          url: url,
          render: true // Enable JavaScript rendering
        },
        timeout: this.config.timeout || 60000
      });
      
      // Log success and response size
      const contentLength = response.data?.length || 0;
      logger.info(`Successfully fetched ${url} with ScraperAPI (${contentLength} bytes)`);
      
      // If verbose logging is enabled, log the first 500 chars of the HTML
      if (this.config.verbose && response.data) {
        const preview = response.data.substring(0, 500);
        logger.info(`HTML Preview (first 500 chars): ${preview}...`);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch ${url}: ${error.message}`);
      throw error;
    }
  }

  private buildSearchUrl(page: number): string {
    // Search for Amazon FBA businesses on ExitAdviser
    const basePath = '/find-a-business';
    const params = new URLSearchParams({
      'category': 'ecommerce',
      'keywords': 'amazon fba ecommerce marketplace online retail'
    });
    
    const url = `https://exitadviser.com${basePath}${page > 1 ? `/page-${page}` : ''}?${params.toString()}`;
    logger.info(`Building ExitAdviser URL: ${url}`);
    return url;
  }

  private async scrapeListings(): Promise<RawListing[]> {
    const listings: RawListing[] = [];
    let currentPage = 1;
    const maxPages = this.config.maxPages || 3;

    while (currentPage <= maxPages) {
      try {
        logger.info(`Scraping ExitAdviser page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        
        // Use ScraperAPI to fetch the page
        const html = await this.fetchWithScraperAPI(url);
        
        // Extract listings from page using cheerio
        const pageListings = this.extractListingsFromHTML(html, url);
        listings.push(...pageListings);
        
        this.recordSuccess();
        logger.info(`Found ${pageListings.length} listings on page ${currentPage}`);
        
        // Check if there's a next page using cheerio
        const $ = cheerio.load(html);
        const hasNextPage = $('.pagination .next, a.next, .pagination-next, a[rel="next"]').length > 0;
        
        if (!hasNextPage || currentPage >= maxPages) {
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

  private extractListingsFromHTML(html: string, sourceUrl: string): RawListing[] {
    const listings: RawListing[] = [];
    const $ = cheerio.load(html);
    
    // Enhanced debug info for DOM structure
    if (this.config.verbose) {
      logger.info(`Page content length: ${html.length} characters`);
      logger.info(`Page title: ${$('title').text()}`);
      logger.info(`Page headings: ${$('h1').length} h1, ${$('h2').length} h2, ${$('h3').length} h3`);
      logger.info(`DOM structure: ${$('div').length} divs, ${$('a').length} links, ${$('section').length} sections`);
      
      // Log first few links to help debug
      const links = $('a').toArray().slice(0, 5);
      links.forEach((link, index) => {
        logger.info(`Link ${index}: ${$(link).attr('href')} - ${$(link).text().trim()}`);
      });
    }
    
    // Try multiple selectors for ExitAdviser listings
    const listingSelectors = [
      '.search-result',
      '.business-listing',
      '.listing-item',
      '.company-item',
      '.business-card',
      '[data-listing]',
      'article.listing'
    ];
    
    let listingElements: cheerio.Element[] = [];
    
    // Try each selector and use the one that finds the most elements
    for (const selector of listingSelectors) {
      const elements = $(selector).toArray();
      if (elements.length > 0) {
        logger.info(`Found ${elements.length} listings using selector: ${selector}`);
        if (elements.length > listingElements.length) {
          listingElements = elements;
        }
      }
    }
    
    if (listingElements.length === 0) {
      logger.info('No listing elements found with standard selectors. Trying generic element analysis...');
      
      // As a fallback, look for likely listing containers
      const potentialListings = $('div').filter((_, el) => {
        const $el = $(el);
        // Likely a listing if it has a title, price, and link
        return $el.find('h2, h3').length > 0 && 
               $el.find('a').length > 0 && 
               ($el.text().includes('$') || $el.text().toLowerCase().includes('price'));
      }).toArray();
      
      if (potentialListings.length > 0) {
        logger.info(`Found ${potentialListings.length} potential listings through content analysis`);
        listingElements = potentialListings;
      }
    }
    
    // Process each listing
    listingElements.forEach((element, index) => {
      try {
        const $element = $(element);
        
        if (this.config.verbose) {
          logger.info(`Processing listing ${index + 1}/${listingElements.length}...`);
          logger.info(`Listing HTML: ${$element.html().substring(0, 200)}...`);
        }
        
        // Extract title - try multiple selectors
        let title = '';
        const titleSelectors = ['h1', 'h2', 'h3', '.title', '.listing-title', '[data-title]', 'strong'];
        for (const selector of titleSelectors) {
          const titleText = $element.find(selector).first().text().trim();
          if (titleText) {
            title = titleText;
            break;
          }
        }
        
        // If still no title, try to get it from a link
        if (!title) {
          title = $element.find('a').first().text().trim();
        }
        
        // Extract price - try multiple approaches
        let priceText = '';
        const priceSelectors = ['.price', '.listing-price', '[data-price]', '.amount'];
        for (const selector of priceSelectors) {
          const price = $element.find(selector).first().text().trim();
          if (price) {
            priceText = price;
            break;
          }
        }
        
        // If still no price, look for $ symbol in the text
        if (!priceText) {
          const fullText = $element.text();
          const priceMatch = fullText.match(/\$[\d,]+(\.\d{2})?/); 
          if (priceMatch) {
            priceText = priceMatch[0];
          }
        }
        
        const price = this.extractPrice(priceText);
        
        // Extract description
        let description = $element.find('.description, .listing-description, p').first().text().trim();
        if (!description) {
          // Get text but exclude title and price text
          const allText = $element.text();
          if (title) {
            description = allText.replace(title, '').trim();
          }
          if (priceText) {
            description = description.replace(priceText, '').trim();
          }
          // Limit description length
          description = description.substring(0, 200);
        }
        
        // Extract URL
        const linkElement = $element.find('a').first();
        const relativeUrl = linkElement.attr('href') || '';
        const url = relativeUrl ? new URL(relativeUrl, sourceUrl).toString() : sourceUrl;
        
        // Extract location
        const locationSelectors = ['.location', '.listing-location', '[data-location]'];
        let location = '';
        for (const selector of locationSelectors) {
          const loc = $element.find(selector).first().text().trim();
          if (loc) {
            location = loc;
            break;
          }
        }
        
        // Extract industry
        const industrySelectors = ['.category', '.industry', '.business-type', '[data-category]'];
        let industry = '';
        for (const selector of industrySelectors) {
          const ind = $element.find(selector).first().text().trim();
          if (ind) {
            industry = ind;
            break;
          }
        }
        
        if (this.config.verbose) {
          logger.info(`Extracted listing: ${title} - ${priceText} - ${url}`);
        }
        
        // Filter for Amazon FBA businesses
        const isFBABusiness = this.isFBABusiness(title, description);
        if (!isFBABusiness) {
          return; // Skip non-FBA businesses
        }

        // Only create a listing if we have at least a title or description
        if (title || description) {
          // Create listing object
          const listing: RawListing = {
            name: title || 'Unnamed Business',
            askingPrice: price,
            description,
            url,
            location,
            industry,
            source: 'exitadviser',
            scrapedAt: new Date(),
          };
          
          listings.push(listing);
        }
      } catch (error) {
        logger.error(`Error extracting listing ${index + 1}: ${error.message}`);
      }
    });
    
    logger.info(`Found ${listings.length} listings on page ${this.currentPage}`);
    return listings;
  }
  
  private extractIndustry(name: string, description: string): string {
    const text = `${name} ${description}`.toLowerCase();
    
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
    
    return 'Business';
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
  
  private extractHighlightsFromText(text: string): string[] {
    if (!text) return [];
    
    const highlights: string[] = [];
    
    // Extract bullet points if they exist
    const bulletPointRegex = /[•\-\*]\s*([^•\-\*\n]+)/g;
    let match;
    
    while ((match = bulletPointRegex.exec(text)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        highlights.push(match[1].trim());
      }
    }
    
    // If no bullet points, extract sentences (max 3)
    if (highlights.length === 0) {
      const sentences = text
        .split(/[.!?]\s+/)
        .filter(s => s.trim().length > 10)
        .slice(0, 3);
      
      highlights.push(...sentences);
    }
    
    return highlights;
  }
  
  private normalizeUrl(url: string, baseUrl: string): string {
    if (!url) return baseUrl;
    if (url.startsWith('http')) return url;
    
    const base = 'https://exitadviser.com';
    return url.startsWith('/') 
      ? `${base}${url}`
      : `${base}/${url}`;
  }

  private isFBABusiness(name: string, description: string): boolean {
    const text = `${name} ${description}`.toLowerCase();
    const fbaKeywords = [
      'amazon fba', 'amazon seller', 'fba business', 'amazon business',
      'ecommerce', 'e-commerce', 'amazon store', 'amazon selling',
      'private label', 'retail arbitrage', 'wholesale amazon',
      'amazon marketplace', 'fulfilled by amazon', 'fba',
      'dropshipping', 'online retail', 'product sales'
    ];
    
    return fbaKeywords.some(keyword => text.includes(keyword));
  }
}
