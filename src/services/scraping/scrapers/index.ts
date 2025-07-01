// Client-safe exports - types only
export type ScraperName = 'bizbuysell' | 'quietlight' | 'bizquest' | 'flippa' | 'empireflippers' | 'exitadviser' | 'centurica';

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