# Site Selection Feature Test Guide

## Overview
The ScrapingProgressModal now includes a site selection interface that allows users to choose which marketplaces to scrape for Amazon FBA businesses.

## Available Sites
1. **QuietLight** (ID: `quietlight`) - Premium FBA businesses
2. **BizBuySell** (ID: `bizbuysell`) - Large marketplace  
3. **Empire Flippers** (ID: `empireflippers`) - Vetted online businesses
4. **Flippa** (ID: `flippa`) - Digital assets marketplace

## Default Selection
By default, QuietLight and BizBuySell are selected.

## Implementation Details

### Frontend Changes

1. **ScrapingProgressModal Component** (`src/components/ScrapingProgressModal.jsx`)
   - Added site selection UI that appears before scraping starts
   - Users can toggle sites on/off with checkboxes
   - "Start Scraping" button is disabled until at least one site is selected
   - Selected sites are passed to the API

2. **useManualScraping Hook** (`src/hooks/useManualScraping.ts`)
   - Updated to accept and pass `selectedSites` parameter to the API
   - Sends the array of selected site IDs in the request body

3. **ListingsFeed Page** (`src/pages/ListingsFeed.jsx`)
   - Added `selectedSites` state with default values
   - Passes selected sites to the scraping functions
   - Modal receives site selection props

### Backend Changes

1. **Server API** (`server/index.js`)
   - `/api/scrape` endpoint now accepts `selectedSites` array in request body
   - `scrapeWithParallelProcessing` function filters sites based on selection
   - Each site has an ID that matches the frontend selection
   - Falls back to default sites (quietlight, bizbuysell) if none selected

## Testing Steps

1. **Start the Server**
   ```bash
   cd server
   node index.js
   ```

2. **Start the Frontend**
   ```bash
   npm run dev
   ```

3. **Test Site Selection**
   - Click "Admin" dropdown → "Check New Listings (Traditional)"
   - The modal should show the site selection interface
   - Try different combinations:
     - Select all sites
     - Select only one site
     - Deselect all (Start button should be disabled)
   - Click "Start Scraping" to begin

4. **Verify Results**
   - The progress modal should only show the selected sites
   - Only selected sites should be scraped
   - Results should reflect the sites that were chosen

## API Request Format

```json
{
  "method": "traditional",
  "selectedSites": ["quietlight", "bizbuysell", "empireflippers", "flippa"]
}
```

## Notes
- The ScrapeGraph AI method also supports site selection
- Site IDs must match between frontend and backend
- The feature maintains backward compatibility (defaults to quietlight and bizbuysell)