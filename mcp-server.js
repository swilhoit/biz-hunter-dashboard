#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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
    },
  }
);

// Define resources
server.setRequestHandler('resources/list', async () => {
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
    ],
  };
});

// Handle resource reading
server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'listings://saved': {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch listings: ${error.message}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    case 'listings://favorites': {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listings (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch favorites: ${error.message}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
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
        throw new Error(`Failed to fetch scraper status: ${error.message}`);
      }

      // Group by scraper name to get latest status
      const statusByScraper = {};
      data.forEach(run => {
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
            text: JSON.stringify(statusByScraper, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});