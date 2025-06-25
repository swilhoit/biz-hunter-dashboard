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
  originalUrl: z.string().url().optional(),
  scrapedAt: z.date().default(() => new Date()),
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
      timeout: 30000,
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