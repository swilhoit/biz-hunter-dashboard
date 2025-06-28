import { chromium, Browser, Page } from 'playwright';
import { BaseScraper, ScrapingResult, RawListing } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import logger from '../utils/logger';

export class QuietLightScraper extends BaseScraper {
  readonly sourceName = 'QuietLight';
  private browser?: Browser;
  private page?: Page;

  async scrape(): Promise<ScrapingResult> {
    logger.info('Starting QuietLight scraping session');
    
    try {
      await this.initBrowser();
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
        logger.info(`Scraping QuietLight page ${currentPage}`);
        
        const url = this.buildSearchUrl(currentPage);
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 
        });
        
        // Wait for any content to load - try multiple selectors
        try {
          await this.page.waitForSelector('article, .post, .listing-card, .business-card, body', { timeout: 10000 });
        } catch (error) {
          logger.warn(`Page ${currentPage}: No content selectors found, continuing...`);
        }
        
        const rawPageListings = await this.extractListingsFromPage();
        const processedPageListings = this.processListings(rawPageListings);
        listings.push(...processedPageListings);
        
        this.recordSuccess();
        logger.info(`Page ${currentPage}: ${processedPageListings.length} listings extracted`);
        
        const hasNextPage = await this.hasNextPage();
        if (!hasNextPage) {
          logger.info('No more pages available');
          break;
        }
        
