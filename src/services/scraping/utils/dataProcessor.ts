import { RawListing, RawListingSchema } from '../types';
import { z } from 'zod';

export class DataProcessor {
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  static extractPrice(priceText: string): number {
    if (!priceText || typeof priceText !== 'string') return 0;
    
    // Handle various price formats
    let cleanText = priceText.toLowerCase().trim();
    
    // Handle "multiple" or ranges
    if (cleanText.includes('multiple') || cleanText.includes('range') || cleanText.includes('varies')) {
      return 0;
    }
    
    // Extract number with K/M suffixes
    const kPattern = /(\d+(?:\.\d+)?)\s*k/i;
    const mPattern = /(\d+(?:\.\d+)?)\s*m/i;
    
    if (mPattern.test(cleanText)) {
      const match = cleanText.match(mPattern);
      return Math.floor(parseFloat(match![1]) * 1000000);
    }
    
    if (kPattern.test(cleanText)) {
      const match = cleanText.match(kPattern);
      return Math.floor(parseFloat(match![1]) * 1000);
    }
    
    // Extract regular numbers
    const numberPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    const matches = cleanText.match(numberPattern);
    
    if (matches && matches.length > 0) {
      // Take the largest number found
      const numbers = matches.map(m => parseFloat(m.replace(/,/g, '')));
      return Math.floor(Math.max(...numbers));
    }
    
    return 0;
  }

  static extractRevenue(revenueText: string): number {
    if (!revenueText || typeof revenueText !== 'string') return 0;
    
    let cleanText = revenueText.toLowerCase().trim();
    
    // Handle common revenue indicators
    if (cleanText.includes('confidential') || cleanText.includes('inquire') || cleanText.includes('contact')) {
      return 0;
    }
    
    // Handle MRR/ARR conversion
    if (cleanText.includes('mrr') || cleanText.includes('monthly')) {
      const monthlyRevenue = this.extractPrice(revenueText);
      return monthlyRevenue * 12; // Convert to annual
    }
    
    // Handle quarterly revenue
    if (cleanText.includes('quarterly') || cleanText.includes('quarter')) {
      const quarterlyRevenue = this.extractPrice(revenueText);
      return quarterlyRevenue * 4; // Convert to annual
    }
    
    // Use the same extraction logic as price
    return this.extractPrice(revenueText);
  }

  static normalizeIndustry(industry: string): string {
    const normalized = industry.toLowerCase().trim();
    
    // Industry mapping for consistency
    const industryMap: Record<string, string> = {
      'tech': 'Technology',
      'technology': 'Technology',
      'software': 'SaaS',
      'saas': 'SaaS',
      'ecommerce': 'E-commerce',
      'e-commerce': 'E-commerce',
      'online retail': 'E-commerce',
      'food': 'Food & Beverage',
      'restaurant': 'Food & Beverage',
      'health': 'Health & Fitness',
      'fitness': 'Health & Fitness',
      'healthcare': 'Health & Fitness',
      'education': 'Education',
      'marketing': 'Marketing',
      'automotive': 'Automotive',
      'manufacturing': 'Manufacturing',
    };

    return industryMap[normalized] || this.capitalizeWords(industry);
  }

  static capitalizeWords(text: string): string {
    return text.replace(/\b\w/g, char => char.toUpperCase());
  }

  static validateListing(rawData: unknown): RawListing | null {
    try {
      // Make sure listing has an original URL
      if (typeof rawData === 'object' && rawData !== null) {
        const listing = rawData as Record<string, any>;
        
        // Ensure we have an original URL
        if (!listing.originalUrl || !this.isValidUrl(listing.originalUrl)) {
          const source = listing.source || 'Unknown';
          const fallbackId = (listing.name || '').replace(/\s+/g, '-').toLowerCase();
          listing.originalUrl = this.ensureValidUrl(listing.originalUrl, source, fallbackId);
        }
      }
      
      return RawListingSchema.parse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn('Listing validation failed:', error.errors);
      }
      return null;
    }
  }

  static extractHighlights(text: string, keywords: string[] = []): string[] {
    const defaultKeywords = [
      'growing revenue', 'profit margin', 'established brand', 'recurring revenue',
      'high retention', 'scalable', 'multiple locations', 'exclusive agreements',
      'remote operation', 'turn-key', 'loyal customers', 'premium products',
      'strong suppliers', 'excellent reviews', 'enterprise clients',
      'multi-year contracts', 'niche focus', 'experienced team'
    ];

    const allKeywords = [...defaultKeywords, ...keywords];
    const highlights: string[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of allKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        highlights.push(this.capitalizeWords(keyword));
      }
    }

    return [...new Set(highlights)].slice(0, 5); // Remove duplicates and limit to 5
  }

  static isValidUrl(urlString: string): boolean {
    if (!urlString) return false;
    
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }
  
  static createDefaultUrl(source: string, id: string): string {
    // Create a fallback URL for listings that don't have one
    const sourceMap: Record<string, string> = {
      'BizBuySell': 'https://www.bizbuysell.com/businesses/',
      'EmpireFlippers': 'https://empireflippers.com/marketplace/',
      'Flippa': 'https://flippa.com/businesses/',
      'MicroAcquire': 'https://microacquire.com/marketplace/',
      'QuietLight': 'https://quietlight.com/listings/',
      'ExitAdviser': 'https://exitadviser.com/businesses-for-sale/',
      'BizQuest': 'https://www.bizquest.com/business-for-sale/',
      'Acquire': 'https://acquire.com/startups/'
    };
    
    const baseUrl = sourceMap[source] || 'https://bizbuysell.com/businesses/';
    return `${baseUrl}${id || 'unknown-' + Date.now()}`;
  }
  
  static ensureValidUrl(url: string | undefined, source: string, fallbackId: string = ''): string {
    if (url && this.isValidUrl(url)) return url;
    
    // Generate a fallback URL if the provided one is invalid
    return this.createDefaultUrl(source, fallbackId);
  }
}