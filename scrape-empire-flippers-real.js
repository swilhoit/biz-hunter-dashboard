#!/usr/bin/env node

// Scrape REAL listings from Empire Flippers - a working business marketplace

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class EmpireFlippersScraper {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    this.scraperAPIKey = process.env.SCRAPER_API_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async scrapeWithScraperAPI(url) {
    console.log(`🌐 Scraping with ScraperAPI: ${url}`);
    
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${this.scraperAPIKey}&url=${encodeURIComponent(url)}&render=true&premium=true`;
      
      const response = await fetch(scraperUrl, { timeout: 45000 });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      console.log(`   ✅ Retrieved ${html.length} characters`);
      
      return { success: true, html };
      
    } catch (error) {
      console.log(`   ❌ ScraperAPI failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async scrapeWithPlaywright(url) {
    console.log(`🎭 Scraping with Playwright: ${url}`);
    
    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await page.waitForTimeout(5000); // Wait for dynamic content
      
      const html = await page.content();
      console.log(`   ✅ Retrieved ${html.length} characters`);
      
      await browser.close();
      return { success: true, html };
      
    } catch (error) {
      if (browser) await browser.close();
      console.log(`   ❌ Playwright failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  extractListings(html) {
    console.log('🔍 Extracting real listings from Empire Flippers...');
    
    const $ = cheerio.load(html);
    const listings = [];
    
    // Empire Flippers uses various selectors for their listings
    const possibleSelectors = [
      '.listing-card',
      '.business-card', 
      '.marketplace-listing',
      '[data-testid*="listing"]',
      '.listing-item',
      'article',
      '.property-card',
      'div[class*="listing"]',
      'div[class*="business"]',
      'div[class*="marketplace"]'
    ];
    
    let foundElements = null;
    let usedSelector = '';
    
    // Try each selector until we find listings
    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        // Check if elements contain business-like content
        let hasBusinessContent = false;
        elements.each((i, el) => {
          const text = $(el).text().toLowerCase();
          if (text.includes('revenue') || text.includes('profit') || text.includes('business') || 
              text.includes('website') || text.includes('monthly') || /\$[\d,]+/.test(text)) {
            hasBusinessContent = true;
            return false; // Break
          }
        });
        
        if (hasBusinessContent) {
          foundElements = elements;
          usedSelector = selector;
          console.log(`   ✅ Found ${elements.length} listings with selector: ${selector}`);
          break;
        }
      }
    }
    
    if (!foundElements) {
      console.log('   ❌ No listing elements found. Checking page content...');
      
      // Debug: show what's actually on the page
      const pageText = $('body').text().substring(0, 500);
      console.log(`   📄 Page content preview: ${pageText}...`);
      
      // Try to find any elements with money amounts
      const elementsWithMoney = [];
      $('*').each((i, el) => {
        const text = $(el).text();
        if (/\$[\d,]+/.test(text) && text.length < 200) {
          elementsWithMoney.push(text.trim());
        }
      });
      
      if (elementsWithMoney.length > 0) {
        console.log(`   💰 Found ${elementsWithMoney.length} elements with money amounts:`);
        elementsWithMoney.slice(0, 5).forEach((text, i) => {
          console.log(`     ${i + 1}. ${text.substring(0, 100)}...`);
        });
      }
      
      return [];
    }
    
    // Extract data from each listing
    foundElements.each((i, element) => {
      if (i >= 20) return; // Limit to 20 listings
      
      const $el = $(element);
      
      // Extract name/title with multiple strategies
      let name = '';
      const titleSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5',
        '.title', '.name', '.listing-title', '.business-name',
        '.headline', '.header', 
        'a[title]', '[data-testid*="title"]'
      ];
      
      for (const sel of titleSelectors) {
        const titleEl = $el.find(sel).first();
        if (titleEl.length) {
          name = titleEl.text().trim() || titleEl.attr('title') || '';
          if (name.length > 3) break;
        }
      }
      
      // If no title found, try getting the first substantial text
      if (!name) {
        const allText = $el.text().trim();
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
        if (lines.length > 0) {
          name = lines[0].substring(0, 100);
        }
      }
      
      // Extract description
      let description = '';
      const descSelectors = [
        '.description', '.summary', '.excerpt', '.details',
        '.content', '.listing-description', 'p'
      ];
      
      for (const sel of descSelectors) {
        const descEl = $el.find(sel).first();
        if (descEl.length) {
          description = descEl.text().trim();
          if (description.length > 20) break;
        }
      }
      
      // Extract financial data from the entire element text
      const fullText = $el.text();
      const financialData = this.extractFinancialData(fullText);
      
      // Extract link
      let link = '';
      const linkEl = $el.find('a').first();
      if (linkEl.length) {
        link = linkEl.attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://empireflippers.com${link}`;
        }
      }
      
      // Extract industry/category
      const industry = this.extractIndustry(name, description, fullText);
      
      // Only include if we have substantial data
      if (name && name.length > 5 && (financialData.askingPrice > 0 || financialData.revenue > 0 || description.length > 20)) {
        listings.push({
          name: name.substring(0, 200),
          description: description.substring(0, 500) || 'Digital business opportunity from Empire Flippers',
          asking_price: financialData.askingPrice,
          annual_revenue: financialData.revenue,
          industry: industry,
          location: 'Remote', // Most Empire Flippers listings are remote
          source: 'Empire Flippers',
          original_url: link || 'https://empireflippers.com/marketplace/',
          highlights: this.extractHighlights(fullText),
          status: 'active'
        });
        
        // Log first few for verification
        if (i < 3) {
          console.log(`   📋 Listing ${i + 1}: "${name.substring(0, 60)}..."`);
          console.log(`       Price: $${financialData.askingPrice.toLocaleString()}`);
          console.log(`       Revenue: $${financialData.revenue.toLocaleString()}`);
          console.log(`       Industry: ${industry}`);
        }
      }
    });
    
    console.log(`   📊 Extracted ${listings.length} valid listings`);
    return listings;
  }

  extractFinancialData(text) {
    const cleanText = text.toLowerCase();
    
    let askingPrice = 0;
    let revenue = 0;
    
    // Patterns for Empire Flippers format
    const patterns = [
      // Revenue patterns
      { type: 'revenue', regex: /net profit[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'revenue', regex: /revenue[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'revenue', regex: /monthly profit[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'revenue', regex: /\$?([\d,]+(?:\.\d+)?[km]?)\s*\/\s*month/i },
      
      // Price patterns  
      { type: 'price', regex: /asking price[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'price', regex: /list price[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      { type: 'price', regex: /price[:\s]*\$?([\d,]+(?:\.\d+)?[km]?)/i },
      
      // General money patterns
      { type: 'general', regex: /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g },
      { type: 'general', regex: /\$(\d+(?:\.\d+)?[km])\b/gi }
    ];
    
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern.regex);
      if (matches) {
        const value = this.parseMoneyValue(matches[1]);
        
        if (pattern.type === 'revenue' && !revenue && value > 0) {
          revenue = value;
        } else if (pattern.type === 'price' && !askingPrice && value > 0) {
          askingPrice = value;
        } else if (pattern.type === 'general' && !revenue && !askingPrice && value > 1000) {
          // Use as revenue if it's substantial
          if (value > 10000) {
            revenue = value;
          }
        }
      }
    }
    
    return { askingPrice, revenue };
  }

  parseMoneyValue(text) {
    if (!text) return 0;
    
    const cleanText = text.replace(/[^0-9.km]/gi, '').toLowerCase();
    
    if (cleanText.includes('m')) {
      return Math.floor(parseFloat(cleanText.replace('m', '')) * 1000000);
    }
    
    if (cleanText.includes('k')) {
      return Math.floor(parseFloat(cleanText.replace('k', '')) * 1000);
    }
    
    const num = parseFloat(cleanText.replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.floor(num);
  }

  extractIndustry(name, description, fullText) {
    const text = `${name} ${description} ${fullText}`.toLowerCase();
    
    const industries = {
      'E-commerce': /\b(ecommerce|e-commerce|shopify|woocommerce|amazon|store|retail|marketplace|dropship)\b/,
      'SaaS': /\b(saas|software|platform|subscription|app|application)\b/,
      'Affiliate': /\b(affiliate|affiliate marketing|commission|referral)\b/,
      'Content': /\b(blog|content|media|newsletter|publication|article)\b/,
      'Lead Generation': /\b(lead generation|leads|lead gen|marketing)\b/,
      'AdSense': /\b(adsense|display ads|advertising|ads)\b/,
      'Digital Services': /\b(services|agency|consulting|freelance)\b/,
      'Marketplace': /\b(marketplace|platform|directory)\b/
    };
    
    for (const [industry, pattern] of Object.entries(industries)) {
      if (pattern.test(text)) {
        return industry;
      }
    }
    
    return 'Online Business';
  }

  extractHighlights(text) {
    const highlights = [];
    const cleanText = text.toLowerCase();
    
    const highlightPatterns = [
      /(\d+%?\s*growth)/gi,
      /(passive income)/gi,
      /(established business)/gi,
      /(recurring revenue)/gi,
      /(multiple revenue streams)/gi,
      /(high traffic)/gi,
      /(automated)/gi
    ];
    
    highlightPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        highlights.push(...matches.slice(0, 2)); // Max 2 per pattern
      }
    });
    
    return highlights.slice(0, 5); // Max 5 highlights
  }

  async saveListings(listings) {
    if (listings.length === 0) {
      console.log('⚠️ No listings to save');
      return 0;
    }
    
    console.log(`💾 Saving ${listings.length} real listings to database...`);
    
    try {
      const { data, error } = await this.supabase
        .from('business_listings')
        .insert(listings)
        .select();
      
      if (error) {
        console.log(`❌ Error saving listings: ${error.message}`);
        return 0;
      }
      
      console.log(`✅ Successfully saved ${data.length} real listings`);
      return data.length;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return 0;
    }
  }

  async scrapeEmpireFlippers() {
    console.log('🚀 Scraping REAL Data from Empire Flippers\n');
    
    const url = 'https://empireflippers.com/marketplace/';
    
    // Try ScraperAPI first since we know it works
    let result = await this.scrapeWithScraperAPI(url);
    
    // Fallback to Playwright if needed
    if (!result.success) {
      result = await this.scrapeWithPlaywright(url);
    }
    
    if (!result.success) {
      console.log('❌ Failed to scrape Empire Flippers');
      return 0;
    }
    
    const listings = this.extractListings(result.html);
    
    if (listings.length > 0) {
      const saved = await this.saveListings(listings);
      return saved;
    } else {
      console.log('❌ No listings extracted from Empire Flippers');
      return 0;
    }
  }
}

async function main() {
  const scraper = new EmpireFlippersScraper();
  const saved = await scraper.scrapeEmpireFlippers();
  
  console.log(`\n🎉 REAL DATA SCRAPING COMPLETE!`);
  console.log(`📊 Added ${saved} genuine business listings from Empire Flippers`);
  
  if (saved > 0) {
    console.log('✅ Your dashboard now contains REAL business data with working links');
  } else {
    console.log('⚠️ No data was extracted - may need selector adjustments');
  }
}

main().catch(console.error);