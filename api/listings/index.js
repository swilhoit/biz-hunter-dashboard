import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const projectId = process.env.BIGQUERY_PROJECT_ID || 'biz-hunter-oauth';
console.log('Using BigQuery project:', projectId);

let bigquery;
try {
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) : undefined;
  
  bigquery = new BigQuery({
    projectId: projectId,
    credentials: credentials
  });
} catch (error) {
  console.error('Failed to initialize BigQuery:', error);
  // Fallback to default credentials (for local development)
  bigquery = new BigQuery({
    projectId: projectId
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
    const {
      minPrice,
      maxPrice,
      minRevenue,
      maxRevenue,
      industry,
      location,
      source,
      searchTerm,
      isAmazonFba,
      sortBy = 'scraped_at',
      sortDirection = 'desc',
      limit = '100',
      offset = '0'
    } = req.query;

    // Build the query - map actual columns to expected format
    let query = `
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
      WHERE 1=1
      -- Filter for e-commerce businesses only
      AND (
        LOWER(title) LIKE '%online%'
        OR LOWER(title) LIKE '%ecommerce%'
        OR LOWER(title) LIKE '%e-commerce%'
        OR LOWER(title) LIKE '%amazon%'
        OR LOWER(title) LIKE '%fba%'
        OR LOWER(title) LIKE '%shopify%'
        OR LOWER(title) LIKE '%dropship%'
        OR LOWER(title) LIKE '%digital%'
        OR LOWER(title) LIKE '%saas%'
        OR LOWER(title) LIKE '%software%'
        OR LOWER(title) LIKE '%app%'
        OR LOWER(title) LIKE '%subscription%'
        OR LOWER(category) LIKE '%online%'
        OR LOWER(category) LIKE '%ecommerce%'
        OR LOWER(category) LIKE '%e-commerce%'
        OR LOWER(category) LIKE '%amazon%'
        OR LOWER(category) LIKE '%fba%'
        OR LOWER(category) LIKE '%digital%'
        OR LOWER(description) LIKE '%online%'
        OR LOWER(description) LIKE '%ecommerce%'
        OR LOWER(description) LIKE '%e-commerce%'
        OR LOWER(description) LIKE '%amazon%'
        OR LOWER(description) LIKE '%fba%'
        OR LOWER(description) LIKE '%shopify%'
        OR source IN ('empireflippers', 'flippa', 'quietlight', 'feinternational')
      )
      -- Exclude non-ecommerce businesses
      AND NOT (
        LOWER(title) LIKE '%restaurant%'
        OR LOWER(title) LIKE '%hotel%'
        OR LOWER(title) LIKE '%motel%'
        OR LOWER(title) LIKE '%salon%'
        OR LOWER(title) LIKE '%barbershop%'
        OR LOWER(title) LIKE '%daycare%'
        OR LOWER(title) LIKE '%laundromat%'
        OR LOWER(title) LIKE '%car wash%'
        OR LOWER(title) LIKE '%auto repair%'
        OR LOWER(title) LIKE '%gas station%'
        OR LOWER(title) LIKE '%convenience store%'
        OR LOWER(title) LIKE '%liquor store%'
        OR LOWER(title) LIKE '%gym%'
        OR LOWER(title) LIKE '%fitness center%'
        OR LOWER(title) LIKE '%medical%'
        OR LOWER(title) LIKE '%dental%'
        OR LOWER(title) LIKE '%clinic%'
        OR LOWER(title) LIKE '%plumbing%'
        OR LOWER(title) LIKE '%hvac%'
        OR LOWER(title) LIKE '%electrical%'
        OR LOWER(title) LIKE '%construction%'
        OR LOWER(title) LIKE '%landscaping%'
        OR LOWER(title) LIKE '%lawn care%'
        OR LOWER(title) LIKE '%trucking%'
        OR LOWER(title) LIKE '%freight%'
        OR LOWER(title) LIKE '%restoration%'
        OR LOWER(title) LIKE '%cleaning service%'
        OR LOWER(title) LIKE '%franchise%restoration%'
        OR LOWER(title) LIKE '%inn %'
        OR LOWER(title) LIKE '%venture capital%'
      )
    `;

    const params = [];

    // Add filters
    if (minPrice) {
      query += ` AND asking_price_numeric >= @minPrice`;
      params.push({ name: 'minPrice', value: parseFloat(minPrice) });
    }
    if (maxPrice) {
      query += ` AND asking_price_numeric <= @maxPrice`;
      params.push({ name: 'maxPrice', value: parseFloat(maxPrice) });
    }
    if (minRevenue) {
      query += ` AND revenue_numeric >= @minRevenue`;
      params.push({ name: 'minRevenue', value: parseFloat(minRevenue) });
    }
    if (maxRevenue) {
      query += ` AND revenue_numeric <= @maxRevenue`;
      params.push({ name: 'maxRevenue', value: parseFloat(maxRevenue) });
    }
    if (industry) {
      query += ` AND (LOWER(category) LIKE @industry OR LOWER(business_type) LIKE @industry)`;
      params.push({ name: 'industry', value: `%${industry.toLowerCase()}%` });
    }
    if (location) {
      query += ` AND (LOWER(city) LIKE @location OR LOWER(state) LIKE @location OR LOWER(country) LIKE @location OR LOWER(location_raw) LIKE @location)`;
      params.push({ name: 'location', value: `%${location.toLowerCase()}%` });
    }
    if (source) {
      query += ` AND source = @source`;
      params.push({ name: 'source', value: source });
    }
    if (isAmazonFba === 'true') {
      query += ` AND (LOWER(business_model) LIKE '%fba%' OR LOWER(title) LIKE '%fba%')`;
    }
    if (searchTerm) {
      query += ` AND (
        LOWER(title) LIKE @searchTerm 
        OR LOWER(description) LIKE @searchTerm
        OR LOWER(category) LIKE @searchTerm
        OR LOWER(business_type) LIKE @searchTerm
      )`;
      params.push({ name: 'searchTerm', value: `%${searchTerm.toLowerCase()}%` });
    }

    // Add ordering and pagination
    // Map frontend column names to database column names
    const sortColumnMap = {
      'asking_price': 'asking_price_numeric',
      'annual_revenue': 'revenue_numeric',
      'created_at': 'scraped_at',
      'monthly_revenue': 'revenue_numeric',
      'monthly_profit': 'cash_flow_numeric',
      'scraped_at': 'scraped_at'
    };
    
    const sortColumn = sortColumnMap[sortBy] || sortBy;
    const sortDir = sortDirection.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDir}`;
    query += ` LIMIT @limit OFFSET @offset`;
    params.push({ name: 'limit', value: parseInt(limit) });
    params.push({ name: 'offset', value: parseInt(offset) });

    // First, get the total count without pagination
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    countQuery = countQuery.replace(/ORDER BY[\s\S]*$/, ''); // Remove ORDER BY and LIMIT/OFFSET
    
    // Execute count query
    const countParams = params.filter(p => p.name !== 'limit' && p.name !== 'offset');
    const countParamsObj = {};
    countParams.forEach(param => {
      countParamsObj[param.name] = param.value;
    });
    
    const countOptions = {
      query: countQuery,
      params: countParamsObj,
      location: 'US',
    };
    
    const [countResult] = await bigquery.query(countOptions);
    const totalCount = countResult[0]?.total || 0;
    
    // Execute the main query - convert params to object format for BigQuery
    const paramsObj = {};
    params.forEach(param => {
      paramsObj[param.name] = param.value;
    });
    
    const options = {
      query: query,
      params: paramsObj,
      location: 'US',
    };

    const [rows] = await bigquery.query(options);
    
    // Transform the data
    const listings = rows.map(row => ({
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
      updated_at: (row.updated_at?.value || row.updated_at) || (row.date_listed?.value || row.date_listed)
    }));

    res.status(200).json({
      listings,
      total: totalCount,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('BigQuery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch listings',
      details: error.message 
    });
  }
}// Force rebuild Mon Aug 18 21:16:06 PDT 2025
