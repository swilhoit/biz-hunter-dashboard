#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ueemtnohgkovwzodzxdr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjcyOTUsImV4cCI6MjA2NjQ0MzI5NX0.6_bLS2rSI-XsSwwVB5naQS7OYtyemtXvjn2y5MUM9xk';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create MCP server
const server = new Server(
  {
    name: 'biz-hunter-context',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'listings://saved',
        name: 'Saved Business Listings',
        description: 'Access saved business listings from the database',
        mimeType: 'application/json',
      },
      {
        uri: 'listings://favorites',
        name: 'Favorite Listings',
        description: 'Access favorite business listings',
        mimeType: 'application/json',
      },
      {
        uri: 'scrapers://status',
        name: 'Scraper Status',
        description: 'Get the status of all scrapers',
        mimeType: 'application/json',
      },
      {
        uri: 'listings://recent',
        name: 'Recent Listings',
        description: 'Get the most recent business listings',
        mimeType: 'application/json',
      },
      {
        uri: 'analytics://summary',
        name: 'Analytics Summary',
        description: 'Get analytics summary for the dashboard',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'listings://saved': {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('is_saved', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch saved listings: ${error.message}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ count: data?.length || 0, listings: data }, null, 2),
          },
        ],
      };
    }

    case 'listings://favorites': {
      const { data, error } = await supabase
        .from('saved_listings')
        .select(`
          *,
          listing_id,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Failed to fetch favorites: ${error.message}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ count: data?.length || 0, favorites: data }, null, 2),
          },
        ],
      };
    }

    case 'listings://recent': {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(`Failed to fetch recent listings: ${error.message}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ count: data?.length || 0, listings: data }, null, 2),
          },
        ],
      };
    }

    case 'scrapers://status': {
      const { data, error } = await supabase
        .from('scraper_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // If table doesn't exist, provide basic status
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ 
                message: 'Scraper runs table not found or accessible',
                error: error.message,
                status: 'unknown'
              }, null, 2),
            },
          ],
        };
      }

      // Group by scraper name to get latest status
      const statusByScraper = {};
      data?.forEach(run => {
        if (!statusByScraper[run.scraper_name] || 
            new Date(run.created_at) > new Date(statusByScraper[run.scraper_name].created_at)) {
          statusByScraper[run.scraper_name] = run;
        }
      });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ 
              count: Object.keys(statusByScraper).length,
              scrapers: statusByScraper 
            }, null, 2),
          },
        ],
      };
    }

    case 'analytics://summary': {
      // Get counts of various entities
      const [listingsResult, favoritesResult] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('saved_listings').select('*', { count: 'exact', head: true })
      ]);

      const summary = {
        total_listings: listingsResult.count || 0,
        total_favorites: favoritesResult.count || 0,
        last_updated: new Date().toISOString(),
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Add tool for executing custom queries
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'query_listings': {
      const { filters = {}, limit = 50 } = args;
      
      let query = supabase.from('listings').select('*');
      
      // Apply filters
      if (filters.site) {
        query = query.eq('site', filters.site);
      }
      if (filters.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }
      
      query = query.order('created_at', { ascending: false }).limit(limit);
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              count: data?.length || 0,
              filters_applied: filters,
              listings: data 
            }, null, 2),
          },
        ],
      };
    }
    
    case 'get_site_stats': {
      const { data, error } = await supabase
        .from('listings')
        .select('site')
        .order('site');
        
      if (error) {
        throw new Error(`Failed to get site stats: ${error.message}`);
      }
      
      // Count by site
      const siteStats = {};
      data?.forEach(listing => {
        siteStats[listing.site] = (siteStats[listing.site] || 0) + 1;
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(siteStats, null, 2),
          },
        ],
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_listings',
        description: 'Query business listings with custom filters',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              properties: {
                site: { type: 'string', description: 'Filter by site name' },
                min_price: { type: 'number', description: 'Minimum price filter' },
                max_price: { type: 'number', description: 'Maximum price filter' },
                title: { type: 'string', description: 'Search in title' },
              },
            },
            limit: { type: 'number', description: 'Number of results to return', default: 50 },
          },
        },
      },
      {
        name: 'get_site_stats',
        description: 'Get statistics for all scraped sites',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Biz Hunter MCP server started successfully');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});