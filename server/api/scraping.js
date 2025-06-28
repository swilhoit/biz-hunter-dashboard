#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createScraper, getAllScraperNames, getScraperInfo } from '../../src/services/scraping/scrapers/server.ts';
import { DatabaseService } from '../../src/services/scraping/DatabaseService.server.ts';

const app = express();
app.use(cors());
app.use(express.json());

// Store for ongoing operations
const operations = new Map();
let dbService = null;

// Initialize database service
async function initializeServices() {
  try {
    dbService = new DatabaseService();
    await dbService.initialize();
    console.log('✅ Database service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database service:', error);
  }
}

// Generate operation ID
function generateOperationId() {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Real scraping function
async function runScraping(scraperName, isAll = false) {
  const operationId = generateOperationId();
  const scraperNames = isAll ? getAllScraperNames() : [scraperName];
  
  const operation = {
    id: operationId,
    status: 'running',
    progress: 0,
    totalScrapers: scraperNames.length,
    completedScrapers: 0,
    startTime: new Date(),
    results: null
  };
  
  operations.set(operationId, operation);
  
  // Run scraping asynchronously
  (async () => {
    try {
      const scraperResults = {};
      let totalListings = 0;
      let newListings = 0;
      
      for (let i = 0; i < scraperNames.length; i++) {
        const name = scraperNames[i];
        const scraperInfo = getScraperInfo()[name];
        
        operation.currentScraper = scraperInfo?.name || name;
        operation.progress = (i / scraperNames.length) * 100;
        
        console.log(`🔄 Running scraper: ${operation.currentScraper}`);
        
        try {
          // Create and run scraper
          const scraper = createScraper(name, {
            maxPages: 5,
            delayBetweenRequests: 2000,
            headless: true,
            timeout: 30000
          });
          
          const result = await scraper.scrape();
          
          // Save listings to database if successful
          if (result.success && result.listings.length > 0 && dbService) {
            const savedCount = await dbService.saveListings(result.listings);
            newListings += savedCount;
          }
          
          scraperResults[name] = {
            success: result.success,
            listings: result.listings.length,
            errors: result.errors || []
          };
          
          totalListings += result.listings.length;
          
        } catch (error) {
          console.error(`❌ Scraper ${name} failed:`, error);
          scraperResults[name] = {
            success: false,
            listings: 0,
            errors: [error.message]
          };
        }
        
        operation.completedScrapers = i + 1;
      }
      
      operation.status = 'completed';
      operation.progress = 100;
      operation.endTime = new Date();
      operation.results = {
        totalListings,
        newListings,
        errors: Object.values(scraperResults).reduce((sum, r) => sum + r.errors.length, 0),
        scraperResults
      };
      
      console.log(`✅ Scraping completed: ${totalListings} total, ${newListings} new listings`);
      
    } catch (error) {
      console.error('❌ Scraping operation failed:', error);
      operation.status = 'failed';
      operation.error = error.message;
      operation.endTime = new Date();
    }
  })();
  
  return operationId;
}

// Background scraping scheduler
let backgroundInterval = null;

function startBackgroundScraping() {
  // Run every 24 hours (86400000 ms)
  const INTERVAL = 24 * 60 * 60 * 1000;
  
  backgroundInterval = setInterval(async () => {
    console.log('🔄 Starting background scraping...');
    try {
      await runScraping(null, true);
    } catch (error) {
      console.error('❌ Background scraping failed:', error);
    }
  }, INTERVAL);
  
  console.log(`⏰ Background scraping scheduled every ${INTERVAL / 1000 / 60 / 60} hours (daily)`);
}

function stopBackgroundScraping() {
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
    console.log('⏹️ Background scraping stopped');
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    backgroundScraping: !!backgroundInterval,
    database: !!dbService
  });
});

app.post('/api/scraping/run-all', async (req, res) => {
  try {
    console.log('🚀 Starting all scrapers...');
    const operationId = await runScraping(null, true);
    
    res.json({
      success: true,
      message: 'Started scraping all sources',
      operationId
    });
  } catch (error) {
    console.error('❌ Failed to start scraping:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/scraping/run-single', async (req, res) => {
  try {
    const { scraperName } = req.body;
    const availableScrapers = getAllScraperNames();
    
    if (!availableScrapers.includes(scraperName)) {
      return res.status(400).json({
        success: false,
        message: `Unknown scraper: ${scraperName}. Available: ${availableScrapers.join(', ')}`
      });
    }
    
    console.log(`🚀 Starting scraper: ${scraperName}`);
    const operationId = await runScraping(scraperName, false);
    
    res.json({
      success: true,
      message: `Started scraping ${getScraperInfo()[scraperName]?.name || scraperName}`,
      operationId
    });
  } catch (error) {
    console.error('❌ Failed to start scraper:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/scraping/status/:operationId', (req, res) => {
  const { operationId } = req.params;
  const operation = operations.get(operationId);
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Operation not found'
    });
  }
  
  res.json(operation);
});

app.get('/api/scraping/stats', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        message: 'Database service not available'
      });
    }
    
    // Get real stats from database
    const stats = await dbService.getScrapingStats();
    res.json({ stats });
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/scraping/background/start', (req, res) => {
  try {
    startBackgroundScraping();
    res.json({
      success: true,
      message: 'Background scraping started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/scraping/background/stop', (req, res) => {
  try {
    stopBackgroundScraping();
    res.json({
      success: true,
      message: 'Background scraping stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.SCRAPING_API_PORT || 3001;

// Initialize services and start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Real Scraping API server running on port ${PORT}`);
    console.log(`📡 Available endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   POST http://localhost:${PORT}/api/scraping/run-all`);
    console.log(`   POST http://localhost:${PORT}/api/scraping/run-single`);
    console.log(`   GET  http://localhost:${PORT}/api/scraping/status/:id`);
    console.log(`   GET  http://localhost:${PORT}/api/scraping/stats`);
    console.log(`   POST http://localhost:${PORT}/api/scraping/background/start`);
    console.log(`   POST http://localhost:${PORT}/api/scraping/background/stop`);
    
    // Start background scraping on server startup
    startBackgroundScraping();
    
    // Run initial scraping
    console.log('🔄 Running initial scraping...');
    runScraping(null, true).catch(error => {
      console.error('❌ Initial scraping failed:', error);
    });
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;