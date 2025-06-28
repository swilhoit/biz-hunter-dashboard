#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SCRAPER_API_KEY;
const testUrl = 'https://quietlight.com/businesses-for-sale/';
const scraperUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(testUrl)}&render=true`;

console.log('🧪 Final ScraperAPI Test');
console.log('========================');
console.log(`Testing: ${testUrl}`);
console.log('');

fetch(scraperUrl, { timeout: 20000 })
  .then(response => {
    console.log(`Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      return response.text();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(html => {
    console.log(`Length: ${html.length} chars`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'No title';
    console.log(`Title: ${title}`);
    console.log(`Has errors: ${/502|503|error|blocked/i.test(html) ? 'YES' : 'NO'}`);
    console.log(`Has business content: ${/business|sale|opportunity/i.test(html) ? 'YES' : 'NO'}`);
  })
  .catch(error => {
    console.log(`❌ Failed: ${error.message}`);
  });