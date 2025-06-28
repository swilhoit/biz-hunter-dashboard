import { BizBuySellScraper } from './BizBuySellScraper';
import { QuietLightScraper } from './QuietLightScraper';
import { AcquireScraper } from './AcquireScraper';
import { BizQuestScraper } from './BizQuestScraper';
import { MicroAcquireScraper } from './MicroAcquireScraper';
import { FlipaScraper } from './FlipaScraper';
import { EmpireFlippersScraper } from './EmpireFlippersScraper';
import { ExitAdviserScraper } from './ExitAdviserScraper';
import { BaseScraper, ScrapingConfig } from '../types';
import { ScraperName } from './index';

export const AVAILABLE_SCRAPERS = {
  'bizbuysell': BizBuySellScraper,
  'quietlight': QuietLightScraper,
  'acquire': AcquireScraper,
  'bizquest': BizQuestScraper,
  'microacquire': MicroAcquireScraper,
  'flippa': FlipaScraper,
  'empireflippers': EmpireFlippersScraper,
  'exitadviser': ExitAdviserScraper,
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
      description: 'Business listings from BizBuySell.com',
      category: 'Traditional Business',
    },
    quietlight: {
      name: 'QuietLight',
      description: 'Digital business listings from QuietLight Brokerage',
      category: 'Digital Business',
    },
    acquire: {
      name: 'Acquire',
      description: 'Startup acquisitions from Acquire.com',
      category: 'Startup',
    },
    bizquest: {
      name: 'BizQuest',
      description: 'Business opportunities from BizQuest.com',
      category: 'Traditional Business',
    },
    microacquire: {
      name: 'MicroAcquire',
      description: 'Micro-SaaS and small startup acquisitions',
      category: 'Micro SaaS',
    },
    flippa: {
      name: 'Flippa',
      description: 'Website and digital asset marketplace',
      category: 'Digital Asset',
    },
    empireflippers: {
      name: 'EmpireFlippers',
      description: 'Online business marketplace from EmpireFlippers.com',
      category: 'Digital Business',
    },
    exitadviser: {
      name: 'ExitAdviser',
      description: 'Business for sale listings from ExitAdviser.com',
      category: 'Small Business',
    },
  };
}