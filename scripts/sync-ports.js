#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_PORT = process.env.SERVER_PORT || 3002;

// Update .env file with correct port
function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  // Read current .env
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add VITE_API_BASE_URL
  const apiUrlRegex = /^VITE_API_BASE_URL=.*$/m;
  const newApiUrl = `VITE_API_BASE_URL=http://localhost:${SERVER_PORT}`;
  
  if (apiUrlRegex.test(envContent)) {
    envContent = envContent.replace(apiUrlRegex, newApiUrl);
  } else {
    envContent += `\n${newApiUrl}`;
  }
  
  // Update or add VITE_SCRAPING_API_URL
  const scrapingUrlRegex = /^VITE_SCRAPING_API_URL=.*$/m;
  const newScrapingUrl = `VITE_SCRAPING_API_URL=http://localhost:${SERVER_PORT}`;
  
  if (scrapingUrlRegex.test(envContent)) {
    envContent = envContent.replace(scrapingUrlRegex, newScrapingUrl);
  } else {
    envContent += `\n${newScrapingUrl}`;
  }
  
  // Write updated content
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file with port ${SERVER_PORT}`);
}

// Update server port in server/index.js
function updateServerIndex() {
  const serverIndexPath = path.join(__dirname, '..', 'server', 'index.js');
  
  if (fs.existsSync(serverIndexPath)) {
    let content = fs.readFileSync(serverIndexPath, 'utf8');
    
    // Update PORT declaration
    const portRegex = /const PORT = process\.env\.PORT \|\| \d+;/;
    const newPortLine = `const PORT = process.env.PORT || ${SERVER_PORT};`;
    
    if (portRegex.test(content)) {
      content = content.replace(portRegex, newPortLine);
      fs.writeFileSync(serverIndexPath, content);
      console.log(`✅ Updated server/index.js with port ${SERVER_PORT}`);
    }
  }
}

// Main execution
console.log(`🔧 Synchronizing ports to ${SERVER_PORT}...`);
updateEnvFile();
updateServerIndex();
console.log(`✨ Port synchronization complete!`);
console.log(`\n📌 Remember to restart both frontend and backend servers for changes to take effect.`);