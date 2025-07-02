# Two-Button Scraping System

## Overview

The Feed page now has two separate "Check for New Listings" buttons:

1. **Check (Traditional)** - Purple button - Uses ScraperAPI and HTML parsing
2. **Check (AI-Powered)** - Green button - Uses ScrapeGraphAI

## How It Works

### Traditional Scraping (Purple Button)
- Uses the Enhanced Multi-Scraper with two-stage process
- Scrapes HTML from BizBuySell, Flippa, QuietLight, Empire Flippers
- Requires ScraperAPI key (already configured)
- Works immediately without additional setup

### AI-Powered Scraping (Green Button)
- Uses ScrapeGraphAI's language models to understand web pages
- More resilient to website changes
- Currently shows mock data (no credits available)
- Will use real AI scraping once credits are added

## Current Status

### ✅ Traditional Scraping
- Fully functional
- Scrapes real listings from multiple sources
- Two-stage process extracts full descriptions

### ⚠️ AI-Powered Scraping
- API key configured: `sgai-dc5a7f61-c0aa-443b-a5f0-c50bff659600`
- **No credits available** - shows mock data
- Add credits at: https://dashboard.scrapegraphai.com/

## Testing

1. Start the server:
   ```bash
   cd server && node index.js
   ```

2. Open the app and go to the Feed page

3. Click either button:
   - **Purple button**: Real scraping using ScraperAPI
   - **Green button**: Mock data (until credits added)

## What Happens When You Click

### Traditional Button
1. Shows progress: "BizBuySell... 25%", "Flippa... 50%", etc.
2. Scrapes real listings from configured sites
3. Saves new listings to database
4. Shows success message with count

### AI-Powered Button
1. Shows progress: "ScrapeGraph AI... 25%", "Processing... 50%", etc.
2. Currently returns mock FBA listings
3. Shows message about needing credits
4. Once credits added: Will use AI to extract listings

## Benefits of Each Approach

### Traditional Scraping
- ✅ Works immediately
- ✅ No additional costs
- ❌ Needs updates when sites change
- ❌ May miss some data

### AI-Powered Scraping
- ✅ Adapts to site changes automatically
- ✅ Better data extraction accuracy
- ✅ Understands context better
- ❌ Requires API credits
- ❌ Slightly slower

## Next Steps

1. **To use AI scraping**: Add credits to your ScrapeGraphAI account
2. **To continue with traditional**: Just use the purple button
3. **Both buttons** will continue to work side-by-side