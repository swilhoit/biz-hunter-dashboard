import { chromium, Browser, Page } from 'playwright';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class BizBuySellScraper extends BaseScraper {
  readonly sourceName = 'BizBuySell';
  private browser?: Browser;
  private page?: Page;

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting BizBuySell scraping session');
    
    try {
      await this.initBrowser();
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
    } finally {
      await this.cleanup();
    }
  }

  private async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage({
      userAgent: this.config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    
    await this.page.setDefaultTimeout(this.config.timeout || 30000);
  }

  private async scrapeListings(): Promise<RawListing[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const listings: RawListing[] = [];
    let currentPage = 1;
    const maxPages = this.config.maxPages || 3;

    while (currentPage <= maxPages) {
      try {
        logger.info(`Scraping BizBuySell page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout || 30000
        });
        
        // Wait for listings to load
        await this.page.waitForSelector('.result-list-item, .listing-item, .business-listing-item', { timeout: 10000 });
        
        const rawPageListings = await this.extractListingsFromPage();
        const processedPageListings = this.processListings(rawPageListings);
        listings.push(...processedPageListings);
        
        this.recordSuccess();
        logger.info(`Page ${currentPage}: ${processedPageListings.length} listings extracted`);
        
        // Check if there's a next page
        const hasNextPage = await this.hasNextPage();
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
    // BizBuySell search URL for business listings
    const baseUrl = 'https://www.bizbuysell.com/businesses-for-sale/';
    const params = new URLSearchParams({
      page: page.toString(),
      sort: 'newest',
      // Add any additional filters here
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  private async extractListingsFromPage(): Promise<RawListing[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const listings: RawListing[] = [];
      
      // Enhanced selectors for BizBuySell's structure
      const listingSelectors = [
        '.result-list-item',
        '.listing-item',
        '.business-listing-item',
        '.search-result',
        '.listing-card',
        '.business-card',
        '[class*="listing"]',
        '[class*="business"]',
        '[class*="result"]'
      ];
      
      let listingElements: NodeListOf<Element> | null = null;
      
      for (const selector of listingSelectors) {
        listingElements = document.querySelectorAll(selector);
        if (listingElements.length > 0) {
          console.log(`BizBuySell: Found ${listingElements.length} elements with selector: ${selector}`);
          break;
        }
      }
      
      if (!listingElements || listingElements.length === 0) {
        console.log('BizBuySell: No listing elements found, trying generic selectors');
        listingElements = document.querySelectorAll('div[class*="card"], div[class*="item"], article');
      }
      
      listingElements.forEach((element, index) => {
        try {
          // Enhanced name extraction
          const nameSelectors = [
            '.listing-title', '.business-name', 'h3 a', 'h2 a',
            'h1', 'h2', 'h3', 'h4', '.title', '.name',
            'a[title]', '.headline'
          ];
          
          let name = '';
          for (const selector of nameSelectors) {
            const nameEl = element.querySelector(selector);
            if (nameEl) {
              name = nameEl.textContent?.trim() || nameEl.getAttribute('title') || '';
              if (name.length > 3) break;
            }
          }
          
          // Enhanced price extraction
          const priceSelectors = [
            '.price', '.asking-price', '.list-price', '.sale-price',
            '.cost', '.value', '.amount', '[class*="price"]',
            '[class*="asking"]', '[class*="sale"]'
          ];
          
          let priceText = '';
          for (const selector of priceSelectors) {
            const priceEl = element.querySelector(selector);
            if (priceEl) {
              priceText = priceEl.textContent?.trim() || '';
              if (priceText.length > 0 && /[\d$]/.test(priceText)) break;
            }
          }
          
          // Enhanced revenue extraction
          const revenueSelectors = [
            '.revenue', '.annual-revenue', '.gross-revenue',
            '.profit', '.income', '.earnings', '.cash-flow',
            '[class*="revenue"]', '[class*="profit"]', '[class*="income"]',
            '[class*="earnings"]', '[class*="cash"]'
          ];
          
          let revenueText = '';
          for (const selector of revenueSelectors) {
            const revenueEl = element.querySelector(selector);
            if (revenueEl) {
              revenueText = revenueEl.textContent?.trim() || '';
              if (revenueText.length > 0 && /[\d$]/.test(revenueText)) break;
            }
          }
          
          // Try to extract revenue from text content
          if (!revenueText) {
            const fullText = element.textContent?.toLowerCase() || '';
            const revenuePatterns = [
              /revenue[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /gross[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /income[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /profit[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /cash\s*flow[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i
            ];
            
            for (const pattern of revenuePatterns) {
              const match = fullText.match(pattern);
              if (match) {
                revenueText = match[1];
                break;
              }
            }
          }
          
          // Enhanced location extraction
          const locationSelectors = [
            '.location', '.business-location', '.geography',
            '.region', '.city', '.state', '.area',
            '[class*="location"]', '[class*="geo"]'
          ];
          
          let location = '';
          for (const selector of locationSelectors) {
            const locationEl = element.querySelector(selector);
            if (locationEl) {
              location = locationEl.textContent?.trim() || '';
              if (location.length > 0) break;
            }
          }
          
          // Enhanced industry extraction
          const industrySelectors = [
            '.industry', '.business-type', '.category',
            '.sector', '.type', '.vertical', '.market',
            '[class*="category"]', '[class*="industry"]', '[class*="type"]'
          ];
          
          let industry = '';
          for (const selector of industrySelectors) {
            const industryEl = element.querySelector(selector);
            if (industryEl) {
              industry = industryEl.textContent?.trim() || '';
              if (industry.length > 0) break;
            }
          }
          
          // Enhanced description extraction
          const descriptionSelectors = [
            '.description', '.business-description', '.excerpt',
            '.summary', '.content', '.details', '.overview',
            'p', '[class*="description"]', '[class*="summary"]'
          ];
          
          let description = '';
          for (const selector of descriptionSelectors) {
            const descEl = element.querySelector(selector);
            if (descEl) {
              description = descEl.textContent?.trim() || '';
              if (description.length > 20) break;
            }
          }
          
          // Enhanced link extraction with multiple strategies to ensure we get valid URLs
          const linkSelectors = [
            'a[href*="/business-for-sale/"]',
            'a[href*="/listing/"]',
            'a.listing-title-link',
            'h3 a',
            'h2 a',
            '.title a',
            'a.view-listing',
            'a[href]'
          ];
          
          let originalUrl = '';
          for (const selector of linkSelectors) {
            const linkEl = element.querySelector(selector);
            if (linkEl) {
              originalUrl = linkEl.getAttribute('href') || '';
              if (originalUrl.length > 0) break;
            }
          }
          
          // If no specific link found, try to use the listing's canonical URL if available
          if (!originalUrl) {
            const canonicalLinkEl = document.querySelector('link[rel="canonical"]');
            if (canonicalLinkEl) {
              originalUrl = canonicalLinkEl.getAttribute('href') || '';
            }
          }
          
          // Generate a unique identifier from the name for fallback URL purposes
          const listingId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          
          // Image extraction
          const imageSelectors = [
            'img.listing-image',
            '.primary-image img',
            '.main-image img',
            '.listing-photo img',
            '.carousel-item img',
            'img[src*="listing"]',
            'img'
          ];
          
          let imageUrl = '';
          for (const selector of imageSelectors) {
            const imgEl = element.querySelector(selector);
            if (imgEl) {
              imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
              if (imageUrl.length > 0) break;
            }
          }
          
          // Log debugging info for first few listings
          if (index < 3) {
            console.log(`BizBuySell listing ${index + 1}:`, {
              name: name.substring(0, 50),
              price: priceText.substring(0, 30), // Renamed from priceText to avoid lint errors
              revenue: revenueText.substring(0, 30), // Renamed from revenueText to avoid lint errors
              location: location.substring(0, 30),
              industry: industry.substring(0, 30),
              url: originalUrl.substring(0, 60)
            });
          }

          // Only include meaningful listings
          if (name && name.length > 3 && (priceText || revenueText || description.length > 50)) {
            const askingPrice = this.parsePrice(priceText);
            const annualRevenue = this.parseRevenue(revenueText);
            
            // Process URL - ensure it's valid and complete
            let processedUrl = originalUrl;
            if (processedUrl && !processedUrl.startsWith('http')) {
              processedUrl = `https://www.bizbuysell.com${processedUrl.startsWith('/') ? '' : '/'}${processedUrl}`;
            }
            
            // If we still don't have a valid URL, create a fallback using the listing name and source
            if (!processedUrl || processedUrl.length < 10) {
              processedUrl = `https://www.bizbuysell.com/business-for-sale/${listingId}/`;
            }
            
            // Process image URL - ensure it's valid and complete
            let processedImageUrl = imageUrl;
            if (processedImageUrl && !processedImageUrl.startsWith('http')) {
              processedImageUrl = `https://www.bizbuysell.com${processedImageUrl.startsWith('/') ? '' : '/'}${processedImageUrl}`;
            }
            
            const listingData = {
              name,
              description: description || `${industry} business opportunity from BizBuySell`,
              askingPrice,
              annualRevenue,
              location: location || '',
              industry: industry || 'Business',
              source: 'BizBuySell',
              originalUrl: DataProcessor.ensureValidUrl(processedUrl, 'BizBuySell', listingId),
              imageUrl: processedImageUrl || undefined,
              scrapedAt: new Date(),
            };
            
            // Add to listings
            listings.push(listingData);
          }
        } catch (error) {
          console.warn('Error extracting listing:', error);
        }
      });

      return listings;
    });
  }

  private async hasNextPage(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const nextButton = await this.page.$('.pagination .next:not(.disabled), .pagination a[aria-label="Next"]');
      return nextButton !== null;
    } catch {
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Process the raw data extracted from the page
  private processListings(rawListings: RawListing[]): RawListing[] {
    const processedListings: RawListing[] = [];

    for (const raw of rawListings) {
      try {
        const processed: RawListing = {
          name: DataProcessor.cleanText(raw.name),
          description: raw.description ? DataProcessor.cleanText(raw.description) : undefined,
          askingPrice: DataProcessor.extractPrice(raw.priceText),
          annualRevenue: DataProcessor.extractRevenue(raw.revenueText),
          industry: DataProcessor.normalizeIndustry(raw.industry),
          location: DataProcessor.cleanText(raw.location),
          source: this.sourceName,
          highlights: DataProcessor.extractHighlights(raw.description || ''),
          imageUrl: DataProcessor.isValidUrl(raw.imageUrl || '') ? raw.imageUrl : undefined,
          originalUrl: DataProcessor.isValidUrl(raw.originalUrl || '') ? raw.originalUrl : undefined,
          scrapedAt: new Date(),
        };

        const validatedListing = DataProcessor.validateListing(processed);
        if (validatedListing) {
          processedListings.push(validatedListing);
          this.metrics.listingsFound++;
        }
      } catch (error) {
        logger.warn('Failed to process listing:', error);
      }
    }

    return processedListings;
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    return DataProcessor.extractPrice(priceText);
  }

  private parseRevenue(revenueText: string): number {
    if (!revenueText) return 0;
    return DataProcessor.extractRevenue(revenueText);
  }
}