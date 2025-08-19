import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID || 'biz-hunter-oauth',
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) : undefined
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const query = `
      SELECT 
        COUNT(*) as total_listings,
        AVG(asking_price_numeric) as avg_price,
        AVG(revenue_numeric) as avg_revenue,
        AVG(price_to_revenue_multiple) as avg_multiple,
        COUNT(DISTINCT source) as total_sources,
        COUNT(CASE WHEN LOWER(business_model) LIKE '%fba%' THEN 1 END) as amazon_fba_count
      FROM \`biz-hunter-oauth.business_listings.businesses_all_sites_view\`
    `;

    const [rows] = await bigquery.query(query);
    res.status(200).json(rows[0]);

  } catch (error) {
    console.error('BigQuery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
}