#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Debug: Check if environment variables are loaded
console.log('🔧 [SERVER] Environment variables loaded:');
console.log('  SCRAPER_API_KEY:', process.env.SCRAPER_API_KEY ? 'SET' : 'NOT SET');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');

const app = express();
app.use(cors());
app.use(express.json());

// Store for ongoing operations
const operations = new Map();

// Generate operation ID
function generateOperationId() {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Scraping API server is running'
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
    const { default: EnhancedMultiScraper } = await import('../../enhanced-multi-scraper.js');

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

const PORT = process.env.SCRAPING_API_PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Real Scraping API server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/scrape/stream`);
});

export default app;