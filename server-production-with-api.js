import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Log environment
console.log('=== Server Starting ===');
console.log('Port:', PORT);
console.log('Node Environment:', process.env.NODE_ENV);
console.log('Server Time:', new Date().toISOString());
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');

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
  
  if (isRailway) {
    console.log(`\n🚂 Railway URL: https://${process.env.RAILWAY_STATIC_URL || 'your-app.up.railway.app'}`);
  }
});