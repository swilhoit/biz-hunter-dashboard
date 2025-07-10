import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Import API routes
import seoRoutes from './server/api/seo.js';
import filesRoutes from './server/api/files.js';

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Add uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('FATAL: Unhandled rejection:', err);
  process.exit(1);
});

// Load environment variables
dotenv.config();

// For Railway/Render: Copy VITE_ prefixed vars to non-prefixed versions if they don't exist
// Also check for OPEN_AI_API_KEY (with underscore) as seen in .env
// This needs to happen before any other code that might use these vars
if (!process.env.OPENAI_API_KEY) {
  if (process.env.VITE_OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
    console.log('Copied VITE_OPENAI_API_KEY to OPENAI_API_KEY');
  } else if (process.env.OPEN_AI_API_KEY) {
    process.env.OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;
    console.log('Copied OPEN_AI_API_KEY to OPENAI_API_KEY');
  }
}

// Also ensure OPEN_AI_API_KEY is set from OPENAI_API_KEY if needed
if (!process.env.OPEN_AI_API_KEY && process.env.OPENAI_API_KEY) {
  process.env.OPEN_AI_API_KEY = process.env.OPENAI_API_KEY;
}

if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/seo', seoRoutes);
app.use('/api/files', filesRoutes);

// Log environment
console.log('=== Server Starting ===');
console.log('Port:', PORT);
console.log('Node Environment:', process.env.NODE_ENV);
console.log('Server Time:', new Date().toISOString());
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');
console.log('SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? 'SET' : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'SET' : 'NOT SET');

// Detect deployment environment
const isRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
const isRender = !!(process.env.RENDER || process.env.RENDER_SERVICE_NAME);

if (isRailway) {
  console.log('\n🚂 Railway deployment detected - using Railway-optimized configuration');
} else if (isRender) {
  console.log('\n🚀 Render deployment detected');
}

// Store for ongoing operations
const operations = new Map();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Server is running with scraping API'
  });
});

// Add real-time scraping log stream endpoint (Server-Sent Events)
app.get('/api/scrape/stream', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Check if scraper module exists before importing
    const scraperPath = path.join(__dirname, 'enhanced-multi-scraper.js');
    if (!fs.existsSync(scraperPath)) {
      console.error('Enhanced scraper module not found at:', scraperPath);
      sendEvent({ level: 'ERROR', message: 'Scraping module not available in production' });
      return;
    }

    // Dynamically import the enhanced scraper to avoid circular deps / startup cost
    const { default: EnhancedMultiScraper } = await import('./enhanced-multi-scraper.js');

    const scraper = new EnhancedMultiScraper((log) => {
      // Forward each log from scraper to client
      sendEvent(log);
    });

    // selectedSites is passed as comma-separated list via query string
    const { selectedSites } = req.query;
    const siteArray = selectedSites ? selectedSites.split(',') : null;

    const results = await scraper.runTwoStageScraping({ selectedSites: siteArray });

    // Signal completion to client
    sendEvent({ level: 'COMPLETE', message: 'Scraping complete', data: results });
  } catch (error) {
    console.error('❌ [SSE SCRAPE] Failed:', error);
    sendEvent({ level: 'ERROR', message: `Scraping failed: ${error.message}` });
  } finally {
    res.end();
  }
});

// Test endpoint
app.get('/api/test-env', (req, res) => {
  const envVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_') || key === 'PORT' || key === 'NODE_ENV' || key.includes('API_KEY')) {
      envVars[key] = process.env[key] ? 'SET' : 'NOT SET';
    }
  });
  
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    isRailway: isRailway,
    timestamp: new Date().toISOString(),
    environmentVariables: envVars
  });
});

// Diagnostics endpoint for debugging OpenAI issues
app.get('/api/diagnostics', (req, res) => {
  const openAIKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  
  // Get all env vars (filtered for security)
  const allEnvVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.includes('RAILWAY') || key === 'PORT' || key === 'NODE_ENV' || key === 'PATH' || key === 'HOME') {
      allEnvVars[key] = process.env[key].substring(0, 50) + (process.env[key].length > 50 ? '...' : '');
    } else if (key.includes('KEY') || key.includes('OPENAI') || key.includes('SUPABASE') || key.includes('VITE')) {
      allEnvVars[key] = process.env[key] ? 'SET' : 'NOT SET';
    }
  });
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      isRailway: isRailway,
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      execPath: process.execPath
    },
    openai: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `SET (${process.env.OPENAI_API_KEY.length} chars)` : 'NOT SET',
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY ? `SET (${process.env.VITE_OPENAI_API_KEY.length} chars)` : 'NOT SET',
      resolvedKey: openAIKey ? `Found (${openAIKey.length} chars)` : 'NOT FOUND'
    },
    supabase: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    },
    other: {
      SCRAPER_API_KEY: process.env.SCRAPER_API_KEY ? 'SET' : 'NOT SET',
      PORT: process.env.PORT || '3000',
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET'
    },
    allEnvVars: allEnvVars,
    totalEnvVars: Object.keys(process.env).length
  });
});

