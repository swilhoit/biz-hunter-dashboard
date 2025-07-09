/**
 * Demo/Test file to show what the Share of Voice report actually does
 * This demonstrates the complete data flow and calculations
 */

import { calculateShareOfVoice, BrandShareOfVoice, ShareOfVoiceReport } from './shareOfVoiceAnalysis';

// Example of what JungleScout API returns (based on actual product attributes)
const mockJungleScoutResponse = {
  data: [
    {
      id: 'B08N5WRWNW', // Echo Dot (4th Gen)
      attributes: {
        title: 'Echo Dot (4th Gen) Smart speaker with Alexa',
        brand: 'Amazon',
        category: 'Electronics',
        approximate_30_day_revenue: 2500000,
        approximate_30_day_units_sold: 50000,
        price: 49.99,
        rating: 4.6,
        reviews: 250000,
        rank: 5
      }
    },
    {
      id: 'B07FZ8S74R',
      attributes: {
        title: 'Echo Dot (3rd Gen) - Smart speaker with Alexa',
        brand: 'Amazon',
        category: 'Electronics',
        approximate_30_day_revenue: 1500000,
        approximate_30_day_units_sold: 37500,
        price: 39.99,
        rating: 4.5,
        reviews: 500000,
        rank: 12
      }
    },
    {
      id: 'B09N711D7J',
      attributes: {
        title: 'Google Nest Mini Smart Speaker',
        brand: 'Google',
        category: 'Electronics',
        approximate_30_day_revenue: 1200000,
        approximate_30_day_units_sold: 30000,
        price: 39.99,
        rating: 4.5,
        reviews: 150000,
        rank: 25
      }
    },
    {
      id: 'B086TXRZ3Q',
      attributes: {
        title: 'Apple HomePod mini - Smart Speaker',
        brand: 'Apple',
        category: 'Electronics',
        approximate_30_day_revenue: 900000,
        approximate_30_day_units_sold: 9000,
        price: 99.99,
        rating: 4.6,
        reviews: 50000,
        rank: 45
      }
    },
    {
      id: 'B08YWCZ7Y4',
      attributes: {
        title: 'Bose Smart Speaker 300',
        brand: 'Bose',
        category: 'Electronics',
        approximate_30_day_revenue: 600000,
        approximate_30_day_units_sold: 3000,
        price: 199.99,
        rating: 4.4,
        reviews: 10000,
        rank: 150
      }
    }
  ]
};

/**
 * What the Share of Voice Report ACTUALLY calculates:
 */
export function demonstrateShareOfVoiceCalculations() {
  const products = mockJungleScoutResponse.data;
  
  // 1. MARKET REVENUE CALCULATION
  const totalMarketRevenue = products.reduce((sum, p) => 
    sum + p.attributes.approximate_30_day_revenue, 0
  );
  console.log('Total Market Revenue (30 days):', totalMarketRevenue); 
  // = $6,700,000
  
  // 2. BRAND GROUPING AND METRICS
  const brandMetrics: Record<string, any> = {};
  
  products.forEach(product => {
    const brand = product.attributes.brand;
    if (!brandMetrics[brand]) {
      brandMetrics[brand] = {
        products: [],
        totalRevenue: 0,
        totalUnits: 0,
        totalReviews: 0,
        totalRating: 0
      };
    }
    
    brandMetrics[brand].products.push(product);
    brandMetrics[brand].totalRevenue += product.attributes.approximate_30_day_revenue;
    brandMetrics[brand].totalUnits += product.attributes.approximate_30_day_units_sold;
    brandMetrics[brand].totalReviews += product.attributes.reviews;
    brandMetrics[brand].totalRating += product.attributes.rating;
  });
  
  // 3. CALCULATE SHARE OF VOICE METRICS
  const shareOfVoiceResults = Object.entries(brandMetrics).map(([brand, data]) => {
    const marketShare = (data.totalRevenue / totalMarketRevenue) * 100;
    const avgRating = data.totalRating / data.products.length;
    const avgReviews = data.totalReviews / data.products.length;
    
    return {
      brand,
      marketShare: marketShare.toFixed(2) + '%',
      revenue30Days: '$' + data.totalRevenue.toLocaleString(),
      unitsSold30Days: data.totalUnits.toLocaleString(),
      productCount: data.products.length,
      avgRating: avgRating.toFixed(1),
      avgReviews: avgReviews.toLocaleString()
    };
  });
  
  console.log('\nShare of Voice Results:');
  console.table(shareOfVoiceResults);
  
  // 4. KEYWORD SHARE CALCULATION
  // For keyword "smart speaker"
  const keyword = 'smart speaker';
  const productsWithKeyword = products.filter(p => 
    p.attributes.title.toLowerCase().includes(keyword)
  );
  
  const keywordShareByBrand: Record<string, number> = {};
  productsWithKeyword.forEach(product => {
    const brand = product.attributes.brand;
    keywordShareByBrand[brand] = (keywordShareByBrand[brand] || 0) + 1;
  });
  
  console.log('\nKeyword Share for "smart speaker":');
  Object.entries(keywordShareByBrand).forEach(([brand, count]) => {
    const percentage = (count / productsWithKeyword.length) * 100;
    console.log(`${brand}: ${count} products (${percentage.toFixed(0)}%)`);
  });
  
  // 5. MARKET CONCENTRATION (Herfindahl Index)
  const marketShares = Object.values(brandMetrics).map(data => 
    (data.totalRevenue / totalMarketRevenue) * 100
  );
  const herfindahlIndex = marketShares.reduce((sum, share) => 
    sum + Math.pow(share / 100, 2), 0
  );
  
  console.log('\nMarket Concentration:');
  console.log('Herfindahl Index:', (herfindahlIndex * 10000).toFixed(0));
  console.log('Market Type:', herfindahlIndex > 0.25 ? 'Highly Concentrated' : 
    herfindahlIndex > 0.15 ? 'Moderately Concentrated' : 'Competitive');
  
  return {
    totalMarketRevenue,
    brandMetrics: shareOfVoiceResults,
    marketConcentration: herfindahlIndex
  };
}

/**
 * What data points are ACTUALLY used from JungleScout:
 * 
 * 1. approximate_30_day_revenue - Monthly revenue estimates
 * 2. approximate_30_day_units_sold - Monthly unit sales
 * 3. brand - Brand name for grouping
 * 4. category - Product category
 * 5. rating - Product rating (1-5)
 * 6. reviews - Review count
 * 7. price - Current price
 * 8. title - Product title (for keyword analysis)
 * 9. rank - Best Seller Rank
 * 
 * The report is 100% Amazon-focused using JungleScout data.
 * No social media data is actually used (the type definitions 
 * mentioning social are from a different feature).
 */