# BizHunter Scraping System

A comprehensive multi-source business listing scraper that aggregates data from popular business directories.

## 🚀 Available Scrapers

| Scraper | Source | Category | Description |
|---------|--------|----------|-------------|
| **BizBuySell** | bizbuysell.com | Traditional Business | Established business marketplace |
| **QuietLight** | quietlight.com | Digital Business | Digital business brokerage |
| **Acquire** | acquire.com | Startup | Startup acquisition marketplace |
| **BizQuest** | bizquest.com | Traditional Business | Business opportunities |
| **MicroAcquire** | microacquire.com | Micro SaaS | Small SaaS and tech startups |
| **Flippa** | flippa.com | Digital Asset | Website and domain marketplace |

## 📋 Features

- **Multi-source scraping**: Aggregate listings from 6+ popular business directories
- **Custom scraping logic**: Each scraper is tailored to its source's specific structure
- **Database integration**: Automatic saving to Supabase with duplicate prevention
- **Comprehensive data**: Name, price, revenue, industry, location, descriptions, and more
- **Error handling**: Robust error tracking and retry mechanisms
- **Rate limiting**: Built-in delays to respect website policies
- **Validation**: Schema validation for all scraped data
- **Metrics tracking**: Performance monitoring for each scraper

## 🛠 Installation

The scraping system is already integrated into the main project. Required dependencies:

- `playwright` - Browser automation
- `winston` - Logging
- `zod` - Data validation
- `@supabase/supabase-js` - Database integration

## 📖 Usage

### Command Line Interface

```bash
# Test all scrapers
node run-scraper.js

# Test a specific scraper
node run-scraper.js quietlight
node run-scraper.js flippa

# Show help
node run-scraper.js --help
```

### NPM Scripts

```bash
# Test all scrapers
npm run test:scrapers

# Test specific scraper
npm run test:scraper:single quietlight
```

### Programmatic Usage

```typescript
import { ScraperManager } from './src/services/scraping/ScraperManager';
import { DatabaseService } from './src/services/scraping/DatabaseService';

const scraperManager = new ScraperManager();
const dbService = new DatabaseService();

// Scrape all sources
const session = await scraperManager.scrapeAll({
  maxPages: 3,
  delayBetweenRequests: 2000,
  headless: true
});

// Save to database
const allListings = scraperManager.getAllListings();
await dbService.saveListings(allListings);

// Scrape single source
const result = await scraperManager.scrapeOne('quietlight', {
  maxPages: 1,
  headless: false
});
```

## ⚙️ Configuration

```typescript
interface ScrapingConfig {
  maxPages?: number;           // Max pages to scrape (default: 5)
  delayBetweenRequests?: number; // Delay in ms (default: 2000)
  headless?: boolean;          // Run browser headlessly (default: true)
  userAgent?: string;          // Custom user agent
  timeout?: number;            // Page timeout in ms (default: 30000)
}
```

## 📊 Database Schema

Listings are saved to the `business_listings` table:

```sql
CREATE TABLE business_listings (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    asking_price BIGINT,
    annual_revenue BIGINT,
    industry TEXT,
    location TEXT,
    description TEXT,
    highlights TEXT,
    original_url TEXT,
    image_url TEXT,
    source TEXT NOT NULL,
    scraped_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Adding New Scrapers

1. Create a new scraper class extending `BaseScraper`:

```typescript
import { BaseScraper, ScrapingResult, RawListing } from '../types';

export class NewSiteScraper extends BaseScraper {
  readonly sourceName = 'NewSite';
  
  async scrape(): Promise<ScrapingResult> {
    // Implementation
  }
}
```

2. Add to the scrapers index:

```typescript
// src/services/scraping/scrapers/index.ts
export { NewSiteScraper } from './NewSiteScraper';

export const AVAILABLE_SCRAPERS = {
  // ... existing scrapers
  'newsite': NewSiteScraper,
};
```

3. Update the scraper info:

```typescript
export function getScraperInfo() {
  return {
    // ... existing scrapers
    newsite: {
      name: 'New Site',
      description: 'Description of the new site',
      category: 'Category',
    },
  };
}
```

## 🐛 Debugging

### Common Issues

1. **Selector not found**: Update CSS selectors in `extractListingsFromPage()`
2. **Rate limiting**: Increase `delayBetweenRequests` in config
3. **Timeout errors**: Increase `timeout` or use `headless: false` for debugging

### Debug Mode

```bash
# Run with visible browser for debugging
node run-scraper.js quietlight --debug
```

### Logs

- Error logs: `logs/scraping-error.log`
- Combined logs: `logs/scraping-combined.log`
- Console output in development mode

## 📈 Performance

- **Concurrent scraping**: All scrapers run in parallel
- **Efficient selectors**: Optimized CSS selectors for each site
- **Memory management**: Browser instances properly cleaned up
- **Database optimization**: Bulk upserts with conflict resolution

## 🔒 Legal & Ethical Considerations

- **Rate limiting**: Built-in delays respect website policies
- **User agent**: Proper identification as automated tool
- **robots.txt**: Manual compliance checking recommended
- **Terms of service**: Review each site's ToS before scraping
- **Data usage**: Only for business research and acquisition purposes

## 📞 Support

For issues or questions:
1. Check the logs for detailed error information
2. Verify website selectors haven't changed
3. Test with `headless: false` to see browser behavior
4. Update scraper selectors if site structure changed

---

*Last updated: 2025-06-27*