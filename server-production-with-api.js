import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log environment
console.log('=== Server Starting ===');
console.log('Port:', PORT);
console.log('Node Environment:', process.env.NODE_ENV);
console.log('Server Time:', new Date().toISOString());
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');
console.log('SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? 'SET' : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'SET' : 'NOT SET');

// Detect Railway environment
const isRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
if (isRailway) {
  console.log('\n🚂 Railway deployment detected - using Railway-optimized configuration');
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

// OpenAI endpoints
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7, max_tokens = 2000, model = 'gpt-4o-mini' } = req.body;
    
    const openAIKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    
    if (!openAIKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openAIKey });
    
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
    });
    
    res.json({ response: completion.choices[0]?.message?.content || '' });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/openai/vision', async (req, res) => {
  try {
    const { image, prompt, max_tokens = 1500 } = req.body;
    
    const openAIKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    
    if (!openAIKey) {
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
    const { content, fileName, fileType, analysisType } = req.body;
    
    const openAIKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    
    if (!openAIKey) {
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

// Serve static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`\n📦 Serving static files from: ${distPath}`);
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

// Start server
app.listen(PORT, () => {
  console.log(`\n✨ Server is running on port ${PORT}`);
  console.log(`🌐 Access the app at: http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/test-env`);
  console.log(`   GET  /api/scrape/stream`);
  console.log(`   POST /api/openai/chat`);
  console.log(`   POST /api/openai/vision`);
  console.log(`   POST /api/openai/analyze-document`);
  
  if (isRailway) {
    console.log(`\n🚂 Railway URL: https://${process.env.RAILWAY_STATIC_URL || 'your-app.up.railway.app'}`);
  }
});