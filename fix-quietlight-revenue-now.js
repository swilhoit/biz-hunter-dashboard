#!/usr/bin/env node

// Immediately fix QuietLight revenue data using the service account

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function extractRevenueFromTitle(title) {
  const titleText = title.toLowerCase();
  
  // Enhanced patterns for QuietLight's title format
  const financialPatterns = [
    // Revenue patterns
    /\$?([\d.]+[km]?)\s*revenue/i,
    /revenue[:\s|\|]+\$?([\d.]+[km]?)/i,
    
    // SDE/Profit patterns (often more reliable than revenue)
    /\$?([\d.]+[km]?)\s*sde/i,
    /sde[:\s|\|]+\$?([\d.]+[km]?)/i,
    
    // General money patterns (as fallback)
    /\$(\d+(?:\.\d+)?[km])\b/i
  ];
  
  for (const pattern of financialPatterns) {
    const match = titleText.match(pattern);
    if (match && match[1]) {
      const value = match[1];
      return parseFinancialValue(value);
    }
  }
  
  return 0;
}

function parseFinancialValue(text) {
  if (!text) return 0;
  
  const cleanText = text.toLowerCase();
  
  // Handle millions
  if (cleanText.includes('m')) {
    const num = parseFloat(cleanText.replace('m', ''));
    return Math.floor(num * 1000000);
  }
  
  // Handle thousands
  if (cleanText.includes('k')) {
    const num = parseFloat(cleanText.replace('k', ''));
    return Math.floor(num * 1000);
  }
  
  // Regular number
  const num = parseFloat(cleanText.replace(/,/g, ''));
  return isNaN(num) ? 0 : Math.floor(num);
}

async function fixQuietLightRevenue() {
  console.log('🔧 Fixing QuietLight Revenue Data NOW\n');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get QuietLight listings
    const { data: listings, error } = await supabase
      .from('business_listings')
      .select('id, name, annual_revenue, asking_price')
      .eq('source', 'QuietLight');
    
    if (error) {
      console.log('❌ Error fetching listings:', error.message);
      return;
    }
    
    console.log(`📊 Found ${listings.length} QuietLight listings to fix\n`);
    
    let updated = 0;
    
    for (const listing of listings) {
      const extractedRevenue = extractRevenueFromTitle(listing.name);
      
      console.log(`📝 "${listing.name}"`);
      console.log(`   Current Revenue: $${listing.annual_revenue?.toLocaleString() || 0}`);
      console.log(`   Extracted Revenue: $${extractedRevenue.toLocaleString()}`);
      
      if (extractedRevenue > 0) {
        try {
          const { error: updateError } = await supabase
            .from('business_listings')
            .update({ 
              annual_revenue: extractedRevenue,
              updated_at: new Date().toISOString()
            })
            .eq('id', listing.id);
          
          if (updateError) {
            console.log(`   ❌ Update failed: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated! New revenue: $${extractedRevenue.toLocaleString()}`);
            updated++;
          }
        } catch (err) {
          console.log(`   ❌ Error updating: ${err.message}`);
        }
      } else {
        console.log(`   ⏭️ No revenue found in title`);
      }
      
      console.log(''); // Empty line between listings
    }
    
    console.log(`🎉 COMPLETE! Updated ${updated} QuietLight listings with revenue data`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: updatedListings } = await supabase
      .from('business_listings')
      .select('name, annual_revenue')
      .eq('source', 'QuietLight')
      .gt('annual_revenue', 0);
    
    if (updatedListings && updatedListings.length > 0) {
      console.log(`✅ SUCCESS! ${updatedListings.length} QuietLight listings now have revenue data:`);
      updatedListings.forEach((listing, i) => {
        console.log(`   ${i + 1}. Revenue: $${listing.annual_revenue.toLocaleString()}`);
      });
    } else {
      console.log('❌ No listings found with revenue after update');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixQuietLightRevenue();