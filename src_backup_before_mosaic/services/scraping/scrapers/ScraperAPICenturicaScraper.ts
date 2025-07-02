import fetch from 'node-fetch';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class ScraperAPICenturicaScraper extends BaseScraper {
  readonly sourceName = 'Centurica';
  private readonly scraperApiKey = '054d8cdaa4e8453e3afa7e5e9316c72f';
  private readonly scraperApiUrl = 'https://api.scraperapi.com/';
  private readonly centuricaUrl = 'https://app.centurica.com/marketwatch';

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting Centurica aggregator scraping session with ScraperAPI');
    
    try {
      const listings = await this.scrapeMarketwatchPage();
      
      this.finishMetrics();
      logger.info(`Centurica scraping completed: ${listings.length} listings found`);
      
      return {
        success: true,
        listings,
        totalFound: listings.length,
        totalScraped: listings.length,
      };
    } catch (error) {
      this.finishMetrics();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Centurica scraping failed:', error);
      
      return {
        success: false,
        listings: [],
        errors: [errorMessage],
      };
    }
  }

  private async fetchWithScraperAPI(url: string, options?: any): Promise<any> {
    const params = new URLSearchParams({
      api_key: this.scraperApiKey,
      url: url,
      render: 'true',
      premium: 'true',
      wait: '5',
      window_width: '1920',
      window_height: '1080'
    });

    const apiUrl = `${this.scraperApiUrl}?${params.toString()}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: options?.body
      });
      
      if (!response.ok) {
        throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      
      // Try to parse as JSON first
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      logger.error(`Failed to fetch ${url} via ScraperAPI:`, error);
      throw error;
    }
  }

  private async scrapeMarketwatchPage(): Promise<RawListing[]> {
    const listings: RawListing[] = [];
    
    try {
      logger.info(`Fetching listings from Centurica Marketwatch: ${this.centuricaUrl}`);
      
      const html = await this.fetchWithScraperAPI(this.centuricaUrl);
      
      if (typeof html === 'string') {
        const extractedListings = this.extractListingsFromHtml(html);
        listings.push(...extractedListings);
        
        this.recordSuccess();
        logger.info(`Extracted ${extractedListings.length} listings from Centurica`);
      } else {
        logger.warn('Unexpected response format from Centurica');
        this.recordFailure('Unexpected response format');
      }
      
    } catch (error) {
      const errorMessage = `Page request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.recordFailure(errorMessage);
      logger.error(errorMessage);
    }

    return listings;
  }

  private extractListingsFromHtml(html: string): RawListing[] {
    const listings: RawListing[] = [];
    
    try {
      // Look for the DataTable initialization script that contains the data
      const dataTableMatch = html.match(/\$\('#table-listings'\)\.DataTable\({[\s\S]*?data:\s*(\[[\s\S]*?\])/);
      
      if (dataTableMatch && dataTableMatch[1]) {
        logger.info('Found DataTable data in HTML');
        
        try {
          // Parse the JSON data array
          const jsonData = JSON.parse(dataTableMatch[1]);
          
          if (Array.isArray(jsonData)) {
            logger.info(`Found ${jsonData.length} raw listings in DataTable`);
            
            // Debug: log first item structure
            if (jsonData.length > 0) {
              logger.info('Sample DataTable item structure:', JSON.stringify(jsonData[0], null, 2));
            }
            
            for (const item of jsonData) {
              const listing = this.convertToRawListing(item);
              if (listing) {
                listings.push(listing);
              }
            }
          }
        } catch (parseError) {
          logger.error('Failed to parse DataTable JSON:', parseError);
        }
      }
      
      // Also look for data in script variables that might contain full listing objects
      const scriptVarMatch = html.match(/var\s+listings\s*=\s*(\[[\s\S]*?\]);/);
      if (scriptVarMatch && scriptVarMatch[1] && listings.length === 0) {
        try {
          const listingsData = JSON.parse(scriptVarMatch[1]);
          if (Array.isArray(listingsData)) {
            logger.info(`Found ${listingsData.length} listings in script variable`);
            
            for (const item of listingsData) {
              const listing = this.convertToRawListing(item);
              if (listing) {
                listings.push(listing);
              }
            }
          }
        } catch (parseError) {
          logger.error('Failed to parse script variable JSON:', parseError);
        }
      }
      
      // If no DataTable data found, look for alternative data sources
      if (listings.length === 0) {
        // Try to find data in other script tags or data attributes
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
        
        if (scriptMatches) {
          for (const script of scriptMatches) {
            // Look for various data patterns
            const dataPatterns = [
              /var\s+listings\s*=\s*(\[[\s\S]*?\]);/,
              /data:\s*(\[[\s\S]*?\])/,
              /listings:\s*(\[[\s\S]*?\])/
            ];
            
            for (const pattern of dataPatterns) {
              const match = script.match(pattern);
              if (match && match[1]) {
                try {
                  const data = JSON.parse(match[1]);
                  if (Array.isArray(data) && data.length > 0) {
                    logger.info(`Found ${data.length} listings in script tag`);
                    
                    for (const item of data) {
                      const listing = this.convertToRawListing(item);
                      if (listing) {
                        listings.push(listing);
                      }
                    }
                    break;
                  }
                } catch (e) {
                  // Continue to next pattern
                }
              }
            }
            
            if (listings.length > 0) break;
          }
        }
      }
      
      // If still no listings found, try to parse HTML table rows
      if (listings.length === 0) {
        const tableRows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
        if (tableRows) {
          logger.info(`Found ${tableRows.length} table rows to parse`);
          
          for (const row of tableRows) {
            const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
            if (cells && cells.length >= 10) {
              const cellData = cells.map((cell, index) => {
                // Extract URLs from cells before cleaning - try multiple patterns
                const urlPatterns = [
                  /href=["']([^"']+)["']/,
                  /data-url=["']([^"']+)["']/,
                  /data-href=["']([^"']+)["']/,
                  /onclick=["'].*?window\.open\(['"]([^"']+)['"][^"']*\)["']/
                ];
                
                let extractedUrl = null;
                for (const pattern of urlPatterns) {
                  const match = cell.match(pattern);
                  if (match && match[1]) {
                    extractedUrl = match[1];
                    break;
                  }
                }
                
                const cleanText = cell.replace(/<[^>]*>/g, '').trim();
                
                // For the listing heading column, preserve both text and URL
                if (index === 1 && extractedUrl) {
                  return {
                    text: cleanText,
                    url: extractedUrl
                  };
                }
                
                return cleanText;
              });
              
              // Debug: log the structure of the first few rows to understand the data
              if (listings.length < 2) {
                logger.info(`Row ${listings.length + 1} structure (${cellData.length} cells):`, cellData.map((cell, i) => `[${i}]: ${typeof cell === 'object' ? JSON.stringify(cell) : cell.substring(0, 50)}`));
              }
              
              const listing = this.convertToRawListing(cellData);
              if (listing) {
                listings.push(listing);
              }
            }
          }
        }
      }
      
      logger.info(`Successfully extracted ${listings.length} listings from Centurica HTML`);
      
    } catch (error) {
      logger.error('Error extracting listings from HTML:', error);
    }
    
    return listings;
  }

  private convertToRawListing(item: any[] | any): RawListing | null {
    try {
      let listingData: any;
      
      // Handle both array format (from DataTable) and object format
      if (Array.isArray(item)) {
        // Based on the column structure from the website:
        // 0: Added Date/Time, 1: Listing Heading, 2: Business Model, 3: Niche
        // 4: Asking Price, 5: Gross Revenue, 6: Net Revenue, 7: Inventory Value
        // 8: Profit Multiple, 9: R-Index, 10: Provider, 11: SBA Qual, 12: Boopos Qual
        
        if (item.length < 11) {
          return null;
        }
        
        listingData = {
          addedDate: item[0],
          listingHeading: typeof item[1] === 'object' ? item[1].text : item[1],
          listingUrl: typeof item[1] === 'object' ? item[1].url : null,
          businessModel: item[2],
          niche: item[3],
          askingPrice: item[4],
          grossRevenue: item[5],
          netRevenue: item[6],
          inventoryValue: item[7],
          profitMultiple: item[8],
          rIndex: item[9],
          provider: item[10],
          sbaQualified: item[11],
          booposQualified: item[12]
        };
      } else if (typeof item === 'object' && item !== null) {
        // Handle object format - Centurica uses objects with properties like:
        // { heading, business_model, niche, asking_price, gross_revenue, net_revenue, etc. }
        listingData = {
          addedDate: item.added_date || item.date_added,
          listingHeading: item.heading || item.listing_heading || item.name,
          businessModel: item.business_model || item.businessModel,
          niche: item.niche,
          askingPrice: item.asking_price || item.askingPrice,
          grossRevenue: item.gross_revenue || item.grossRevenue,
          netRevenue: item.net_revenue || item.netRevenue,
          inventoryValue: item.inventory_value || item.inventoryValue,
          profitMultiple: item.profit_multiple || item.profitMultiple,
          rIndex: item.r_index || item.rIndex,
          provider: item.provider || item.broker,
          sbaQualified: item.sba_qualified || item.sbaQualified,
          booposQualified: item.boopos_qualified || item.booposQualified,
          listingUrl: item.listing_url || item.original_url || item.url
        };
      } else {
        return null;
      }

      // Extract and clean basic info
      const listingHeading = this.extractTextFromHtml(listingData.listingHeading || listingData.name || '');
      const businessModel = this.extractTextFromHtml(listingData.businessModel || '');
      const niche = this.extractTextFromHtml(listingData.niche || '');
      const askingPriceText = this.extractTextFromHtml(listingData.askingPrice || '');
      const grossRevenueText = this.extractTextFromHtml(listingData.grossRevenue || '');
      const netRevenueText = this.extractTextFromHtml(listingData.netRevenue || '');
      
      // Provider might be empty in the table, so we'll infer it from business characteristics
      let provider = this.extractTextFromHtml(listingData.provider || '');
      if (!provider || provider.trim() === '') {
        provider = this.inferProviderFromListing(businessModel, niche, askingPriceText, grossRevenueText);
      }

      // Clean and extract values
      const name = DataProcessor.cleanText(listingHeading);
      const askingPrice = DataProcessor.extractPrice(askingPriceText);
      const grossRevenue = DataProcessor.extractRevenue(grossRevenueText);
      const netRevenue = DataProcessor.extractRevenue(netRevenueText);

      // Use gross revenue as annual revenue if available, otherwise net revenue
      const annualRevenue = grossRevenue > 0 ? grossRevenue : netRevenue;

      // Extract original URL from listing data or heading HTML
      let originalUrl = listingData.listingUrl || this.extractUrlFromHtml(listingData.listingHeading || '');
      
      // Validate the extracted URL for the provider
      if (originalUrl && this.isValidProviderUrl(originalUrl, provider)) {
        // Keep the valid URL as-is
      } else {
        // Try to extract listing ID and construct proper URL
        const listingId = this.extractListingIdFromData(item, provider);
        if (listingId && provider) {
          originalUrl = this.constructProviderUrl(provider, listingId, name);
        } else {
          // Use provider marketplace as fallback for invalid/missing URLs
          originalUrl = this.generateProviderUrl(provider);
        }
      }

      // Build description
      const description = this.buildDescription(businessModel, niche, provider);

      // Determine industry from business model and niche
      const industry = this.mapIndustry(businessModel, niche);

      // Only include meaningful listings
      if (name && name.length > 3 && (askingPrice > 0 || annualRevenue > 0)) {
        const listing: RawListing = {
          name,
          description,
          askingPrice,
          annualRevenue,
          location: 'Various', // Centurica aggregates from multiple sources
          industry,
          source: `${this.sourceName} (${provider || 'Unknown Provider'})`,
          originalUrl: originalUrl || this.generateProviderUrl(provider),
          highlights: this.extractHighlights(businessModel, niche, grossRevenueText, netRevenueText),
          scrapedAt: new Date(),
        };

        // Add additional Centurica-specific fields if available
        if (listingData.rIndex) {
          (listing as any).rIndex = DataProcessor.extractNumber(this.extractTextFromHtml(listingData.rIndex));
        }
        if (listingData.profitMultiple) {
          (listing as any).profitMultiple = DataProcessor.extractNumber(this.extractTextFromHtml(listingData.profitMultiple));
        }
        if (listingData.sbaQualified) {
          (listing as any).sbaQualified = this.extractTextFromHtml(listingData.sbaQualified).toLowerCase().includes('yes');
        }
        if (listingData.booposQualified) {
          (listing as any).booposQualified = this.extractTextFromHtml(listingData.booposQualified).toLowerCase().includes('yes');
        }

        return listing;
      }

      return null;
    } catch (error) {
      logger.warn('Error converting item to listing:', error);
      return null;
    }
  }

  private extractTextFromHtml(htmlString: string): string {
    if (!htmlString || typeof htmlString !== 'string') return '';
    
    // Remove HTML tags and decode entities
    return htmlString
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  private extractUrlFromHtml(htmlString: string): string | undefined {
    if (!htmlString || typeof htmlString !== 'string') return undefined;
    
    const hrefMatch = htmlString.match(/href=["']([^"']+)["']/);
    if (hrefMatch && hrefMatch[1]) {
      const url = hrefMatch[1];
      
      // Skip if it's just the main marketwatch page
      if (url === '/marketwatch' || url === 'https://app.centurica.com/marketwatch') {
        return undefined;
      }
      
      // Return absolute URL if it's relative
      if (url.startsWith('/')) {
        return `https://app.centurica.com${url}`;
      }
      
      // Return the URL if it's already absolute and not just the main page
      if (url.startsWith('http') && !url.endsWith('/marketwatch')) {
        return url;
      }
    }
    
    return undefined;
  }

  private extractListingIdFromData(item: any, provider: string): string | undefined {
    // Try to extract listing ID from various data sources
    if (Array.isArray(item)) {
      // For array format, look for ID in all columns
      for (let i = 0; i < item.length; i++) {
        const cellData = item[i];
        if (typeof cellData === 'object' && cellData?.url) {
          const id = this.extractIdFromUrl(cellData.url, provider);
          if (id) return id;
        } else if (typeof cellData === 'string') {
          const id = this.extractIdFromString(cellData, provider);
          if (id) return id;
        }
      }
    } else if (typeof item === 'object' && item !== null) {
      // For object format, look for ID fields
      const possibleIdFields = ['id', 'listing_id', 'listingId', 'listing_number', 'number', 'ref', 'reference'];
      for (const field of possibleIdFields) {
        if (item[field]) {
          const id = this.extractIdFromString(String(item[field]), provider);
          if (id) return id;
        }
      }
      
      // Check URL field
      if (item.listing_url || item.url || item.href) {
        const url = item.listing_url || item.url || item.href;
        const id = this.extractIdFromUrl(url, provider);
        if (id) return id;
      }
      
      // Check name/title fields for embedded IDs
      const nameFields = ['name', 'title', 'heading', 'listingHeading'];
      for (const field of nameFields) {
        if (item[field]) {
          const id = this.extractIdFromString(String(item[field]), provider);
          if (id) return id;
        }
      }
    }
    
    return undefined;
  }

  private extractIdFromUrl(url: string, provider: string): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    
    // Extract numeric ID from Empire Flippers URLs
    if (provider === 'Empire Flippers' && url.includes('empireflippers.com')) {
      const idMatch = url.match(/\/listing\/(\d+)(?:\/|$)/);
      if (idMatch && idMatch[1]) {
        return idMatch[1];
      }
    }
    
    // Extract ID from other providers' URLs
    if (provider === 'Flippa' && url.includes('flippa.com')) {
      const idMatch = url.match(/\/(\d+)-/);
      if (idMatch && idMatch[1]) {
        return idMatch[1];
      }
    }
    
    return undefined;
  }

  private isValidProviderUrl(url: string, provider: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // Check if URL is a proper format for the provider
    if (provider === 'Empire Flippers' && url.includes('empireflippers.com')) {
      // Accept URLs with numeric IDs
      return /\/listing\/\d+(?:\/|$)/.test(url);
    }
    
    if (provider === 'Flippa' && url.includes('flippa.com')) {
      // Accept Flippa URLs
      return true;
    }
    
    // For other providers, accept any URL from their domain
    return url.startsWith('http');
  }

  private extractIdFromString(text: string, provider: string): string | undefined {
    if (!text || typeof text !== 'string') return undefined;
    
    // Provider-specific ID patterns
    if (provider === 'Empire Flippers') {
      // Empire Flippers typically uses 5-6 digit listing IDs
      const patterns = [
        /(?:id|listing|#|ref)\s*:?\s*(\d{5,6})/i,
        /\b(\d{5,6})\b/, // 5-6 digit numbers for EF
        /listing[\/\s]*(\d{5,6})/i,
        /ef[\/\s]*(\d{5,6})/i,
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    } else {
      // General patterns for other providers
      const patterns = [
        /(?:id|listing|#)\s*:?\s*(\d{4,})/i,
        /\b(\d{4,})\b/, // 4+ digit numbers
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    
    return undefined;
  }

  private constructProviderUrl(provider: string, listingId: string, fallbackName?: string): string {
    switch (provider) {
      case 'Empire Flippers':
        return `https://empireflippers.com/listing/${listingId}/`;
      case 'Flippa':
        return `https://flippa.com/listing/${listingId}/`;
      case 'BizBuySell':
        // BizBuySell uses more complex URLs, but try with ID
        return `https://www.bizbuysell.com/business/${listingId}/`;
      case 'Quiet Light':
        return `https://quietlight.com/listing/${listingId}/`;
      default:
        return this.generateProviderUrl(provider);
    }
  }

  private buildDescription(businessModel: string, niche: string, provider: string): string {
    const parts = [businessModel, niche].filter(part => part && part.trim().length > 0);
    const description = parts.length > 0 ? parts.join(' - ') : 'Business opportunity';
    
    if (provider && provider.trim().length > 0) {
      return `${description} (via ${provider})`;
    }
    
    return description;
  }

  private mapIndustry(businessModel: string, niche: string): string {
    const combinedText = `${businessModel} ${niche}`.toLowerCase();
    
    const industries = {
      'SaaS': /\b(saas|software|platform|app|application|subscription|b2b)\b/,
      'E-commerce': /\b(ecommerce|e-commerce|retail|marketplace|dropship|amazon|fba)\b/,
      'Content': /\b(blog|content|media|newsletter|publication|affiliate)\b/,
      'Technology': /\b(tech|ai|automation|api|development|mobile|web)\b/,
      'Health & Wellness': /\b(health|medical|wellness|fitness|supplement|beauty)\b/,
      'Education': /\b(education|learning|course|training|school|online learning)\b/,
      'Finance': /\b(finance|fintech|payment|trading|crypto|investment)\b/,
      'Food & Beverage': /\b(food|restaurant|beverage|cafe|kitchen|culinary)\b/,
      'Manufacturing': /\b(manufacturing|industrial|production|distribution)\b/,
      'Services': /\b(service|consulting|agency|professional|business service)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(combinedText)) {
        return industry;
      }
    }
    
    // Default based on business model
    if (businessModel.toLowerCase().includes('online')) {
      return 'Online Business';
    }
    
    return 'Other';
  }

  private generateProviderUrl(provider: string): string {
    // For Centurica aggregated listings, if we can't find the specific listing URL,
    // return the appropriate broker's marketplace page
    const providerUrls: { [key: string]: string } = {
      'Empire Flippers': 'https://empireflippers.com/marketplace/',
      'FE International': 'https://feinternational.com/buy-a-website/',
      'Motion Invest': 'https://motioninvest.com/marketplace/',
      'Quiet Light': 'https://quietlight.com/listings/',
      'BizBuySell': 'https://www.bizbuysell.com/businesses-for-sale/',
      'Digital Exits': 'https://digitalexits.com/marketplace/',
      'Flippa': 'https://flippa.com/search/'
    };

    return providerUrls[provider] || 'https://app.centurica.com/marketwatch';
  }


  private inferProviderFromListing(businessModel: string, niche: string, askingPrice: string, revenue: string): string {
    // Infer likely broker based on business characteristics
    const combinedText = `${businessModel} ${niche}`.toLowerCase();
    const priceValue = DataProcessor.extractPrice(askingPrice);
    const revenueValue = DataProcessor.extractRevenue(revenue);
    
    // High-value businesses often go to premium brokers
    if (priceValue > 1000000) {
      if (combinedText.includes('saas') || combinedText.includes('software') || combinedText.includes('app')) {
        return 'FE International'; // Specializes in SaaS/tech
      }
      if (combinedText.includes('ecommerce') || combinedText.includes('amazon')) {
        return 'Quiet Light'; // Strong in ecommerce
      }
      return 'Empire Flippers'; // General high-value
    }
    
    // Content sites often go to Motion Invest
    if (combinedText.includes('content') || combinedText.includes('blog') || combinedText.includes('affiliate')) {
      return 'Motion Invest';
    }
    
    // Lower value businesses
    if (priceValue < 500000) {
      if (combinedText.includes('ecommerce') || combinedText.includes('online')) {
        return 'Flippa';
      }
      return 'BizBuySell';
    }
    
    // Mid-range defaults
    if (combinedText.includes('service')) {
      return 'BizBuySell';
    }
    
    return 'Empire Flippers'; // Default fallback
  }

  private extractHighlights(businessModel: string, niche: string, grossRevenue: string, netRevenue: string): string[] {
    const highlights: string[] = [];
    
    if (businessModel && businessModel.trim()) {
      highlights.push(`Business Model: ${businessModel}`);
    }
    
    if (niche && niche.trim()) {
      highlights.push(`Niche: ${niche}`);
    }
    
    if (grossRevenue && grossRevenue.trim()) {
      highlights.push(`Gross Revenue: ${grossRevenue}`);
    }
    
    if (netRevenue && netRevenue.trim()) {
      highlights.push(`Net Revenue: ${netRevenue}`);
    }
    
    return highlights;
  }
}