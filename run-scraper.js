#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const availableScrapers = {
  'bizbuysell': 'BizBuySell - Traditional business listings',
  'quietlight': 'QuietLight - Digital business brokerage',
  'acquire': 'Acquire - Startup acquisitions',
  'bizquest': 'BizQuest - Business opportunities',
  'microacquire': 'MicroAcquire - Micro-SaaS and small startups',
  'flippa': 'Flippa - Website and digital asset marketplace',
  'empireflippers': 'Empire Flippers - Established online business marketplace',
  'exitadviser': 'Exit Adviser - Business for sale listings'
};

function showHelp() {
  console.log('🚀 BizHunter Scraper CLI\n');
  console.log('Usage: node run-scraper.js [scraper-name]\n');
  console.log('Available scrapers:');
  Object.entries(availableScrapers).forEach(([key, description]) => {
    console.log(`  ${key.padEnd(12)} - ${description}`);
  });
  console.log('\nExamples:');
  console.log('  node run-scraper.js                # Test all scrapers');
  console.log('  node run-scraper.js quietlight     # Test QuietLight scraper only');
  console.log('  node run-scraper.js flippa         # Test Flippa scraper only');
}

function runTest(scraperName = null) {
  const scriptPath = path.join(__dirname, 'src/services/scraping/test-scrapers.ts');
  const args = ['tsx', scriptPath];
  
  if (scraperName) {
    args.push(scraperName);
  }

  console.log(`🔄 ${scraperName ? `Testing ${scraperName} scraper` : 'Testing all scrapers'}...\n`);

  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start test:', error.message);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Test completed successfully!');
    } else {
      console.log('\n❌ Test failed!');
      process.exit(code);
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const scraperName = args[0];

if (scraperName && !availableScrapers[scraperName]) {
  console.error(`❌ Unknown scraper: ${scraperName}\n`);
  showHelp();
  process.exit(1);
}

runTest(scraperName);