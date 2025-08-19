import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
let bigquery;
try {
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) : undefined;
  
  bigquery = new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID || 'biz-hunter-oauth',
    credentials: credentials
  });
} catch (error) {
  console.error('Failed to initialize BigQuery:', error);
  // Fallback to default credentials (for local development)
  bigquery = new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID || 'biz-hunter-oauth'
  });
}

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
    const { id } = req.query;
    
    const query = `
      SELECT 
        listing_id as id,
        source as source_site,
        source_url as listing_url,
        title as business_name,
        asking_price_numeric as asking_price,
        revenue_numeric as annual_revenue,
        cash_flow_numeric as cash_flow,
        price_to_revenue_multiple as multiple,
        COALESCE(city, state, country, location_raw) as location,
        COALESCE(category, business_type) as industry,
        description,
        business_model as amazon_business_type,
        FALSE as is_amazon_fba,
        0 as inventory_value,
        established_year,
        0 as monthly_traffic,
        FALSE as seller_financing,
        '' as reason_for_selling,
        scraped_at as date_listed,
        last_updated as updated_at
      FROM \`biz-hunter-oauth.business_listings.businesses_all_sites_view\`
      WHERE listing_id = @id
      LIMIT 1
    `;
    
    const options = {
      query: query,
      params: { id: String(id) },
      location: 'US',
    };

    const [rows] = await bigquery.query(options);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const row = rows[0];
    const listing = {
      id: row.id,
      business_name: row.business_name || 'Untitled Business',
      asking_price: parseFloat(row.asking_price) || 0,
      annual_revenue: parseFloat(row.annual_revenue) || 0,
      cash_flow: parseFloat(row.cash_flow) || 0,
      location: row.location || 'Not specified',
      industry: row.industry || 'Not specified',
      description: row.description || '',
      listing_url: row.listing_url,
      source: row.source_site,
      date_listed: row.date_listed?.value || row.date_listed,
      multiple: parseFloat(row.multiple) || 0,
      inventory_value: parseFloat(row.inventory_value) || 0,
      is_amazon_fba: row.is_amazon_fba || false,
      amazon_business_type: row.amazon_business_type,
      established_year: row.established_year,
      monthly_traffic: row.monthly_traffic,
      seller_financing: row.seller_financing,
      reason_for_selling: row.reason_for_selling,
      status: 'active',
      created_at: row.date_listed?.value || row.date_listed,
      updated_at: (row.updated_at?.value || row.updated_at) || (row.date_listed?.value || row.date_listed),
      // Calculate monthly values if not present
      monthly_revenue: row.monthly_revenue || (row.annual_revenue ? parseFloat(row.annual_revenue) / 12 : 0),
      monthly_profit: row.monthly_profit || (row.cash_flow ? parseFloat(row.cash_flow) / 12 : 0),
      annual_profit: row.cash_flow || 0,
      valuation_multiple: parseFloat(row.multiple) || 0,
      marketplace: row.source_site
    };

    res.status(200).json(listing);

  } catch (error) {
    console.error('BigQuery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch listing',
      details: error.message 
    });
  }
}