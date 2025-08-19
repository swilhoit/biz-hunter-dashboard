import { BigQuery } from '@google-cloud/bigquery';

async function testBigQueryData() {
  try {
    console.log('🔍 Testing BigQuery Data Freshness...\n');
    
    // Initialize BigQuery client
    const bigquery = new BigQuery({
      projectId: 'biz-hunter-oauth'
    });
    
    // Query to check the most recent data
    const query = `
      SELECT 
        source_site,
        COUNT(*) as count,
        MAX(scraped_at) as latest_scraped_at,
        MIN(scraped_at) as oldest_scraped_at
      FROM \`biz-hunter-oauth.business_listings.businesses_all_sites_view\`
      GROUP BY source_site
      ORDER BY latest_scraped_at DESC
    `;
    
    console.log('📊 Checking data freshness by source...\n');
    
    const options = {
      query: query,
      location: 'US',
    };
    
    const [rows] = await bigquery.query(options);
    
    console.log('Source Site | Count | Latest Data | Oldest Data');
    console.log('------------|-------|-------------|------------');
    
    rows.forEach(row => {
      const latestDate = row.latest_scraped_at ? new Date(row.latest_scraped_at.value || row.latest_scraped_at) : null;
      const oldestDate = row.oldest_scraped_at ? new Date(row.oldest_scraped_at.value || row.oldest_scraped_at) : null;
      
      console.log(
        `${row.source_site.padEnd(12)} | ${String(row.count).padEnd(5)} | ${
          latestDate ? latestDate.toISOString().split('T')[0] : 'N/A'
        } | ${
          oldestDate ? oldestDate.toISOString().split('T')[0] : 'N/A'
        }`
      );
    });
    
    // Check total count and overall date range
    const totalQuery = `
      SELECT 
        COUNT(*) as total_count,
        MAX(scraped_at) as latest_overall,
        MIN(scraped_at) as oldest_overall
      FROM \`biz-hunter-oauth.business_listings.businesses_all_sites_view\`
    `;
    
    const [totalRows] = await bigquery.query({
      query: totalQuery,
      location: 'US',
    });
    
    const totalRow = totalRows[0];
    const latestOverall = totalRow.latest_overall ? new Date(totalRow.latest_overall.value || totalRow.latest_overall) : null;
    const oldestOverall = totalRow.oldest_overall ? new Date(totalRow.oldest_overall.value || totalRow.oldest_overall) : null;
    
    console.log('\n📈 Overall Statistics:');
    console.log(`Total Listings: ${totalRow.total_count}`);
    console.log(`Latest Data: ${latestOverall ? latestOverall.toISOString() : 'N/A'}`);
    console.log(`Oldest Data: ${oldestOverall ? oldestOverall.toISOString() : 'N/A'}`);
    
    if (latestOverall) {
      const daysSinceUpdate = Math.floor((new Date() - latestOverall) / (1000 * 60 * 60 * 24));
      console.log(`\n⚠️  Data is ${daysSinceUpdate} days old`);
      
      if (daysSinceUpdate > 7) {
        console.log('❌ Data appears to be stale. The ETL pipeline may not be running.');
        console.log('\n🔧 Possible solutions:');
        console.log('1. Check if the data scraping/ETL pipeline is running');
        console.log('2. Verify BigQuery dataset permissions and access');
        console.log('3. Check if the source websites have changed their structure');
        console.log('4. Review any scheduled jobs or Cloud Functions that populate this data');
      } else {
        console.log('✅ Data is relatively fresh');
      }
    }
    
    // Check a sample of recent listings
    const sampleQuery = `
      SELECT 
        title,
        source_site,
        scraped_at,
        price,
        listing_url
      FROM \`biz-hunter-oauth.business_listings.businesses_all_sites_view\`
      ORDER BY scraped_at DESC
      LIMIT 5
    `;
    
    const [sampleRows] = await bigquery.query({
      query: sampleQuery,
      location: 'US',
    });
    
    console.log('\n📋 5 Most Recent Listings:');
    console.log('------------------------');
    sampleRows.forEach((row, index) => {
      const scrapedDate = row.scraped_at ? new Date(row.scraped_at.value || row.scraped_at) : null;
      console.log(`\n${index + 1}. ${row.title || 'Untitled'}`);
      console.log(`   Source: ${row.source_site}`);
      console.log(`   Price: $${row.price ? row.price.toLocaleString() : 'N/A'}`);
      console.log(`   Scraped: ${scrapedDate ? scrapedDate.toISOString() : 'N/A'}`);
      console.log(`   URL: ${row.listing_url || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error querying BigQuery:', error.message);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Ensure you have proper Google Cloud credentials set up');
    console.log('2. Check if you have access to the project: biz-hunter-oauth');
    console.log('3. Verify the dataset and table exist: business_listings.businesses_all_sites_view');
    console.log('4. Run: gcloud auth application-default login');
  }
}

// Run the test
testBigQueryData();