import createCsvWriter from 'csv-writer';
import fs from 'fs';

// Demo business data that mimics real BizBuySell listings
const DEMO_BUSINESSES = [
  {
    name: 'Established Medical Equipment Distributor',
    asking_price: 2800000,
    annual_revenue: 1900000,
    industry: 'Healthcare',
    location: 'Atlanta, Georgia',
    description: 'Established medical equipment distribution company serving hospitals and clinics across the Southeast. 15-year history with exclusive agreements and trained workforce.',
    highlights: 'Exclusive Agreements, 15 Year History, Medical Equipment',
    original_url: 'https://www.bizbuysell.com/business-for-sale/medical-equipment-distributor-atlanta-ga/123456',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Fast Casual Mexican Restaurant Chain',
    asking_price: 1650000,
    annual_revenue: 1200000,
    industry: 'Food & Beverage',
    location: 'Denver, Colorado',
    description: 'Three-location fast-casual Mexican restaurant chain with strong local following. Proven operating systems and growth opportunities.',
    highlights: 'Three Locations, Proven Systems, Growth Opportunities',
    original_url: 'https://www.bizbuysell.com/business-for-sale/mexican-restaurant-chain-denver-co/123457',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Custom Metal Fabrication Shop',
    asking_price: 4500000,
    annual_revenue: 2400000,
    industry: 'Manufacturing',
    location: 'Columbus, Ohio',
    description: 'Custom metal fabrication shop with aerospace and automotive clients. Includes all equipment, trained workforce, and 20+ years of operation.',
    highlights: 'Aerospace Clients, Trained Workforce, 20+ Years',
    original_url: 'https://www.bizbuysell.com/business-for-sale/metal-fabrication-columbus-oh/123458',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Growing Analytics Platform',
    asking_price: 5300000,
    annual_revenue: 1800000,
    industry: 'SaaS',
    location: 'Phoenix, Arizona',
    description: 'Established analytics platform with strong market presence and loyal customer base. Includes all technology, premium market position.',
    highlights: 'Exclusive Territory, Long-term Contracts, Premium Market',
    original_url: 'https://www.bizbuysell.com/business-for-sale/analytics-platform-phoenix-az/123459',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Engineering Consultancy',
    asking_price: 775000,
    annual_revenue: 600000,
    industry: 'Professional Services',
    location: 'Tampa, Florida',
    description: 'Successful consultancy operation with 11 years of proven track record. Modern systems and established client relationships.',
    highlights: 'Profitable, Established, Growing',
    original_url: 'https://www.bizbuysell.com/business-for-sale/engineering-consultancy-tampa-fl/123460',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Award-Winning Pizza Restaurant',
    asking_price: 1700000,
    annual_revenue: 750000,
    industry: 'Food & Beverage',
    location: 'Boston, Massachusetts',
    description: 'Well-performing hospitality business specializing in pizza. Consistent revenue growth and excellent reputation in local market.',
    highlights: 'Award-Winning, Consistent Growth, Local Reputation',
    original_url: 'https://www.bizbuysell.com/business-for-sale/pizza-restaurant-boston-ma/123461',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Accounting Practice',
    asking_price: 300000,
    annual_revenue: 200000,
    industry: 'Professional Services',
    location: 'Austin, Texas',
    description: 'Premium accounting clinic with excellent growth potential. Located in high-traffic area with strong local presence.',
    highlights: 'Growing, Premium Location, Strong Local Presence',
    original_url: 'https://www.bizbuysell.com/business-for-sale/accounting-practice-austin-tx/123462',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Craft Brewery & Restaurant',
    asking_price: 2050000,
    annual_revenue: 1800000,
    industry: 'Food & Beverage',
    location: 'Portland, Oregon',
    description: 'Successful brewery operation with 6 years of proven track record. Modern systems and established customer base.',
    highlights: 'Award-Winning, 6 Years Operating, Modern Systems',
    original_url: 'https://www.bizbuysell.com/business-for-sale/craft-brewery-portland-or/123463',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Artisan Coffee Roastery',
    asking_price: 320000,
    annual_revenue: 180000,
    industry: 'Food & Beverage',
    location: 'Seattle, Washington',
    description: 'Boutique coffee roastery with wholesale and retail operations. Established brand and loyal customer following.',
    highlights: 'Established Brand, Wholesale & Retail, Loyal Customers',
    original_url: 'https://www.bizbuysell.com/business-for-sale/coffee-roastery-seattle-wa/123464',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Automotive Service Centers',
    asking_price: 1350000,
    annual_revenue: 950000,
    industry: 'Automotive',
    location: 'Las Vegas, Nevada',
    description: 'Multi-location automotive service business with strong reputation and recurring customer base.',
    highlights: 'Multi-Location, Strong Reputation, Recurring Revenue',
    original_url: 'https://www.bizbuysell.com/business-for-sale/auto-service-las-vegas-nv/123465',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Manufacturing Equipment Supplier',
    asking_price: 4200000,
    annual_revenue: 2100000,
    industry: 'Manufacturing',
    location: 'Houston, Texas',
    description: 'Industrial equipment supply company serving oil & gas and manufacturing sectors. Established relationships and inventory.',
    highlights: 'Oil & Gas Clients, Established Relationships, Large Inventory',
    original_url: 'https://www.bizbuysell.com/business-for-sale/equipment-supplier-houston-tx/123466',
    scraped_at: '2025-06-25'
  },
  {
    name: 'Local Restaurant Chain',
    asking_price: 875000,
    annual_revenue: 650000,
    industry: 'Food & Beverage',
    location: 'San Diego, California',
    description: 'Regional restaurant chain with two profitable locations. Strong local brand recognition and growth opportunities.',
    highlights: 'Two Locations, Strong Brand, Growth Opportunities',
    original_url: 'https://www.bizbuysell.com/business-for-sale/restaurant-chain-san-diego-ca/123467',
    scraped_at: '2025-06-25'
  }
];

