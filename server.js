import express from 'express';
import cors from 'cors';
import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: 'tetrahedron-366117'
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// BigQuery API endpoints
app.get('/api/bigquery/listings', async (req, res) => {
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
      limit = 100,
      offset = 0
    } = req.query;

    // Build the query
    let query = `
      SELECT 
        id,
        source_site,
        listing_url,
        title as business_name,
        price as asking_price,
        revenue as annual_revenue,
        cash_flow,
        multiple,
        location,
        industry,
        description,
        amazon_business_type,
        is_amazon_fba,
        inventory_value,
        established_year,
        monthly_traffic,
        seller_financing,
        reason_for_selling,
        scraped_at as date_listed,
        updated_at
      FROM \`tetrahedron-366117.business_listings.businesses_all_sites_view\`
      WHERE 1=1
    `;

    const params = [];

    // Add filters
    if (minPrice) {
      query += ` AND price >= @minPrice`;
      params.push({ name: 'minPrice', value: parseFloat(minPrice) });
    }
    if (maxPrice) {
      query += ` AND price <= @maxPrice`;
      params.push({ name: 'maxPrice', value: parseFloat(maxPrice) });
    }
    if (minRevenue) {
      query += ` AND revenue >= @minRevenue`;
      params.push({ name: 'minRevenue', value: parseFloat(minRevenue) });
    }
    if (maxRevenue) {
      query += ` AND revenue <= @maxRevenue`;
      params.push({ name: 'maxRevenue', value: parseFloat(maxRevenue) });
    }
    if (industry) {
      query += ` AND LOWER(industry) LIKE @industry`;
      params.push({ name: 'industry', value: `%${industry.toLowerCase()}%` });
    }
    if (location) {
      query += ` AND LOWER(location) LIKE @location`;
      params.push({ name: 'location', value: `%${location.toLowerCase()}%` });
    }
    if (source) {
      query += ` AND source_site = @source`;
      params.push({ name: 'source', value: source });
    }
    if (isAmazonFba === 'true') {
      query += ` AND is_amazon_fba = true`;
    }
    if (searchTerm) {
      query += ` AND (
        LOWER(title) LIKE @searchTerm 
        OR LOWER(description) LIKE @searchTerm
        OR LOWER(industry) LIKE @searchTerm
      )`;
      params.push({ name: 'searchTerm', value: `%${searchTerm.toLowerCase()}%` });
    }

    // Add ordering and pagination
    query += ` ORDER BY scraped_at DESC`;
    query += ` LIMIT @limit OFFSET @offset`;
    params.push({ name: 'limit', value: parseInt(limit) });
    params.push({ name: 'offset', value: parseInt(offset) });

    // Execute the query
    const options = {
      query: query,
      params: params,
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
      date_listed: row.date_listed,
      multiple: parseFloat(row.multiple) || 0,
      inventory_value: parseFloat(row.inventory_value) || 0,
      is_amazon_fba: row.is_amazon_fba,
      amazon_business_type: row.amazon_business_type,
      established_year: row.established_year,
      monthly_traffic: row.monthly_traffic,
      seller_financing: row.seller_financing,
      reason_for_selling: row.reason_for_selling,
      status: 'active',
      created_at: row.date_listed,
      updated_at: row.updated_at || row.date_listed
    }));

    res.json({
      listings,
      total: listings.length,
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
});

// Get single listing by ID
app.get('/api/bigquery/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id,
        source_site,
        listing_url,
        title as business_name,
        price as asking_price,
        revenue as annual_revenue,
        cash_flow,
        multiple,
        location,
        industry,
        description,
        amazon_business_type,
        is_amazon_fba,
        inventory_value,
        established_year,
        monthly_traffic,
        seller_financing,
        reason_for_selling,
        scraped_at as date_listed,
        updated_at
      FROM \`tetrahedron-366117.business_listings.businesses_all_sites_view\`
      WHERE id = @id
      LIMIT 1
    `;

    const options = {
      query: query,
      params: [{ name: 'id', value: id }],
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
      date_listed: row.date_listed,
      multiple: parseFloat(row.multiple) || 0,
      inventory_value: parseFloat(row.inventory_value) || 0,
      is_amazon_fba: row.is_amazon_fba,
      amazon_business_type: row.amazon_business_type,
      established_year: row.established_year,
      monthly_traffic: row.monthly_traffic,
      seller_financing: row.seller_financing,
      reason_for_selling: row.reason_for_selling,
      status: 'active',
      created_at: row.date_listed,
      updated_at: row.updated_at || row.date_listed
    };

    res.json(listing);

  } catch (error) {
    console.error('BigQuery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch listing',
      details: error.message 
    });
  }
});

// Get aggregated stats
app.get('/api/bigquery/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_listings,
        AVG(price) as avg_price,
        AVG(revenue) as avg_revenue,
        AVG(multiple) as avg_multiple,
        COUNT(DISTINCT source_site) as total_sources,
        COUNT(CASE WHEN is_amazon_fba = true THEN 1 END) as amazon_fba_count
      FROM \`tetrahedron-366117.business_listings.businesses_all_sites_view\`
    `;

    const [rows] = await bigquery.query(query);
    res.json(rows[0]);

  } catch (error) {
    console.error('BigQuery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch all for React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`BigQuery project: tetrahedron-366117`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});