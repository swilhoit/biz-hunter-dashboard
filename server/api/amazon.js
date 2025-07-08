import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const router = express.Router();

// Helper function to extract seller ID from URL
function extractSellerIdFromURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Check for seller parameter
    const sellerParam = urlObj.searchParams.get('seller');
    if (sellerParam) return sellerParam;
    
    // Check for me parameter
    const meParam = urlObj.searchParams.get('me');
    if (meParam) return meParam;
    
    // Check for stores page format
    const storesMatch = url.match(/\/stores\/(?:page\/)?([A-Z0-9]+)/i);
    if (storesMatch) return storesMatch[1];
    
    return null;
  } catch (error) {
    console.error('Error extracting seller ID from URL:', error);
    return null;
  }
}

// Route to get ASINs from an Amazon store URL
router.post('/store-asins', async (req, res) => {
  try {
    const { storeUrl } = req.body;
    
    if (!storeUrl) {
      return res.status(400).json({ error: 'Store URL is required' });
    }

    // Extract seller ID from URL
    const sellerId = extractSellerIdFromURL(storeUrl);
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Invalid Amazon store URL' });
    }

    // Use ScraperAPI to fetch the store page
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
      console.error('SCRAPER_API_KEY not configured');
      return res.status(500).json({ error: 'Scraping service not configured' });
    }

    // Construct the Amazon seller page URL
    const amazonUrl = `https://www.amazon.com/s?me=${sellerId}`;
    const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(amazonUrl)}&render=true`;

    console.log('Fetching store page:', amazonUrl);

    const response = await fetch(scraperUrl, {
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch store page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract ASINs from the page
    const asins = new Set();
    let sellerName = '';

    // Try to extract seller name
    $('.s-size-mini-space-left span').each((i, elem) => {
      const text = $(elem).text();
      if (text.includes('by ')) {
        sellerName = text.replace('by ', '').trim();
      }
    });

    // Extract ASINs from data attributes
    $('[data-asin]').each((i, elem) => {
      const asin = $(elem).attr('data-asin');
      if (asin && asin.length === 10 && asin.match(/^[A-Z0-9]{10}$/)) {
        asins.add(asin);
      }
    });

    // Also look for ASINs in links
    $('a[href*="/dp/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const match = href.match(/\/dp\/([A-Z0-9]{10})/);
      if (match) {
        asins.add(match[1]);
      }
    });

    // Look for ASINs in product review links
    $('a[href*="/product-reviews/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const match = href.match(/\/product-reviews\/([A-Z0-9]{10})/);
      if (match) {
        asins.add(match[1]);
      }
    });

    const asinArray = Array.from(asins);
    
    console.log(`Found ${asinArray.length} ASINs for seller ${sellerId}`);
    
    // If no ASINs found from scraping, return empty array
    // In production, this would need more sophisticated scraping
    if (asinArray.length === 0) {
      console.log('No ASINs found via scraping, this may be due to Amazon\'s anti-scraping measures');
    }

    res.json({
      sellerId,
      sellerName,
      asins: asinArray,
      totalFound: asinArray.length
    });

  } catch (error) {
    console.error('Error fetching store ASINs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch store ASINs',
      details: error.message 
    });
  }
});

// Route to get ASIN details from Amazon
router.post('/asin-details', async (req, res) => {
  try {
    const { asins } = req.body;
    
    if (!asins || !Array.isArray(asins)) {
      return res.status(400).json({ error: 'ASINs array is required' });
    }

    const scraperApiKey = process.env.SCRAPER_API_KEY;
    if (!scraperApiKey) {
      return res.status(500).json({ error: 'Scraping service not configured' });
    }

    const results = [];
    
    // Process ASINs in batches to avoid overwhelming the API
    for (const asin of asins.slice(0, 10)) { // Limit to first 10 for now
      try {
        const amazonUrl = `https://www.amazon.com/dp/${asin}`;
        const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(amazonUrl)}`;

        const response = await fetch(scraperUrl);
        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract basic product information
        const title = $('#productTitle').text().trim();
        const price = $('.a-price-whole').first().text().replace(/[^0-9.]/g, '');
        const rating = $('span.a-icon-alt').first().text().split(' ')[0];
        const reviewCount = $('#acrCustomerReviewText').text().match(/\d+/)?.[0] || '0';

        results.push({
          asin,
          title,
          price: parseFloat(price) || 0,
          rating: parseFloat(rating) || 0,
          reviews: parseInt(reviewCount) || 0
        });
      } catch (error) {
        console.error(`Error fetching details for ASIN ${asin}:`, error);
      }
    }

    res.json({ products: results });

  } catch (error) {
    console.error('Error fetching ASIN details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ASIN details',
      details: error.message 
    });
  }
});

export default router;