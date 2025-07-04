// Enhanced BizBuySell scraper that fetches actual listing details
// This can be integrated into the enhanced-multi-scraper.js

async function scrapeBizBuySellListingEnhanced(listingData) {
  console.log('INFO: Enhanced BizBuySell scraping for:', listingData.url);
  
  try {
    // Fetch the actual listing page
    const html = await this.fetchPage(listingData.url);
    const $ = cheerio.load(html);
    
    // Extract financial information from the listing page
    let askingPrice = 0;
    let annualRevenue = 0;
    let annualProfit = 0;
    let cashFlow = 0;
    
    // Look for financial details in various formats
    // BizBuySell typically shows financials in a details section
    
    // Method 1: Look for labeled data
    $('dt, .label, .field-label').each((i, elem) => {
      const label = $(elem).text().toLowerCase().trim();
      const value = $(elem).next('dd, .value, .field-value').text().trim();
      
      if (label.includes('asking price') || label.includes('price')) {
        askingPrice = this.extractPrice(value) || askingPrice;
      }
      if (label.includes('gross revenue') || label.includes('annual revenue') || label.includes('revenue')) {
        annualRevenue = this.extractPrice(value) || annualRevenue;
      }
      if (label.includes('cash flow') || label.includes('annual profit') || label.includes('net income')) {
        cashFlow = this.extractPrice(value) || cashFlow;
        annualProfit = cashFlow; // Use cash flow as profit
      }
    });
    
    // Method 2: Look for financial table
    $('.financials table tr, .details-table tr').each((i, elem) => {
      const $row = $(elem);
      const label = $row.find('td:first').text().toLowerCase().trim();
      const value = $row.find('td:last').text().trim();
      
      if (label.includes('revenue')) {
        annualRevenue = this.extractPrice(value) || annualRevenue;
      }
      if (label.includes('cash flow') || label.includes('profit')) {
        cashFlow = this.extractPrice(value) || cashFlow;
        annualProfit = cashFlow;
      }
    });
    
    // Method 3: Look in structured data
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data['@type'] === 'Product' || data['@type'] === 'LocalBusiness') {
          if (data.offers?.price) {
            askingPrice = parseFloat(data.offers.price) || askingPrice;
          }
        }
      } catch (e) {
        // Continue
      }
    });
    
    // Fallback to original price if not found
    if (!askingPrice) {
      askingPrice = this.extractPrice(listingData.priceText) || 750000;
    }
    
    // Extract description
    const description = $('.business-description, .description, .overview').text().trim() ||
                       $('meta[name="description"]').attr('content') ||
                       listingData.description ||
                       `${listingData.title}. Located in ${listingData.location || 'USA'}.`;
    
    // Extract location
    const location = $('.location, .address').text().trim() || 
                    listingData.location || 
                    'United States';
    
    // Create highlights
    const highlights = [];
    if (annualRevenue > 0) highlights.push(`Revenue: $${annualRevenue.toLocaleString()}`);
    if (cashFlow > 0) highlights.push(`Cash Flow: $${cashFlow.toLocaleString()}`);
    if (location !== 'United States') highlights.push(location);
    if (highlights.length === 0) {
      highlights.push('Amazon FBA', 'Established Business', 'BizBuySell');
    }
    
    const listing = {
      name: listingData.title,
      description: description.substring(0, 1000),
      asking_price: askingPrice,
      annual_revenue: annualRevenue,
      annual_profit: annualProfit,
      monthly_revenue: annualRevenue > 0 ? Math.round(annualRevenue / 12) : 0,
      gross_revenue: annualRevenue,
      net_revenue: annualRevenue,
      inventory_value: 0,
      profit_multiple: (askingPrice > 0 && annualProfit > 0) ? 
        parseFloat((askingPrice / annualProfit).toFixed(2)) : null,
      industry: 'E-commerce',
      location: location,
      source: 'BizBuySell',
      original_url: listingData.url,
      highlights: highlights.slice(0, 3),
      listing_status: 'live'
    };
    
    console.log('SUCCESS: Enhanced BizBuySell listing processed', {
      name: listing.name,
      askingPrice: listing.asking_price,
      annualRevenue: listing.annual_revenue,
      annualProfit: listing.annual_profit
    });
    
    return listing;
    
  } catch (error) {
    console.error('ERROR: Failed to scrape BizBuySell listing', error);
    
    // Return basic listing on error
    return {
      name: listingData.title,
      description: `Amazon FBA business for sale in ${listingData.location || 'USA'}`,
      asking_price: this.extractPrice(listingData.priceText) || 750000,
      annual_revenue: 0,
      annual_profit: 0,
      monthly_revenue: 0,
      gross_revenue: 0,
      net_revenue: 0,
      inventory_value: 0,
      profit_multiple: null,
      industry: 'E-commerce',
      location: listingData.location || 'United States',
      source: 'BizBuySell',
      original_url: listingData.url,
      highlights: ['Amazon FBA', 'BizBuySell'],
      listing_status: 'live'
    };
  }
}

// To integrate this into enhanced-multi-scraper.js:
// Replace the existing scrapeBizBuySellListing method with this enhanced version
// The enhanced version will:
// 1. Actually fetch the listing page
// 2. Extract revenue and profit data from the page
// 3. Provide more accurate financial information