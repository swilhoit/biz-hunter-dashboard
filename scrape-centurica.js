#!/usr/bin/env node

import { ScraperAPICenturicaScraper } from './src/services/scraping/scrapers/ScraperAPICenturicaScraper.ts';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveToDatabase(listings) {
  if (listings.length === 0) return 0;
  
  try {
    console.log(`💾 Saving ${listings.length} listings to database...`);
    
    // Prepare listings with proper fields
    const formattedListings = listings.map(listing => ({
      name: listing.name,
      description: listing.description,
      asking_price: listing.askingPrice,
      annual_revenue: listing.annualRevenue,
      industry: listing.industry,
      location: listing.location,
      source: listing.source,
      original_url: listing.originalUrl,
      highlights: listing.highlights || [],
      scraped_at: listing.scrapedAt || new Date().toISOString(),
      is_active: true,
      verification_status: 'live'
    }));
    
    const { data, error } = await supabase
      .from('business_listings')
      .insert(formattedListings)
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      return 0;
    }
    
    const savedCount = data?.length || 0;
    console.log(`✅ Saved ${savedCount} listings`);
    return savedCount;
    
  } catch (error) {
    console.error('❌ Save error:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting Centurica aggregator scraping...');
  console.log('📍 This will scrape listings from 30+ business brokers aggregated by Centurica Marketwatch\n');
  
  if (!process.env.SCRAPER_API_KEY) {
    console.error('❌ SCRAPER_API_KEY not found in environment');
    return;
  }
  
  try {
    // Create scraper instance
    const scraper = new ScraperAPICenturicaScraper();
    
    // Run the scraper
    console.log('🔄 Fetching Centurica Marketwatch data...');
    const result = await scraper.scrape();
    
    if (result.success) {
      console.log(`\n✅ Scraping completed successfully!`);
      console.log(`Found ${result.totalFound} listings`);
      
      // Save to database
      const savedCount = await saveToDatabase(result.listings);
      
      console.log('\n📊 Final Results:');
      console.log(`Total listings found: ${result.totalFound}`);
      console.log(`Successfully saved: ${savedCount}`);
      
      if (savedCount > 0) {
        console.log('\n📋 Sample listings from various brokers:');
        
        // Group by provider to show variety
        const byProvider = {};
        result.listings.forEach(listing => {
          const provider = listing.source.replace('Centurica (', '').replace(')', '');
          if (!byProvider[provider]) byProvider[provider] = [];
          byProvider[provider].push(listing);
        });
        
        // Show sample from each provider
        Object.entries(byProvider).slice(0, 5).forEach(([provider, listings]) => {
          const sample = listings[0];
          console.log(`\n🏢 ${provider}:`);
          console.log(`   ${sample.name}`);
          console.log(`   Price: $${sample.askingPrice.toLocaleString()}`);
          console.log(`   Revenue: $${sample.annualRevenue.toLocaleString()}`);
          console.log(`   Industry: ${sample.industry}`);
          console.log(`   URL: ${sample.originalUrl}`);
        });
        
        // Show provider summary
        console.log('\n📈 Provider Summary:');
        Object.entries(byProvider).forEach(([provider, listings]) => {
          console.log(`   ${provider}: ${listings.length} listings`);
        });
      }
    } else {
      console.error('❌ Scraping failed:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main().catch(console.error);