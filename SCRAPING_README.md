# BizHunter Scraping System

A comprehensive web scraping system for aggregating business listings from popular marketplace sites.

## Features

### ✅ Implemented
- **Multi-source scraping architecture** with extensible scraper design
- **BizBuySell scraper** - fully functional scraper for BizBuySell.com
- **Data validation and normalization** using Zod schemas
- **Supabase integration** for storing scraped listings
- **React UI components** for triggering and monitoring scraping
- **Scheduled scraping** with cron-based automation
- **Comprehensive logging** with Winston
- **Rate limiting and error handling**
- **Test suite** for validation

### 🚧 Pending (Future Enhancements)
- Flippa scraper implementation
- Empire Flippers scraper implementation

## Architecture

```
src/services/scraping/
├── types.ts              # Type definitions and base scraper class
├── ScrapingService.ts     # Main service coordinator
├── scheduler.ts           # Automated scheduling
├── scrapers/
│   └── BizBuySellScraper.ts
├── utils/
│   ├── logger.ts          # Winston logging setup
│   └── dataProcessor.ts   # Data cleaning and validation
└── test-scraper.ts        # Test utilities
```

## Usage

### 1. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
SCRAPING_SCHEDULE_ENABLED=true
SCRAPING_CRON_EXPRESSION="0 2 * * *"  # Daily at 2 AM
SCRAPING_MAX_PAGES=3
SCRAPING_DELAY_MS=3000
```

### 2. Manual Scraping via UI
1. Open the dashboard
2. Click the "Admin" button in the filters section  
3. Use the scraping panel to trigger manual scraping

### 3. Programmatic Usage
```typescript
import { ScrapingService } from './services/scraping';

const service = new ScrapingService();

// Scrape all sources
const session = await service.scrapeAll({
  maxPages: 2,
  delayBetweenRequests: 3000
});

// Scrape specific source
const result = await service.scrapeSource('bizbuysell');
```

### 4. Testing
```bash
npm run test:scraper
```

### 5. Scheduled Scraping
```typescript
import { createDefaultScheduler } from './services/scraping/scheduler';

const scheduler = createDefaultScheduler();
scheduler.start(); // Runs based on cron expression
```

## Data Flow

1. **Scraper** extracts raw data from business listing sites
2. **DataProcessor** cleans and normalizes the data
3. **Validation** ensures data quality using Zod schemas
4. **Database** stores validated listings in Supabase
5. **UI** displays aggregated listings to users

## Key Components

### BaseScraper
Abstract base class providing:
- Rate limiting and delays
- Error handling and metrics
- Configurable scraping parameters

### ScrapingService  
Coordinates multiple scrapers:
- Manages scraping sessions
- Handles database persistence
- Provides unified API

### ScrapingPanel (React)
UI component for:
- Triggering manual scraping
- Monitoring scraping progress
- Displaying session results

## Browser Automation

Uses **Playwright** for robust browser automation:
- Handles JavaScript-heavy sites
- Bypasses basic anti-bot measures
- Configurable headless/headed mode
- Automatic browser management

## Data Schema

Scraped listings conform to:
```typescript
interface RawListing {
  name: string;
  description?: string;
  askingPrice: number;
  annualRevenue: number;
  industry: string;
  location: string;
  source: string;
  highlights: string[];
  imageUrl?: string;
  originalUrl?: string;
  scrapedAt: Date;
}
```

## Rate Limiting & Ethics

- Configurable delays between requests (default: 3s)
- Respects robots.txt guidelines
- Implements reasonable rate limits
- Uses proper user agents

## Monitoring & Logging

- Comprehensive logging with Winston
- Scraping metrics and performance tracking
- Error reporting and debugging info
- Session tracking and history

## Next Steps

1. **Add more scrapers**: Implement Flippa and Empire Flippers scrapers
2. **Enhanced scheduling**: Add web-based schedule management
3. **Data enrichment**: Add additional data sources and validation
4. **Performance optimization**: Implement parallel scraping and caching
5. **Monitoring dashboard**: Real-time scraping status and metrics

## Dependencies

- **Playwright**: Browser automation
- **Cheerio**: HTML parsing (backup)
- **Winston**: Logging
- **node-cron**: Scheduling
- **Zod**: Data validation
- **Axios**: HTTP requests