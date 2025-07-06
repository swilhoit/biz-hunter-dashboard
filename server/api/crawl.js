const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Note: Using direct database calls instead of importing ES modules in CommonJS environment

const router = express.Router();

// Mock crawl products endpoint
router.post('/products', async (req, res) => {
  try {
    const { keyword, maxResults = 100 } = req.body;
    
    console.log('🔍 [CRAWL API] Product search requested:', { keyword, maxResults });
    
    // Simulate crawling delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response with sample ASINs
    const mockAsins = [
      {
        asin: 'B09XYZ123',
        category: 'Beauty & Personal Care',
        price: 25.99,
        bsr: 1500,
        est_units: 150,
        est_rev: 3898.5
      },
      {
        asin: 'B08ABC456', 
        category: 'Electronics',
        price: 89.99,
        bsr: 850,
        est_units: 280,
        est_rev: 25197.2
      },
      {
        asin: 'B07DEF789',
        category: 'Home & Kitchen', 
        price: 34.95,
        bsr: 2200,
        est_units: 95,
        est_rev: 3320.25
      }
    ];
    
    // Insert mock data into database
    for (const asin of mockAsins) {
      await supabase
        .from('asins')
        .upsert(asin, { onConflict: 'asin' });
    }
    
    res.json({
      success: true,
      message: `Found ${mockAsins.length} products for keyword: ${keyword}`,
      data: {
        keyword,
        results: mockAsins.length,
        asins: mockAsins
      }
    });
    
  } catch (error) {
    console.error('❌ [CRAWL API] Products error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mock crawl sellers endpoint
router.post('/sellers', async (req, res) => {
  try {
    const { batchSize = 100 } = req.body;
    
    console.log('🔍 [CRAWL API] Seller lookup requested for batch size:', batchSize);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock seller discovery results
    const mockResults = {
      new_sellers: Math.floor(Math.random() * 20) + 5,
      total_sellers: Math.floor(Math.random() * 50) + 25,
      duplicate_sellers: Math.floor(Math.random() * 10) + 2,
      total_cost: Math.random() * 10 + 5,
      processing_time: Math.floor(Math.random() * 30000) + 10000
    };
    
    res.json({
      success: true,
      message: `Discovered ${mockResults.new_sellers} new sellers from ${mockResults.total_sellers} total sellers found`,
      data: {
        asins_processed: batchSize,
        ...mockResults
      }
    });
    
  } catch (error) {
    console.error('❌ [CRAWL API] Sellers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mock crawl storefronts endpoint
router.post('/storefronts', async (req, res) => {
  try {
    const { batchSize = 50 } = req.body;
    
    console.log('🔍 [CRAWL API] Storefront parsing requested for batch size:', batchSize);
    
    // Simulate crawling delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Mock storefront parsing results
    const contactsFound = Math.floor(Math.random() * 8) + 2;
    const domainsFound = Math.floor(Math.random() * 3) + 1;
    
    res.json({
      success: true,
      message: `Parsed ${batchSize} storefronts successfully`,
      data: {
        sellers_processed: batchSize,
        contacts_found: contactsFound,
        domains_found: domainsFound,
        social_links_found: Math.floor(Math.random() * 5)
      }
    });
    
  } catch (error) {
    console.error('❌ [CRAWL API] Storefronts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get crawl status
router.get('/status', async (req, res) => {
  try {
    // Get counts from database
    const { data: sellersCount } = await supabase
      .from('sellers')
      .select('id', { count: 'exact' });
      
    const { data: asinsCount } = await supabase
      .from('asins')
      .select('id', { count: 'exact' });
      
    const { data: contactsCount } = await supabase
      .from('seller_contacts')
      .select('id', { count: 'exact' });
    
    res.json({
      success: true,
      data: {
        total_sellers: sellersCount?.length || 0,
        total_asins: asinsCount?.length || 0,
        total_contacts: contactsCount?.length || 0,
        last_crawl: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [CRAWL API] Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 