# Scraping API Usage

## Starting the Scraping Server

The "Check for New Listings" button requires the scraping API server to be running. To start it:

```bash
# In a separate terminal, run:
npm run scraping-api

# Or alternatively:
npm run scraping-api:dev
```

The server will start on port 3001 by default.

## Troubleshooting

### "Failed to fetch" error
If you see "Scraping server is not running" error, make sure:
1. The scraping API is running in a separate terminal
2. The server is accessible at http://localhost:3001
3. No firewall is blocking port 3001

### Environment Variables
Make sure your `.env` file includes:
```
VITE_SCRAPING_API_URL=http://localhost:3001
```

## How it Works

When you click "Check for New Listings":
1. The frontend sends a request to run all scrapers
2. The scraping API runs each scraper sequentially
3. Progress is shown in real-time with the current scraper name
4. New listings are saved to the database
5. The feed automatically refreshes when complete

## Available Scrapers

The system checks the following sources:
- BizBuySell
- Flippa  
- QuietLight
- Empire Flippers
- Exit Adviser
- And more...

Each scraper is configured to:
- Fetch up to 5 pages of listings
- Wait 2 seconds between requests
- Skip duplicate listings
- Save new listings to Supabase