// OpenAI endpoints
app.post('/api/openai/chat', async (req, res) => {
  try {
    console.log('[OpenAI Chat] Request received');
    const { messages, temperature = 0.7, max_tokens = 2000, model = 'gpt-4o-mini' } = req.body;
    
    // Try multiple possible key names
    const openAIKey = process.env.OPENAI_API_KEY || 
                     process.env.VITE_OPENAI_API_KEY || 
                     process.env.OPEN_AI_API_KEY ||
                     process.env.REACT_APP_OPENAI_API_KEY;
    
    console.log('[OpenAI Chat] Checking for API keys:');
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
    console.log('  VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'SET' : 'NOT SET');
    console.log('  OPEN_AI_API_KEY:', process.env.OPEN_AI_API_KEY ? 'SET' : 'NOT SET');
    console.log('  Resolved key:', openAIKey ? `Found (${openAIKey.length} chars)` : 'NOT FOUND');
    
    if (!openAIKey) {
      console.error('[OpenAI Chat] No API key found in environment');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('KEY')).join(', '));
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    console.log('[OpenAI Chat] Importing OpenAI module...');
    const { default: OpenAI } = await import('openai');
    
    console.log('[OpenAI Chat] Creating OpenAI client...');
    const openai = new OpenAI({ apiKey: openAIKey });
    
    console.log('[OpenAI Chat] Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
    });
    
    console.log('[OpenAI Chat] Success, returning response');
    res.json({ response: completion.choices[0]?.message?.content || '' });
  } catch (error) {
    console.error('[OpenAI Chat] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/openai/vision', async (req, res) => {
  try {
    console.log('[OpenAI Vision] Request received');
    const { image, prompt, max_tokens = 1500 } = req.body;
    
    const openAIKey = process.env.OPENAI_API_KEY || 
                     process.env.VITE_OPENAI_API_KEY || 
                     process.env.OPEN_AI_API_KEY ||
                     process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!openAIKey) {
      console.error('[OpenAI Vision] No API key found in environment');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openAIKey });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } }
          ]
        }
      ],
      max_tokens
    });
    
    res.json({ response: response.choices[0]?.message?.content || '' });
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/openai/analyze-document', async (req, res) => {
  try {
    console.log('[OpenAI Analyze] Request received');
    const { content, fileName, fileType, analysisType } = req.body;
    
    const openAIKey = process.env.OPENAI_API_KEY || 
                     process.env.VITE_OPENAI_API_KEY || 
                     process.env.OPEN_AI_API_KEY ||
                     process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!openAIKey) {
      console.error('[OpenAI Analyze] No API key found in environment');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openAIKey });
    
    const prompt = `Analyze this business document and extract key information:

Document Name: ${fileName}
Document Type: ${fileType}

Content:
${content}

Extract and format as JSON:
{
  "businessName": "...",
  "description": "...",
  "askingPrice": 0,
  "annualRevenue": 0,
  "annualProfit": 0,
  "monthlyRevenue": 0,
  "monthlyProfit": 0,
  "keyFindings": [],
  "financials": {
    "hasDetailedPL": false,
    "profitMargin": 0,
    "revenueGrowth": 0,
    "inventoryValue": 0
  },
  "redFlags": [],
  "opportunities": []
}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a business document analyzer. Extract key business metrics and insights from documents.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    try {
      const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');
      res.json({ analysis });
    } catch (parseError) {
      res.json({ 
        analysis: {
          businessName: 'Document Analysis',
          description: completion.choices[0]?.message?.content || '',
          keyFindings: ['Unable to parse document structure']
        }
      });
    }
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Delete listing endpoint
app.delete('/api/listings/:listingId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Database connection not configured' });
    }

    const { listingId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // First check if the listing exists
    const { data: listing, error: fetchError } = await supabase
      .from('business_listings')
      .select('id, name')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Delete the listing
    const { error: deleteError } = await supabase
      .from('business_listings')
      .delete()
      .eq('id', listingId);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return res.status(500).json({ success: false, message: 'Failed to delete listing' });
    }

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve static files - Try multiple possible locations for dist
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, '..', 'dist'),
  path.join(process.cwd(), 'dist'),
  '/opt/render/project/dist',
  '/opt/render/project/src/dist'
];

let distPath = null;
for (const tryPath of possiblePaths) {
  console.log(`Checking for dist at: ${tryPath} - exists: ${fs.existsSync(tryPath)}`);
  if (fs.existsSync(tryPath)) {
    distPath = tryPath;
    break;
  }
}

if (!distPath) {
  console.error('ERROR: Could not find dist directory in any of the expected locations!');
  distPath = path.join(__dirname, 'dist'); // fallback
}

console.log(`\n📦 Using dist directory at: ${distPath}`);
console.log('Directory exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Fallback route for SPA
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Production build not found. Please run: npm run build');
    }
  });
} else {
  console.error(`\n❌ ERROR: dist directory not found at ${distPath}`);
  console.error('Please run "npm run build" before starting the production server.');
  
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.status(500).send('Production build not found. Please run: npm run build');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✨ Server is running on port ${PORT}`);
  console.log(`🌐 Access the app at: http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET    /api/health`);
  console.log(`   GET    /api/test-env`);
  console.log(`   GET    /api/diagnostics`);
  console.log(`   GET    /api/scrape/stream`);
  console.log(`   POST   /api/openai/chat`);
  console.log(`   POST   /api/openai/vision`);
  console.log(`   POST   /api/openai/analyze-document`);
  console.log(`   DELETE /api/listings/:id`);
  
  if (isRailway) {
    console.log(`\n🚂 Railway URL: https://${process.env.RAILWAY_STATIC_URL || 'your-app.up.railway.app'}`);
  } else if (isRender) {
    console.log(`\n🚀 Render URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});