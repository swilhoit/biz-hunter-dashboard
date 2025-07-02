# ScrapeGraph AI Integration

This document describes the ScrapeGraph AI alternative scraping implementation for the FBA Hunter Dashboard.

## Overview

ScrapeGraphAI is an AI-powered web scraping solution that uses LLMs to intelligently extract structured data from websites. It's integrated as an alternative to traditional HTML parsing scrapers, providing:

- **Intelligent extraction**: AI understands context and can adapt to website changes
- **Consistent schema**: Detailed prompts ensure predictable data structure
- **Credit efficiency**: Conservative settings to minimize API usage
- **Multi-site support**: Handles QuietLight, BizBuySell, Flippa, Empire Flippers

## Setup

### 1. Get API Key

1. Visit https://scrapegraphai.com/
2. Sign up for an account
3. Copy your API key from the dashboard

### 2. Configure Environment

Add to your `.env` file:

```bash
# ScrapeGraph AI Configuration
VITE_SCRAPEGRAPH_API_KEY=your_api_key_here

# Optional: Traditional scraper fallback
SCRAPER_API_KEY=your_scraper_api_key_here
```

### 3. Install Dependencies

```bash
npm install scrapegraph-js dotenv
```

## Usage

### Via Scraping Server (Recommended)

The scraping server automatically tries ScrapeGraph first if configured:

```bash
# Start the scraping server
cd server && node index.js

# In another terminal, trigger scraping via the UI
# Click "Check for New Listings" button on the Feed page
```

### Manual Testing

Test ScrapeGraph directly:

```bash
# Test single site
npm run test:scrapegraph single quietlight 2

# Test all sites (conservative)
npm run test:scrapegraph all 1

# Check API credits
npm run test:scrapegraph credits
```

### Programmatic Usage

```javascript
import { createScrapeGraphService } from './services/scraping/scrapegraph/ScrapeGraphService';

// Initialize service
const scraper = await createScrapeGraphService();

// Scrape specific site
const listings = await scraper.scrapeSite('quietlight', 2);

// Scrape all configured sites
const allResults = await scraper.scrapeAllSites(1);
```

## Architecture

### Components

1. **ScrapeGraphService.ts**
   - Main service class with site configurations
   - Handles API calls and response parsing
   - Saves results to Supabase database

2. **ScrapeGraphUniversalScraper.ts**
   - Adapter for existing scraper infrastructure
   - Compatible with BaseScraper interface
   - Enables drop-in replacement

3. **scrapegraph-scraper.js**
   - Server-side integration
   - Fallback handling
   - Format conversion

### Data Flow

```
User clicks "Check for New Listings"
    ↓
Server receives /api/scrape request
    ↓
Checks for ScrapeGraph API key
    ↓
If available: Uses ScrapeGraph AI
If not: Falls back to traditional scrapers
    ↓
Extracts business listings
    ↓
Validates and deduplicates
    ↓
Saves to Supabase database
    ↓
Returns results to UI
```

## Prompting Strategy

The system uses detailed, schema-specific prompts to ensure consistent extraction:

```javascript
const prompt = `Extract ALL business listings from this page. For EACH listing, extract:
  - listingUrl: The FULL URL to the listing detail page
  - name: Business name or title
  - askingPrice: The asking price (convert to number)
  - annualRevenue: Annual revenue if shown
  - annualProfit: Annual profit/earnings if shown
  - profitMultiple: The profit multiple (e.g., "3.5x")
  - industry: Business type/industry
  - description: Brief description
  - isFBA: true if it mentions Amazon FBA, false otherwise
  
Return ONLY valid JSON with a "listings" array.`;
```

## Site Configurations

### QuietLight
- URL: `https://quietlight.com/listings/`
- Focus: Premium online businesses, many FBA
- Special handling for listing IDs

### BizBuySell
- URL: `https://www.bizbuysell.com/business-opportunities/?q=amazon+fba`
- Pagination: Page-based
- Large marketplace with filtering

### Flippa
- URL: `https://flippa.com/search?filter[monetization]=ecommerce`
- Focus: Digital assets and online businesses
- Auction and fixed-price listings

### Empire Flippers
- URL: `https://empireflippers.com/marketplace/`
- Curated listings with detailed vetting
- Premium FBA businesses

## Credit Management

To conserve API credits:

1. **Default Settings**:
   - Max 2 pages per site
   - Only top 5 listings get detail enrichment
   - 3-second delay between requests

2. **Monitoring Usage**:
   ```bash
   # Check your credits (if SDK supports)
   npm run test:scrapegraph credits
   ```

3. **Optimization Tips**:
   - Run during off-peak hours
   - Use specific sites rather than "all"
   - Adjust `maxPagesPerSite` based on needs

## Error Handling

The system includes multiple fallback layers:

1. **Primary**: ScrapeGraph AI extraction
2. **Secondary**: Traditional HTML parsing
3. **Tertiary**: Cached data from previous scrapes

Common errors and solutions:

- **API Key Missing**: Add `VITE_SCRAPEGRAPH_API_KEY` to `.env`
- **Rate Limit**: Increase delays in configuration
- **Invalid Response**: Check site-specific selectors

## Data Quality

The system ensures data quality through:

1. **Validation**: Zod schemas validate all extracted data
2. **Normalization**: Prices, dates, and text are standardized
3. **Deduplication**: Prevents duplicate listings by URL
4. **FBA Detection**: Keywords and context analysis

## Debugging

Enable verbose logging:

```javascript
const service = new ScrapeGraphService({
  apiKey: key,
  verbose: true,  // Enable detailed logs
  delayBetweenRequests: 5000
});
```

Check server logs:
```bash
cd server && node index.js
# Watch console for ScrapeGraph status messages
```

## Future Enhancements

1. **Dynamic Prompts**: Adjust based on site structure
2. **Batch Processing**: Group multiple pages in single API call
3. **Smart Scheduling**: Run during optimal times
4. **Credit Alerts**: Notify when credits are low
5. **Result Caching**: Store AI responses for reuse

## Support

- ScrapeGraph Docs: https://docs.scrapegraphai.com/
- API Status: https://status.scrapegraphai.com/
- GitHub Issues: Report bugs in this repo