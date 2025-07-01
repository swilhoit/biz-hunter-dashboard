import { BizBuySellScraper } from './BizBuySellScraper';
import { QuietLightScraper } from './QuietLightScraper';
import { BizQuestScraper } from './BizQuestScraper';
import { FlipaScraper } from './FlipaScraper';
import { EmpireFlippersScraper } from './EmpireFlippersScraper';
import { ExitAdviserScraper } from './ExitAdviserScraper';
import { ScraperAPICenturicaScraper } from './ScraperAPICenturicaScraper';
import { BaseScraper, ScrapingConfig } from '../types';
import { ScraperName } from './index';

export const AVAILABLE_SCRAPERS = {
  'bizbuysell': BizBuySellScraper,
  'quietlight': QuietLightScraper,
  'bizquest': BizQuestScraper,
  'flippa': FlipaScraper,
  'empireflippers': EmpireFlippersScraper,
  'exitadviser': ExitAdviserScraper,
  'centurica': ScraperAPICenturicaScraper,
} as const;

export function createScraper(name: ScraperName, config?: ScrapingConfig): BaseScraper {
  const ScraperClass = AVAILABLE_SCRAPERS[name];
  if (!ScraperClass) {
    throw new Error(`Unknown scraper: ${name}`);
  }
  return new ScraperClass(config);
}

export function getAllScraperNames(): ScraperName[] {
  return Object.keys(AVAILABLE_SCRAPERS) as ScraperName[];
}

export function getScraperInfo() {
  return {
    bizbuysell: {
      name: 'BizBuySell',
      description: 'Amazon FBA businesses from BizBuySell.com',
      category: 'Amazon FBA',
    },
    quietlight: {
      name: 'QuietLight',
      description: 'Amazon FBA businesses from QuietLight Brokerage',
      category: 'Amazon FBA',
    },
    bizquest: {
      name: 'BizQuest',
      description: 'Amazon FBA businesses from BizQuest.com',
      category: 'Amazon FBA',
    },
    flippa: {
      name: 'Flippa',
      description: 'Amazon FBA businesses from Flippa.com',
      category: 'Amazon FBA',
    },
    empireflippers: {
      name: 'EmpireFlippers',
      description: 'Amazon FBA businesses from EmpireFlippers.com',
      category: 'Amazon FBA',
    },
    exitadviser: {
      name: 'ExitAdviser',
      description: 'Amazon FBA businesses from ExitAdviser.com',
      category: 'Amazon FBA',
    },
    centurica: {
      name: 'Centurica',
      description: 'Aggregated business listings from 30+ brokers via Centurica Marketwatch',
      category: 'Aggregator',
    },
  };
}