import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Debug environment variables
console.log('🔧 ScrapeGraph environment check:');
console.log('VITE_SCRAPEGRAPH_API_KEY:', process.env.VITE_SCRAPEGRAPH_API_KEY ? 'Set' : 'Missing');
console.log('SCRAPEGRAPH_API_KEY:', process.env.SCRAPEGRAPH_API_KEY ? 'Set' : 'Missing');

// Import the ScrapeGraph service (we'll need to compile TS first)
let ScrapeGraphService;
try {
  // Try to import compiled version
  const module = await import('../../dist/services/scraping/scrapegraph/ScrapeGraphService.js');
  ScrapeGraphService = module.ScrapeGraphService;
} catch (error) {
  console.warn('ScrapeGraphService not compiled, using mock implementation');
}

/**
 * ScrapeGraph AI-powered scraper
 * Conservative with API credits while providing comprehensive data
 */
class ScrapeGraphScraper {
  constructor(apiKey = process.env.SCRAPEGRAPH_API_KEY || process.env.VITE_SCRAPEGRAPH_API_KEY) {
    this.apiKey = apiKey;
    this.name = 'ScrapeGraph AI';
    
    if (!this.apiKey) {
      console.warn('⚠️  ScrapeGraph API key not found. Add VITE_SCRAPEGRAPH_API_KEY to .env');
    }
  }
  
  /**
   * Scrape business listings using ScrapeGraph AI
   */
  async scrapeListings(options = {}) {
    const {
      sites = ['quietlight', 'bizbuysell'], // Default to fewer sites to conserve credits
      maxPagesPerSite = 1, // Conservative default
      query = 'amazon fba ecommerce'
    } = options;
    
    console.log(`🤖 ScrapeGraph AI: Starting scrape for ${sites.join(', ')}`);
    console.log(`   Max pages per site: ${maxPagesPerSite}`);
    console.log(`   Query: ${query}`);
    
    const allListings = [];
    const errors = [];
    
    // If we don't have the compiled service, use the REST API directly
    if (!ScrapeGraphService) {
      return this.scrapeUsingAPI(sites, maxPagesPerSite, query);
    }
    
    try {
      const service = new ScrapeGraphService({
        apiKey: this.apiKey,
        verbose: true,
        delayBetweenRequests: 3000,
        maxPages: maxPagesPerSite
      });
      
      // Scrape each site
      for (const site of sites) {
        try {
          console.log(`\n🔍 Scraping ${site}...`);
          const listings = await service.scrapeSite(site, maxPagesPerSite);
          
          // Convert to our standard format
          const formattedListings = listings.map(listing => ({
            name: listing.name || 'Unknown Business',
            description: listing.description || '',
            askingPrice: this.parsePrice(listing.askingPrice),
            revenue: this.parsePrice(listing.annualRevenue || listing.monthlyRevenue),
            cashFlow: this.parsePrice(listing.annualProfit),
            multiple: this.parseMultiple(listing.profitMultiple),
            location: listing.location || '',
            url: listing.listingUrl || '',
            source: this.mapSourceName(site),
            industry: listing.industry || listing.niche || '',
            dateListed: listing.dateListed || new Date().toISOString(),
            // Add FBA indicator
            isFBA: listing.isFBA || this.checkIfFBA(listing)
          }));
          
          allListings.push(...formattedListings);
          console.log(`✅ Found ${formattedListings.length} listings from ${site}`);
          
        } catch (error) {
          console.error(`❌ Error scraping ${site}:`, error.message);
          errors.push({ site, error: error.message });
        }
        
        // Delay between sites to be respectful
        if (sites.indexOf(site) < sites.length - 1) {
          await this.delay(5000);
        }
      }
      
    } catch (error) {
      console.error('❌ ScrapeGraph service error:', error);
      errors.push({ error: error.message });
    }
    
    // Summary
    console.log(`\n📊 ScrapeGraph Summary:`);
    console.log(`   Total listings: ${allListings.length}`);
    console.log(`   FBA listings: ${allListings.filter(l => l.isFBA).length}`);
    console.log(`   Errors: ${errors.length}`);
    
    return {
      listings: allListings,
      errors,
      summary: {
        total: allListings.length,
        fbaCount: allListings.filter(l => l.isFBA).length,
        bySource: this.groupBySource(allListings)
      }
    };
  }
  
  /**
   * Check if we have credits available
   */
  async checkCredits() {
    if (!this.apiKey) return false;
    
    try {
      const { default: axios } = await import('axios');
      const response = await axios.get('https://api.scrapegraphai.com/v1/credits', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const credits = response.data.credits || 0;
      console.log(`💳 ScrapeGraph credits available: ${credits}`);
      return credits > 0;
    } catch (error) {
      if (error.response && error.response.status === 402) {
        console.log('⚠️  No ScrapeGraph credits available');
        return false;
      }
      console.error('Error checking credits:', error.message);
      return false;
    }
  }
  
  /**
   * Fallback: Return empty results when no credits or API unavailable
   */
  async scrapeUsingAPI(sites, maxPages, query) {
    console.log('⚠️  No ScrapeGraph credits or API unavailable - returning empty results');
    
    return {
      listings: [],
      errors: ['No ScrapeGraph credits available or API unavailable'],
      summary: {
        total: 0,
        fbaCount: 0,
        bySource: {}
      }
    };
  }
  
  // Helper methods
  parsePrice(value) {
    if (!value) return null;
    if (typeof value === 'number') return value;
    
    const str = value.toString().replace(/[$,]/g, '');
    let multiplier = 1;
    
    if (str.includes('M') || str.includes('m')) {
      multiplier = 1000000;
    } else if (str.includes('K') || str.includes('k')) {
      multiplier = 1000;
    }
    
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return isNaN(num) ? null : Math.round(num * multiplier);
  }
  
  parseMultiple(value) {
    if (!value) return null;
    const str = value.toString().replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
  
  mapSourceName(site) {
    const mapping = {
      'quietlight': 'QuietLight',
      'bizbuysell': 'BizBuySell',
      'flippa': 'Flippa',
      'empireflippers': 'Empire Flippers',
      'bizquest': 'BizQuest'
    };
    return mapping[site.toLowerCase()] || site;
  }
  
  checkIfFBA(listing) {
    const fbaKeywords = ['amazon', 'fba', 'amz', 'fulfillment by amazon', 'amazon seller'];
    const searchText = `${listing.name} ${listing.description}`.toLowerCase();
    return fbaKeywords.some(keyword => searchText.includes(keyword));
  }
  
  groupBySource(listings) {
    return listings.reduce((acc, listing) => {
      acc[listing.source] = (acc[listing.source] || 0) + 1;
      return acc;
    }, {});
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ScrapeGraphScraper;