import { scrapeBizBuySell, saveToDatabase } from './scraper.js';

export async function performRealScraping() {
  try {
    console.log('🔥 Starting REAL data scraping - NO FAKE DATA');
    
    const listings = await scrapeBizBuySell();
    
    if (listings.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'No real listings found on BizBuySell. Website structure may have changed.'
      };
    }

    const savedCount = await saveToDatabase(listings);
    
    return {
      success: true,
      count: savedCount,
      message: `Successfully scraped and saved ${savedCount} REAL business listings from BizBuySell with actual URLs`
    };
  } catch (error) {
    console.error('Real scraping failed:', error);
    return {
      success: false,
      count: 0,
      message: `Real scraping failed: ${error.message}`
    };
  }
}