        currentPage++;
        await this.delay(this.config.delayBetweenRequests || 3000);
        
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
    // FIXED: Use the working QuietLight URL structure
    if (page === 1) {
      return 'https://quietlight.com/listings/';
    }
    return `https://quietlight.com/listings/page/${page}/`;
  }

  private async extractListingsFromPage(): Promise<RawListing[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const listings: RawListing[] = [];
      
      // Enhanced selectors for QuietLight's actual structure
      const listingSelectors = [
        'article.business-card',
        '.business-listing',
        '.listing-item',
        '.business-card',
        'article',
        '.post',
        '[class*="business"]',
        '[class*="listing"]',
        '.property-card',
        '.opportunity-card'
      ];
      
      let listingElements: NodeListOf<Element> | null = null;
      
      for (const selector of listingSelectors) {
        listingElements = document.querySelectorAll(selector);
        if (listingElements.length > 0) {
          console.log(`QuietLight: Found ${listingElements.length} elements with selector: ${selector}`);
          break;
        }
      }
      
      if (!listingElements || listingElements.length === 0) {
        console.log('QuietLight: No listing elements found, trying generic selectors');
        listingElements = document.querySelectorAll('div[class*="card"], div[class*="item"], div[class*="box"]');
      }
      
      listingElements.forEach((element, index) => {
        try {
          // Enhanced name extraction
          const nameSelectors = [
            '.listing-title',
            '.business-name', 
            '.opportunity-title',
            '.title',
            'h1', 'h2', 'h3', 'h4',
            '.name',
            'a[title]',
            '.headline'
          ];
          
          let nameEl: Element | null = null;
          let name = '';
          
          for (const selector of nameSelectors) {
            nameEl = element.querySelector(selector);
            if (nameEl) {
              name = nameEl.textContent?.trim() || nameEl.getAttribute('title') || '';
              if (name.length > 3) break; // Found a good name
            }
          }
          
          // Enhanced price extraction
          const priceSelectors = [
            '.price', '.asking-price', '.valuation', '.sale-price',
            '.cost', '.value', '.amount', '[class*="price"]',
            '[class*="valuation"]', '[class*="asking"]'
          ];
          
          let priceText = '';
          for (const selector of priceSelectors) {
            const priceEl = element.querySelector(selector);
            if (priceEl) {
              priceText = priceEl.textContent?.trim() || '';
              if (priceText.length > 0) break;
            }
          }
          
          // Enhanced revenue extraction with more specific selectors
          const revenueSelectors = [
            '.revenue', '.annual-revenue', '.net-profit', '.earnings',
            '.mrr', '.arr', '.monthly-revenue', '.gross-revenue',
            '.profit', '.income', '[class*="revenue"]', '[class*="profit"]',
            '[class*="earnings"]', '[class*="mrr"]', '[class*="arr"]'
          ];
          
          let revenueText = '';
          for (const selector of revenueSelectors) {
            const revenueEl = element.querySelector(selector);
            if (revenueEl) {
              revenueText = revenueEl.textContent?.trim() || '';
              if (revenueText.length > 0) break;
            }
          }
          
          // CRITICAL: Extract price and revenue from the listing NAME/TITLE since QuietLight puts financial data there
          if (!priceText || !revenueText) {
            const titleText = name.toLowerCase();
            
            // Enhanced patterns for QuietLight's title format: "$17.4M Revenue | $2.56M SDE"
            const financialPatterns = [
              // Revenue patterns - more specific
              /\$?([\d.]+[km]?)\s*revenue/i,
              /revenue[:\s|\|]+\$?([\d.]+[km]?)/i,
              
              // SDE/Profit patterns (often more reliable than revenue)
              /\$?([\d.]+[km]?)\s*sde/i,
              /sde[:\s|\|]+\$?([\d.]+[km]?)/i,
              
              // Price/Asking patterns
              /asking[:\s|\|]+\$?([\d.]+[km]?)/i,
              /price[:\s|\|]+\$?([\d.]+[km]?)/i,
              /\$?([\d.]+[km]?)\s*asking/i,
              
              // MRR patterns
              /mrr[:\s|\|]+\$?([\d.]+[km]?)/i,
              /\$?([\d.]+[km]?)\s*mrr/i,
              
              // Profit patterns
              /profit[:\s|\|]+\$?([\d.]+[km]?)/i,
              /\$?([\d.]+[km]?)\s*profit/i,
              
              // General money patterns (as fallback) - more restrictive
              /\$(\d+(?:\.\d+)?[km])\b/i
            ];
            
            for (const pattern of financialPatterns) {
              const match = titleText.match(pattern);
              if (match && match[1]) {
                const value = match[1];
                // Determine if this is likely revenue or price based on context
                if (pattern.source.includes('revenue') || pattern.source.includes('sde') || pattern.source.includes('mrr') || pattern.source.includes('profit')) {
                  if (!revenueText) revenueText = value;
                } else if (pattern.source.includes('asking') || pattern.source.includes('price')) {
                  if (!priceText) priceText = value;
                } else {
                  // General money pattern - use as revenue if we don't have one
                  if (!revenueText) revenueText = value;
                }
              }
            }
          }
          
          // Also try to extract from full text content if still missing
          if (!revenueText) {
            const fullText = element.textContent?.toLowerCase() || '';
            const revenuePatterns = [
              /revenue[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /profit[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /mrr[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /arr[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i,
              /earnings[:\s]*\$?([\d,]+(?:\.\d{2})?[km]?)/i
            ];
            
            for (const pattern of revenuePatterns) {
              const match = fullText.match(pattern);
              if (match) {
                revenueText = match[1];
                break;
              }
            }
          }
          
          // Location extraction
          const locationSelectors = [
            '.location', '.business-location', '.geography',
            '.region', '.country', '.area', '[class*="location"]'
          ];
          
          let location = '';
          for (const selector of locationSelectors) {
            const locationEl = element.querySelector(selector);
            if (locationEl) {
              location = locationEl.textContent?.trim() || '';
              if (location.length > 0) break;
            }
          }
          
          // Industry extraction
          const industrySelectors = [
            '.industry', '.niche', '.category', '.sector',
            '.type', '.vertical', '.market', '[class*="category"]',
            '[class*="industry"]', '[class*="niche"]'
          ];
          
          let industry = '';
          for (const selector of industrySelectors) {
            const industryEl = element.querySelector(selector);
            if (industryEl) {
              industry = industryEl.textContent?.trim() || '';
              if (industry.length > 0) break;
            }
          }
          
          // Description extraction
          const descriptionSelectors = [
            '.description', '.summary', '.excerpt', '.business-description',
            '.content', '.details', '.overview', 'p',
            '[class*="description"]', '[class*="summary"]'
          ];
          
          let description = '';
          for (const selector of descriptionSelectors) {
            const descEl = element.querySelector(selector);
            if (descEl) {
              description = descEl.textContent?.trim() || '';
              if (description.length > 20) break; // Found substantial description
            }
          }
          
          // Link extraction
          const linkSelectors = [
            'a[href*="/listing/"]', 'a[href*="/business/"]',
            'a[href*="/property/"]', 'a[href*="/opportunity/"]',
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
          
          // Image extraction
          const imageEl = element.querySelector('img');
          const imageUrl = imageEl?.getAttribute('src') || imageEl?.getAttribute('data-src') || '';
          
          // Multiple/valuation extraction
          const multipleEl = element.querySelector('.multiple, .valuation-multiple');
          const multipleText = multipleEl?.textContent?.trim() || '';
          
          // Log what we found for debugging
          if (index < 3) { // Only log first 3 for debugging
            console.log(`QuietLight listing ${index + 1}:`, {
              name: name.substring(0, 50),
              priceText: priceText.substring(0, 30),
              revenueText: revenueText.substring(0, 30),
              location: location.substring(0, 30),
              industry: industry.substring(0, 30)
            });
          }

          // Only include listings with meaningful data
          if (name && name.length > 3 && (priceText || revenueText || description.length > 50)) {
            listings.push({
              name,
              priceText, // Pass raw text for processing
              revenueText, // Pass raw text for processing
              description: description || `${industry} business opportunity from QuietLight`,
              location: location || 'Remote',
              industry: industry || 'Digital Business',
              source: 'QuietLight',
              originalUrl: originalUrl.startsWith('http') ? originalUrl : `https://quietlight.com${originalUrl}`,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `https://quietlight.com${imageUrl}` : undefined),
              scrapedAt: new Date(),
            });
          }
        } catch (error) {
          console.warn('Error extracting QuietLight listing:', error);
        }
      });

      return listings;
    });
  }

  private async hasNextPage(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const nextButton = await this.page.$('.pagination .next:not(.disabled), .pagination a[rel="next"], .load-more:not(.disabled)');
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
        logger.warn('Failed to process QuietLight listing:', error);
      }
    }

    return processedListings;
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    
    // Use the enhanced data processor
    return DataProcessor.extractPrice(priceText);
  }

  private parseRevenue(revenueText: string): number {
    if (!revenueText) return 0;
    
    // Use the enhanced data processor
    return DataProcessor.extractRevenue(revenueText);
  }
}