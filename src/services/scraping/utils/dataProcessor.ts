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
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice.replace(/,/g, ''));
    return isNaN(price) ? 0 : price;
  }

  static extractRevenue(revenueText: string): number {
    const cleanRevenue = revenueText.replace(/[^\d.,]/g, '');
    const revenue = parseFloat(cleanRevenue.replace(/,/g, ''));
    return isNaN(revenue) ? 0 : revenue;
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
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }
}