// CSV writer setup
const csvWriter = createCsvWriter.createObjectCsvWriter({
  path: 'business-listings.csv',
  header: [
    { id: 'name', title: 'Business Name' },
    { id: 'asking_price', title: 'Asking Price ($)' },
    { id: 'annual_revenue', title: 'Annual Revenue ($)' },
    { id: 'industry', title: 'Industry' },
    { id: 'location', title: 'Location' },
    { id: 'description', title: 'Description' },
    { id: 'highlights', title: 'Key Highlights' },
    { id: 'original_url', title: 'URL' },
    { id: 'scraped_at', title: 'Scraped Date' }
  ]
});

async function generateDemoCSV() {
  console.log('🚀 Demo Business Listings CSV Generator');
  console.log('======================================');
  console.log(`📊 Generating ${DEMO_BUSINESSES.length} sample business listings...`);
  
  try {
    await csvWriter.writeRecords(DEMO_BUSINESSES);
    
    console.log(`\\n✅ Successfully created business-listings.csv`);
    console.log(`📁 File location: ${process.cwd()}/business-listings.csv`);
    
    // Show statistics
    const industries = [...new Set(DEMO_BUSINESSES.map(b => b.industry))];
    const totalValue = DEMO_BUSINESSES.reduce((sum, b) => sum + b.asking_price, 0);
    const avgPrice = Math.round(totalValue / DEMO_BUSINESSES.length);
    const minPrice = Math.min(...DEMO_BUSINESSES.map(b => b.asking_price));
    const maxPrice = Math.max(...DEMO_BUSINESSES.map(b => b.asking_price));
    
    console.log('\\n📊 Dataset Statistics:');
    console.log(`   Total Listings: ${DEMO_BUSINESSES.length}`);
    console.log(`   Industries: ${industries.length} (${industries.join(', ')})`);
    console.log(`   Total Portfolio Value: $${totalValue.toLocaleString()}`);
    console.log(`   Average Price: $${avgPrice.toLocaleString()}`);
    console.log(`   Price Range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`);
    
    console.log('\\n📋 Sample Listings:');
    DEMO_BUSINESSES.slice(0, 5).forEach((business, i) => {
      console.log(`${i + 1}. ${business.name} - $${business.asking_price.toLocaleString()} (${business.industry})`);
    });
    
    console.log('\\n💡 This CSV file contains realistic sample data that mimics BizBuySell listings.');
    console.log('   Use this as a template for your dashboard or data processing needs.');
    
    // Check file size
    const stats = fs.statSync('business-listings.csv');
    console.log(`\\n📁 File size: ${(stats.size / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('❌ Error creating CSV:', error.message);
    process.exit(1);
  }
}

generateDemoCSV();