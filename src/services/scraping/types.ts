import { z } from 'zod';

export const RawListingSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  askingPrice: z.number().positive(),
  annualRevenue: z.number().nonnegative(),
  industry: z.string(),
  location: z.string(),
  source: z.string(),
  highlights: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  originalUrl: z.string().url(),
  scrapedAt: z.date().default(() => new Date()),
  
  // Enhanced fields for Centurica aggregator data
  businessModel: z.string().optional(),
  niche: z.string().optional(),
  grossRevenue: z.number().nonnegative().optional(),
  netRevenue: z.number().nonnegative().optional(),
  inventoryValue: z.number().nonnegative().optional(),
  profitMultiple: z.number().optional(),
  rIndex: z.number().int().optional(),
  provider: z.string().optional(),
  sbaQualified: z.boolean().optional(),
  booposQualified: z.boolean().optional(),
  listingDate: z.date().optional(),
  priceReduced: z.boolean().optional(),
  underOffer: z.boolean().optional(),
  newListing: z.boolean().optional(),
  monthlyRevenue: z.number().nonnegative().optional(),
  annualProfit: z.number().optional(),
  employees: z.number().int().optional(),
  establishedYear: z.number().int().optional(),
  growthRate: z.number().optional(),
  trafficSources: z.array(z.string()).optional(),
  technologyStack: z.array(z.string()).optional(),
  monetizationModel: z.string().optional(),
});

export type RawListing = z.infer<typeof RawListingSchema>;

export interface ScrapingResult {
  success: boolean;
  listings: RawListing[];
  errors?: string[];
  totalFound?: number;
  totalScraped?: number;
}

export interface ScrapingConfig {
  maxPages?: number;
  delayBetweenRequests?: number;
  headless?: boolean;
  userAgent?: string;
  timeout?: number;
}

export interface ScraperMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  listingsFound: number;
  errors: string[];
}

export abstract class BaseScraper {
  protected config: ScrapingConfig;
  protected metrics: ScraperMetrics;
  abstract readonly sourceName: string;

  constructor(config: ScrapingConfig = {}) {
    this.config = {
      maxPages: 5,
      delayBetweenRequests: 2000,
      headless: true,
      timeout: 90000,
      ...config,
    };
    
    this.metrics = {
      startTime: new Date(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      listingsFound: 0,
      errors: [],
    };
  }
  
  // Public method to update configuration
  updateConfig(config: Partial<ScrapingConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  abstract scrape(): Promise<ScrapingResult>;

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected recordSuccess(): void {
    this.metrics.successfulRequests++;
    this.metrics.totalRequests++;
  }

  protected recordFailure(error: string): void {
    this.metrics.failedRequests++;
    this.metrics.totalRequests++;
    this.metrics.errors.push(error);
  }

  protected finishMetrics(): void {
    this.metrics.endTime = new Date();
    this.metrics.duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
  }

  getMetrics(): Readonly<ScraperMetrics> {
    return { ...this.metrics };
  }
}