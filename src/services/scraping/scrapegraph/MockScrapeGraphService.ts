/**
 * Mock ScrapeGraph Service for testing without credits
 */

export class MockScrapeGraphService {
  private apiKey: string;
  private config: any;
  
  constructor(config: any) {
    this.apiKey = config.apiKey;
    this.config = config;
    console.log('⚠️  Using MOCK ScrapeGraph Service (no API credits required)');
  }
  
  async checkCredits(): Promise<number> {
    return 0; // Mock: no credits
  }
  
  async scrapeSite(siteName: string, maxPages: number = 1): Promise<any[]> {
    console.log(`🎭 MOCK: Scraping ${siteName} (${maxPages} pages)...`);
    
    // Return mock data based on site
    const mockData: Record<string, any[]> = {
      quietlight: [
        {
          name: 'Premium Amazon FBA Business - Home & Kitchen',
          listingUrl: 'https://quietlight.com/listings/mock-123',
          askingPrice: 1250000,
          annualRevenue: 3200000,
          annualProfit: 980000,
          profitMultiple: 3.2,
          industry: 'E-commerce',
          description: 'Established Amazon FBA business selling premium kitchen products',
          isFBA: true,
          location: 'United States'
        },
        {
          name: 'FBA Pet Supplies Brand',
          listingUrl: 'https://quietlight.com/listings/mock-456',
          askingPrice: 850000,
          annualRevenue: 2100000,
          annualProfit: 420000,
          profitMultiple: 2.8,
          industry: 'E-commerce',
          description: 'Growing Amazon FBA brand in the pet supplies niche',
          isFBA: true,
          location: 'United States'
        }
      ],
      bizbuysell: [
        {
          name: 'Amazon FBA Electronics Accessories',
          listingUrl: 'https://bizbuysell.com/mock-789',
          askingPrice: 450000,
          annualRevenue: 1200000,
          industry: 'E-commerce',
          description: 'Profitable FBA business selling phone and tablet accessories',
          isFBA: true,
          location: 'California'
        }
      ],
      flippa: [
        {
          name: 'FBA Fitness Equipment Store',
          listingUrl: 'https://flippa.com/mock-321',
          askingPrice: 325000,
          monthlyRevenue: 85000,
          monthlyProfit: 28000,
          businessModel: 'E-commerce',
          niche: 'Fitness',
          isFBA: true
        }
      ],
      empireflippers: [
        {
          name: 'Amazon FBA Beauty Brand',
          listingUrl: 'https://empireflippers.com/listing/mock-654',
          askingPrice: 2100000,
          monthlyProfit: 65000,
          profitMultiple: 32,
          businessModel: 'FBA',
          niche: 'Beauty & Personal Care',
          isFBA: true
        }
      ]
    };
    
    await this.delay(1000); // Simulate API delay
    
    return mockData[siteName.toLowerCase()] || [];
  }
  
  async scrapeAllSites(maxPagesPerSite: number = 2): Promise<Record<string, any[]>> {
    const sites = ['quietlight', 'bizbuysell', 'flippa', 'empireflippers'];
    const results: Record<string, any[]> = {};
    
    for (const site of sites) {
      results[site] = await this.scrapeSite(site, maxPagesPerSite);
      await this.delay(500);
    }
    
    return results;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function createMockScrapeGraphService(): Promise<MockScrapeGraphService> {
  return new MockScrapeGraphService({
    apiKey: 'mock-key',
    verbose: true
  });
}