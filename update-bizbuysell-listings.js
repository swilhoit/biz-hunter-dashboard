#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import EnhancedMultiScraper from './enhanced-multi-scraper.js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBizBuySellListings() {
  console.log('🔄 Starting BizBuySell listings update...');
  
  try {
    // Get all BizBuySell listings with 0 revenue
    const { data: listings, error } = await supabase
      .from('business_listings')
      .select('id, name, original_url, asking_price')
      .eq('source', 'BizBuySell')
      .eq('annual_revenue', 0)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching listings:', error);
      return;
    }
    
    console.log(`📋 Found ${listings.length} BizBuySell listings with missing revenue data`);
    
    // Initialize scraper
    const scraper = new EnhancedMultiScraper();
    
    // Process each listing
    for (const listing of listings) {
      console.log(`\n🔍 Processing: ${listing.name}`);
      console.log(`   URL: ${listing.original_url}`);
      
      try {
        // Scrape the listing details
        const scrapedData = await scraper.scrapeBizBuySellListing({
          url: listing.original_url,
          title: listing.name,
          priceText: `$${listing.asking_price}`
        });
        
        // Update the database if we found revenue data
        if (scrapedData.annual_revenue > 0 || scrapedData.annual_profit > 0) {
          const { error: updateError } = await supabase
            .from('business_listings')
            .update({
              annual_revenue: scrapedData.annual_revenue,
              annual_profit: scrapedData.annual_profit,
              monthly_revenue: scrapedData.monthly_revenue,
              gross_revenue: scrapedData.gross_revenue,
              net_revenue: scrapedData.net_revenue,
              profit_multiple: scrapedData.profit_multiple,
              description: scrapedData.description,
              highlights: scrapedData.highlights,
              updated_at: new Date().toISOString()
            })
            .eq('id', listing.id);
          
          if (updateError) {
            console.error(`❌ Failed to update listing ${listing.id}:`, updateError);
          } else {
            console.log(`✅ Updated with revenue: $${scrapedData.annual_revenue.toLocaleString()}, profit: $${scrapedData.annual_profit.toLocaleString()}`);
          }
        } else {
          console.log('⚠️  No revenue data found on listing page');
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing listing ${listing.id}:`, error.message);
      }
    }
    
    console.log('\n✅ BizBuySell listings update complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the update
updateBizBuySellListings();