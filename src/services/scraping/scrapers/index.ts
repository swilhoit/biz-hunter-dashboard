// Client-safe exports - types only
export type ScraperName = 'bizbuysell' | 'quietlight' | 'acquire' | 'bizquest' | 'microacquire' | 'flippa' | 'empireflippers' | 'exitadviser';

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
  };
}