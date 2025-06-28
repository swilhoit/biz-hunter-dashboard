#!/usr/bin/env node

// Test the revenue extraction logic with actual QuietLight titles from the database

function testRevenueExtraction() {
  // Actual titles from the database that have revenue data but weren't extracted
  const testTitles = [
    "Electrolyte Brand | US-Based Manufacturing | 65% YoY Growth | 20k Subs | $17.4M Revenue | $2.56M SDE",
    "Thriving Women's Health Supplement Business | $5.7M SDE | 300%+ Growth | Owners Capping Growth",
    "Growing EdTech Business: 85% Recurring Revenue, 11K+ Annual Subscribers, 17.6% CAGR",
    "Premium Pet Authority Site | One-of-a-Kind Domain | 33% YoY Revenue Growth | ~1,000,000 Monthly Users",
    "Distressed $28M Global Footwear Platform | Strategic Liquidation | 21 Channels | Recovery Ready"
  ];

  console.log('🧪 Testing Revenue Extraction Logic\n');

  testTitles.forEach((title, index) => {
    console.log(`\n${index + 1}. Testing: "${title}"`);
    
    const titleText = title.toLowerCase();
    let priceText = '';
    let revenueText = '';
    
    // Enhanced patterns for QuietLight's title format
    const financialPatterns = [
      // Revenue patterns
      /\$?([\d,]+(?:\.\d+)?[km]?)\s*revenue/i,
      /revenue[:\s|\|]*\$?([\d,]+(?:\.\d+)?[km]?)/i,
      
      // SDE/Profit patterns (often more reliable than revenue)
      /\$?([\d,]+(?:\.\d+)?[km]?)\s*sde/i,
      /sde[:\s|\|]*\$?([\d,]+(?:\.\d+)?[km]?)/i,
      
      // Price/Asking patterns
      /asking[:\s|\|]*\$?([\d,]+(?:\.\d+)?[km]?)/i,
      /price[:\s|\|]*\$?([\d,]+(?:\.\d+)?[km]?)/i,
      /\$?([\d,]+(?:\.\d+)?[km]?)\s*asking/i,
      
      // MRR patterns
      /mrr[:\s|\|]*\$?([\d,]+(?:\.\d+)?[km]?)/i,
      /\$?([\d,]+(?:\.\d+)?[km]?)\s*mrr/i,
      
      // Profit patterns
      /profit[:\s|\|]*\$?([\d,]+(?:\.\d+)?[km]?)/i,
      /\$?([\d,]+(?:\.\d+)?[km]?)\s*profit/i,
      
      // General money patterns (as fallback)
      /\$(\d+(?:\.\d+)?[km])/i
    ];
    
    for (const pattern of financialPatterns) {
      const match = titleText.match(pattern);
      if (match && match[1]) {
        const value = match[1];
        const patternSource = pattern.source;
        
        // Determine if this is likely revenue or price based on context
        if (patternSource.includes('revenue') || patternSource.includes('sde') || patternSource.includes('mrr') || patternSource.includes('profit')) {
          if (!revenueText) {
            revenueText = value;
            console.log(`   ✅ Found revenue: ${value} (pattern: ${patternSource})`);
          }
        } else if (patternSource.includes('asking') || patternSource.includes('price')) {
          if (!priceText) {
            priceText = value;
            console.log(`   💰 Found price: ${value} (pattern: ${patternSource})`);
          }
        } else {
          // General money pattern - use as revenue if we don't have one
          if (!revenueText) {
            revenueText = value;
            console.log(`   💵 Found money (as revenue): ${value} (pattern: ${patternSource})`);
          }
        }
      }
    }
    
    // Test the DataProcessor parsing
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
    
    const parsedRevenue = parseFinancialValue(revenueText);
    const parsedPrice = parseFinancialValue(priceText);
    
    console.log(`   📊 Results:`);
    console.log(`      Raw Revenue: "${revenueText}" → Parsed: $${parsedRevenue.toLocaleString()}`);
    console.log(`      Raw Price: "${priceText}" → Parsed: $${parsedPrice.toLocaleString()}`);
    
    if (!revenueText && !priceText) {
      console.log(`   ❌ No financial data extracted`);
    }
  });
  
  console.log('\n🎯 Summary: This logic should extract revenue data that was previously missing!');
}

testRevenueExtraction();