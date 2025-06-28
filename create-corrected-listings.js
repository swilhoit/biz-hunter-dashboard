#!/usr/bin/env node

// Create new QuietLight listings with corrected revenue data

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function createCorrectedListings() {
  console.log('🔧 Creating Corrected QuietLight Listings\n');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get existing QuietLight listings
    const { data: existingListings, error } = await supabase
      .from('business_listings')
      .select('*')
      .eq('source', 'QuietLight');
    
    if (error) {
      console.log('❌ Error fetching listings:', error.message);
      return;
    }
    
    console.log(`📊 Found ${existingListings.length} existing QuietLight listings\n`);
    
    // Create corrected versions with revenue data
    const correctedListings = existingListings.map(listing => {
      let annual_revenue = 0;
      
      // Extract revenue from title
      const title = listing.name.toLowerCase();
      if (title.includes('$28m')) {
        annual_revenue = 28000000;
      } else if (title.includes('$17.4m revenue')) {
        annual_revenue = 17400000;
      } else if (title.includes('$5.7m sde')) {
        annual_revenue = 5700000;
      }
      
      return {
        name: listing.name + ' (Updated)',
        description: listing.description || 'Digital business opportunity from QuietLight',
        asking_price: listing.asking_price || 0,
        annual_revenue,
        industry: listing.industry || 'Digital Business',
        location: listing.location || 'Remote',
        source: 'QuietLight',
        highlights: listing.highlights || [],
        image_url: listing.image_url,
        status: 'active',
        original_url: listing.original_url,
        created_at: new Date().toISOString()
      };
    }).filter(listing => listing.annual_revenue > 0); // Only include ones with revenue
    
    console.log(`💰 Creating ${correctedListings.length} corrected listings with revenue data:\n`);
    
    for (const listing of correctedListings) {
      console.log(`📝 Creating: "${listing.name.substring(0, 60)}..."`);
      console.log(`   Revenue: $${listing.annual_revenue.toLocaleString()}`);
      
      const { error: insertError } = await supabase
        .from('business_listings')
        .insert([listing]);
      
      if (insertError) {
        console.log(`   ❌ Failed: ${insertError.message}`);
      } else {
        console.log(`   ✅ Created successfully`);
      }
      console.log('');
    }
    
    // Verify the new listings
    console.log('🔍 Verifying new listings...');
    const { data: newListings } = await supabase
      .from('business_listings')
      .select('name, annual_revenue, source')
      .eq('source', 'QuietLight')
      .gt('annual_revenue', 0)
      .order('created_at', { ascending: false });
    
    if (newListings && newListings.length > 0) {
      console.log(`✅ SUCCESS! ${newListings.length} QuietLight listings now have revenue data:`);
      newListings.forEach((listing, i) => {
        console.log(`   ${i + 1}. $${listing.annual_revenue.toLocaleString()} - ${listing.name.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No new listings found with revenue');
    }
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  }
}

createCorrectedListings();