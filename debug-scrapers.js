#!/usr/bin/env node

// Debug scraper tool - tests individual scrapers with detailed logging

const { spawn } = require('child_process');
const path = require('path');

const SCRAPERS = {
  'bizbuysell': 'BizBuySell - Traditional business marketplace',
  'quietlight': 'QuietLight - Digital business brokerage',
  'acquire': 'Acquire - Startup acquisition platform',
  'bizquest': 'BizQuest - Business opportunities',
  'microacquire': 'MicroAcquire - Micro-SaaS marketplace',
  'flippa': 'Flippa - Website and digital asset marketplace'
};

function showHelp() {
  console.log('🔍 BizHunter Scraper Debugger\n');
  console.log('Usage: node debug-scrapers.js [scraper-name] [options]\n');
  console.log('Available scrapers:');
  Object.entries(SCRAPERS).forEach(([key, description]) => {
    console.log(`  ${key.padEnd(12)} - ${description}`);
  });
  console.log('\nOptions:');
  console.log('  --headless=false    Run browser in visible mode');
  console.log('  --pages=N          Number of pages to scrape (default: 1)');
  console.log('  --delay=N          Delay between requests in ms (default: 2000)');
  console.log('  --debug            Enable detailed debug logging');
  console.log('\nExamples:');
  console.log('  node debug-scrapers.js quietlight --headless=false --debug');
  console.log('  node debug-scrapers.js all --pages=2');
  console.log('  node debug-scrapers.js bizbuysell --delay=5000');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    scraper: 'all',
    headless: true,
    pages: 1,
    delay: 2000,
    debug: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--headless=')) {
      config.headless = arg.split('=')[1] !== 'false';
    } else if (arg.startsWith('--pages=')) {
      config.pages = parseInt(arg.split('=')[1]) || 1;
    } else if (arg.startsWith('--delay=')) {
      config.delay = parseInt(arg.split('=')[1]) || 2000;
    } else if (arg === '--debug') {
      config.debug = true;
    } else if (!arg.startsWith('--')) {
      config.scraper = arg;
    }
  }

  return config;
}

async function runDebugScraper(scraperName, config) {
  console.log(`🔧 Debugging ${SCRAPERS[scraperName] || scraperName}...`);
  console.log(`📋 Config: pages=${config.pages}, delay=${config.delay}ms, headless=${config.headless}\n`);

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'src/services/scraping/test-scrapers.ts');
    const args = ['tsx', scriptPath, scraperName];

    // Set environment variables for configuration
    const env = {
      ...process.env,
      SCRAPER_HEADLESS: config.headless.toString(),
      SCRAPER_MAX_PAGES: config.pages.toString(),
      SCRAPER_DELAY: config.delay.toString(),
      SCRAPER_DEBUG: config.debug.toString()
    };

    const child = spawn('npx', args, {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname,
      env
    });

    child.on('error', (error) => {
      console.error('❌ Failed to start debugger:', error.message);
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Debug session completed successfully!');
        resolve();
      } else {
        console.log('\n❌ Debug session failed!');
        reject(new Error(`Debug session exited with code ${code}`));
      }
    });
  });
}

async function runDebugAll(config) {
  console.log('🚀 Running debug session for all scrapers...\n');
  
  const scraperNames = Object.keys(SCRAPERS);
  let successCount = 0;
  let failureCount = 0;
  
  for (const scraperName of scraperNames) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      await runDebugScraper(scraperName, config);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to debug ${scraperName}:`, error.message);
      failureCount++;
    }
    
    // Add delay between scrapers
    if (scraperName !== scraperNames[scraperNames.length - 1]) {
      console.log(`\n⏳ Waiting ${config.delay}ms before next scraper...`);
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Debug Summary: ${successCount} successful, ${failureCount} failed`);
}

// Main execution
async function main() {
  const config = parseArgs();
  
  try {
    if (config.scraper === 'all') {
      await runDebugAll(config);
    } else if (SCRAPERS[config.scraper]) {
      await runDebugScraper(config.scraper, config);
    } else {
      console.error(`❌ Unknown scraper: ${config.scraper}\n`);
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Debug session failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Debug session interrupted by user');
  process.exit(0);
});

main();