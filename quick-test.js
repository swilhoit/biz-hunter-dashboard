#!/usr/bin/env node

// Quick test to check current state and run a simple scraper

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function checkCurrentState() {
  console.log('🔍 Checking current dashboard state...\n');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    console.log('Make sure you have:');
    console.log('VITE_SUPABASE_URL=your_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_key');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check total listings
    const { count, error: countError } = await supabase
      .from('business_listings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Database query failed:', countError.message);
      return;
    }
    
    console.log(`📊 Total listings in database: ${count}`);
    
    // Check by source
    const { data: bySource, error: sourceError } = await supabase
      .from('business_listings')
      .select('source')
      .not('source', 'is', null);
    
    if (!sourceError && bySource) {
      const sourceCounts = {};
      bySource.forEach(item => {
        sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
      });
      
      console.log('\n📈 Listings by source:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`  • ${source}: ${count} listings`);
      });
    }
    
    // Get recent listings with revenue data
    const { data: recent, error: recentError } = await supabase
      .from('business_listings')
      .select('name, source, asking_price, annual_revenue, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!recentError && recent) {
      console.log('\n🕒 Recent listings (showing revenue data):');
      recent.forEach(listing => {
        const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'No price';
        const revenue = listing.annual_revenue ? `$${listing.annual_revenue.toLocaleString()}` : 'No revenue';
        console.log(`  • ${listing.name.substring(0, 40)}... (${listing.source})`);
        console.log(`    Price: ${price}, Revenue: ${revenue}`);
        console.log(`    Added: ${listing.created_at}\n`);
      });
    }
    
    // Check for QuietLight specifically
    const { data: quietLight, error: qlError } = await supabase
      .from('business_listings')
      .select('name, asking_price, annual_revenue, created_at')
      .eq('source', 'QuietLight')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!qlError) {
      console.log(`\n🎯 QuietLight listings (${quietLight?.length || 0} found):`);
      if (quietLight && quietLight.length > 0) {
        quietLight.forEach(listing => {
          const price = listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'No price';
          const revenue = listing.annual_revenue ? `$${listing.annual_revenue.toLocaleString()}` : 'No revenue';
          console.log(`  • ${listing.name.substring(0, 40)}...`);
          console.log(`    Price: ${price}, Revenue: ${revenue}`);
        });
      } else {
        console.log('  No QuietLight listings found - scrapers may not be running');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

async function testScrapingAPI() {
  console.log('\n🌐 Testing scraping API...');
  
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Scraping API is running');
      console.log('Status:', healthData);
      
      // Try to run a single scraper
      console.log('\n🔄 Testing QuietLight scraper via API...');
      const scraperResponse = await fetch('http://localhost:3001/api/scraping/run-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraperName: 'quietlight' })
      });
      
      if (scraperResponse.ok) {
        const scraperData = await scraperResponse.json();
        console.log('✅ Scraper started:', scraperData);
        
        if (scraperData.operationId) {
          console.log('⏳ Checking scraper status in 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          const statusResponse = await fetch(`http://localhost:3001/api/scraping/status/${scraperData.operationId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 Scraper status:', statusData);
          }
        }
      } else {
        console.log('❌ Failed to start scraper:', await scraperResponse.text());
      }
      
    } else {
      console.log('❌ Scraping API not responding');
      console.log('💡 Start it with: npm run scraping-api:dev');
    }
  } catch (error) {
    console.log('❌ Scraping API not available:', error.message);
    console.log('💡 Start it with: npm run scraping-api:dev');
  }
}

async function main() {
  console.log('🚀 Quick BizHunter State Check\n');
  
  await checkCurrentState();
  await testScrapingAPI();
  
  console.log('\n🏁 Check complete!');
  console.log('\n💡 Recommended actions:');
  console.log('1. If no new listings: Run "npm run scraping-api:dev" in another terminal');
  console.log('2. If API running but no data: Check "node diagnose-scrapers.js"');
  console.log('3. If revenue missing: Check selectors need updating for new site structure');
}

main().catch(console.error);