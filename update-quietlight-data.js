#!/usr/bin/env node

// Script to re-process existing QuietLight data with the new revenue extraction logic

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function extractFinancialData(title) {
  const titleText = title.toLowerCase();
  let priceText = '';
  let revenueText = '';
  
  // Enhanced patterns for QuietLight's title format
  const financialPatterns = [
    // Revenue patterns - more specific
    /\$?([\d.]+[km]?)\s*revenue/i,
    /revenue[:\s|\|]+\$?([\d.]+[km]?)/i,
    
    // SDE/Profit patterns (often more reliable than revenue)
    /\$?([\d.]+[km]?)\s*sde/i,
    /sde[:\s|\|]+\$?([\d.]+[km]?)/i,
    
    // Price/Asking patterns
    /asking[:\s|\|]+\$?([\d.]+[km]?)/i,
    /price[:\s|\|]+\$?([\d.]+[km]?)/i,
    /\$?([\d.]+[km]?)\s*asking/i,
    
    // MRR patterns
    /mrr[:\s|\|]+\$?([\d.]+[km]?)/i,
    /\$?([\d.]+[km]?)\s*mrr/i,
    
    // Profit patterns
    /profit[:\s|\|]+\$?([\d.]+[km]?)/i,
    /\$?([\d.]+[km]?)\s*profit/i,
    
    // General money patterns (as fallback) - more restrictive
    /\$(\d+(?:\.\d+)?[km])\b/i
  ];
  
  for (const pattern of financialPatterns) {
    const match = titleText.match(pattern);
    if (match && match[1]) {
      const value = match[1];
      const patternSource = pattern.source;
      
      // Determine if this is likely revenue or price based on context
      if (patternSource.includes('revenue') || patternSource.includes('sde') || patternSource.includes('mrr') || patternSource.includes('profit')) {
        if (!revenueText) revenueText = value;
      } else if (patternSource.includes('asking') || patternSource.includes('price')) {
        if (!priceText) priceText = value;
      } else {
        // General money pattern - use as revenue if we don't have one
        if (!revenueText) revenueText = value;
      }
    }
  }
  
  return { priceText, revenueText };
}

function parseFinancialValue(text) {
  if (!text) return 0;
  
  const cleanText = text.replace(/[^\d.,km]/gi, '').toLowerCase();
  
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

async function updateQuietLightData() {
  console.log('🔄 Updating QuietLight data with enhanced revenue extraction...\n');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get existing QuietLight listings
    const { data: listings, error } = await supabase
      .from('business_listings')
      .select('id, name, asking_price, annual_revenue')
      .eq('source', 'QuietLight');
    
    if (error) {
      console.log('❌ Error fetching listings:', error.message);
      return;
    }
    
    console.log(`📊 Found ${listings.length} QuietLight listings to update`);
    
    let updated = 0;
    
    for (const listing of listings) {
      const { priceText, revenueText } = extractFinancialData(listing.name);
      const newPrice = parseFinancialValue(priceText);
      const newRevenue = parseFinancialValue(revenueText);
      
      console.log(`\n📝 "${listing.name.substring(0, 60)}..."`);
      console.log(`   Current: Price=$${listing.asking_price?.toLocaleString() || 0}, Revenue=$${listing.annual_revenue?.toLocaleString() || 0}`);
      console.log(`   Extracted: "${priceText}" → $${newPrice.toLocaleString()}, "${revenueText}" → $${newRevenue.toLocaleString()}`);
      
      // Only update if we found better data
      if ((newPrice > 0 && newPrice !== listing.asking_price) || 
          (newRevenue > 0 && newRevenue !== listing.annual_revenue)) {
        
        const { error: updateError } = await supabase
          .from('business_listings')
          .update({
            asking_price: newPrice > 0 ? newPrice : listing.asking_price,
            annual_revenue: newRevenue > 0 ? newRevenue : listing.annual_revenue,
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.id);
          
        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated with new data`);
          updated++;
        }
      } else {
        console.log(`   ⏭️ No better data found, skipping`);
      }
    }
    
    console.log(`\n🎉 Update complete! ${updated} listings updated with better financial data.`);
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  }
}

updateQuietLightData();