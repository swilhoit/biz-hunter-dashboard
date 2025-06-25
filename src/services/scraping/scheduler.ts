import * as cron from 'node-cron';
import { ScrapingService } from './ScrapingService';
import logger from './utils/logger';

export interface ScheduleConfig {
  enabled: boolean;
  cronExpression: string; // e.g., '0 2 * * *' for daily at 2 AM
  maxPages?: number;
  delayBetweenRequests?: number;
}

export class ScrapingScheduler {
  private scrapingService: ScrapingService;
  private scheduledTask?: cron.ScheduledTask;
  private config: ScheduleConfig;

  constructor(config: ScheduleConfig) {
    this.scrapingService = new ScrapingService();
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled) {
      logger.info('Scraping scheduler is disabled');
      return;
    }

    if (this.scheduledTask) {
      logger.warn('Scraping scheduler is already running');
      return;
    }

    try {
      this.scheduledTask = cron.schedule(
        this.config.cronExpression,
        this.runScheduledScraping.bind(this),
        {
          scheduled: true,
          timezone: 'America/New_York', // Adjust timezone as needed
        }
      );

      logger.info(`Scraping scheduler started with expression: ${this.config.cronExpression}`);
    } catch (error) {
      logger.error('Failed to start scraping scheduler:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = undefined;
      logger.info('Scraping scheduler stopped');
    }
  }

  async runScheduledScraping(): Promise<void> {
    logger.info('Starting scheduled scraping session');

    try {
      const session = await this.scrapingService.scrapeAll({
        maxPages: this.config.maxPages || 3,
        delayBetweenRequests: this.config.delayBetweenRequests || 3000,
        headless: true,
      });

      if (session.status === 'completed') {
        logger.info(
          `Scheduled scraping completed successfully: ${session.totalListings} listings from ${session.sources.length} sources`
        );
      } else {
        logger.error(
          `Scheduled scraping failed with errors: ${session.errors.join(', ')}`
        );
      }
    } catch (error) {
      logger.error('Scheduled scraping session failed:', error);
    }
  }

  isRunning(): boolean {
    return this.scheduledTask?.getStatus() === 'scheduled';
  }

  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduler if it's running and config changed
    if (this.scheduledTask && (newConfig.cronExpression || newConfig.enabled !== undefined)) {
      this.stop();
      if (this.config.enabled) {
        this.start();
      }
    }
  }

  getConfig(): Readonly<ScheduleConfig> {
    return { ...this.config };
  }
}

// Factory function to create a default scheduler
export function createDefaultScheduler(): ScrapingScheduler {
  const config: ScheduleConfig = {
    enabled: process.env.SCRAPING_SCHEDULE_ENABLED === 'true',
    cronExpression: process.env.SCRAPING_CRON_EXPRESSION || '0 2 * * *', // Daily at 2 AM
    maxPages: parseInt(process.env.SCRAPING_MAX_PAGES || '3', 10),
    delayBetweenRequests: parseInt(process.env.SCRAPING_DELAY_MS || '3000', 10),
  };

  return new ScrapingScheduler(config);
}