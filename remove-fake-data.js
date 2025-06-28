#!/usr/bin/env node

// Remove all fake data from the dashboard

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function removeFakeData() {
  console.log('🧹 Removing Fake Data from Dashboard\n');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get all fake listings added today
    const { data: fakeListings, error } = await supabase
      .from('business_listings')
      .select('id, name, source, created_at')
      .gte('created_at', '2025-06-27 22:00:00')
      .in('source', ['Acquire', 'BizQuest', 'MicroAcquire', 'Flippa']);
    
    if (error) {
      console.log('❌ Error fetching fake listings:', error.message);
      return;
    }
    
    console.log(`🗑️ Found ${fakeListings.length} fake listings to remove:\n`);
    
    if (fakeListings.length === 0) {
      console.log('✅ No fake data found to remove');
      return;
    }
    
    // List them first
    fakeListings.forEach((listing, i) => {
      console.log(`${i + 1}. ${listing.name.substring(0, 60)}... (${listing.source})`);
    });
    
    console.log('\n🗑️ Removing fake listings...');
    
    // Delete them
    const { error: deleteError } = await supabase
      .from('business_listings')
      .delete()
      .in('id', fakeListings.map(l => l.id));
    
    if (deleteError) {
      console.log('❌ Error deleting fake listings:', deleteError.message);
      return;
    }
    
    console.log(`✅ Successfully removed ${fakeListings.length} fake listings`);
    
    // Verify final state
    const { data: remaining } = await supabase
      .from('business_listings')
      .select('source')
      .not('source', 'is', null);
    
    if (remaining) {
      const sourceCounts = {};
      remaining.forEach(item => {
        sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
      });
      
      console.log('\n📊 Remaining legitimate data:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`• ${source}: ${count} listings`);
      });
      
      const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
      console.log(`\nTotal: ${total} legitimate listings`);
    }
    
    console.log('\n✅ Dashboard cleaned - only real data remains');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

removeFakeData();