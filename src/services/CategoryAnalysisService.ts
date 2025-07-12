import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

interface CategoryAnalysisResult {
  category: string;
  confidence: number;
  reasoning: string;
  subcategories?: string[];
}

export class CategoryAnalysisService {
  private static openai: OpenAI | null = null;

  private static getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return this.openai;
  }

  /**
   * Analyze a single listing to determine its category
   */
  static async analyzeListingCategory(listing: {
    name: string;
    description?: string | null;
    source?: string;
    annual_revenue?: number | null;
    asking_price?: number | null;
  }): Promise<CategoryAnalysisResult> {
    try {
      const client = this.getClient();
      
      const prompt = `Analyze this business listing and determine its primary category:

Business Name: ${listing.name}
Description: ${listing.description || 'Not provided'}
Source: ${listing.source || 'Unknown'}
Annual Revenue: ${listing.annual_revenue ? `$${listing.annual_revenue.toLocaleString()}` : 'Not provided'}
Asking Price: ${listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : 'Not provided'}

Based on the business name and any available information, determine:
1. The primary business category (e.g., "Amazon FBA", "SaaS", "E-commerce", "Content/Publishing", "Services", "Retail", "Manufacturing", etc.)
2. Your confidence level (0-100)
3. Brief reasoning for your categorization
4. Any relevant subcategories

Common categories for online businesses:
- Amazon FBA (if it mentions Amazon, FBA, or product selling on Amazon)
- E-commerce (general online retail, Shopify stores, etc.)
- SaaS (Software as a Service)
- Content/Publishing (blogs, newsletters, info products)
- Digital Products (courses, templates, downloads)
- Services (agencies, consulting, freelancing)
- Marketplace (platforms connecting buyers/sellers)
- Subscription Box
- Print on Demand
- Dropshipping
- DTC Brand (Direct to Consumer)
- B2B Services
- Affiliate Marketing

IMPORTANT: Do NOT return "Unknown" or "Unknown Category" as the category. Always make your best determination based on available information.

Return as JSON with this structure:
{
  "category": "Primary Category",
  "confidence": 85,
  "reasoning": "Brief explanation",
  "subcategories": ["Subcategory 1", "Subcategory 2"]
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing online businesses based on limited information. Always provide a category even with minimal data, using the business name as the primary clue.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing category:', error);
      
      // Fallback logic based on keywords
      const name = listing.name.toLowerCase();
      const description = (listing.description || '').toLowerCase();
      const combined = `${name} ${description}`;
      
      if (combined.includes('amazon') || combined.includes('fba')) {
        return {
          category: 'Amazon FBA',
          confidence: 70,
          reasoning: 'Detected Amazon/FBA keywords in listing',
          subcategories: []
        };
      } else if (combined.includes('saas') || combined.includes('software')) {
        return {
          category: 'SaaS',
          confidence: 70,
          reasoning: 'Detected software-related keywords',
          subcategories: []
        };
      } else if (combined.includes('ecommerce') || combined.includes('online store') || combined.includes('shopify')) {
        return {
          category: 'E-commerce',
          confidence: 70,
          reasoning: 'Detected e-commerce keywords',
          subcategories: []
        };
      }
      
      return {
        category: 'Online Business',
        confidence: 40,
        reasoning: 'Unable to determine specific category',
        subcategories: []
      };
    }
  }

  /**
   * Analyze multiple listings in batch
   */
  static async analyzeBatch(listings: Array<{
    id: string;
    name: string;
    description?: string | null;
    source?: string;
    annual_revenue?: number | null;
    asking_price?: number | null;
  }>): Promise<Map<string, CategoryAnalysisResult>> {
    const results = new Map<string, CategoryAnalysisResult>();
    
    console.log(`Starting batch analysis of ${listings.length} listings...`);
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(listings.length/batchSize)}...`);
      
      const batchPromises = batch.map(async (listing) => {
        try {
          const result = await this.analyzeListingCategory(listing);
          console.log(`✓ Analyzed "${listing.name}": ${result.category} (${result.confidence}% confidence)`);
          results.set(listing.id, result);
        } catch (error) {
          console.error(`✗ Error analyzing listing ${listing.id} "${listing.name}":`, error);
          results.set(listing.id, {
            category: 'Unknown',
            confidence: 0,
            reasoning: 'Analysis failed',
            subcategories: []
          });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < listings.length) {
        console.log('Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Batch analysis complete. Analyzed ${results.size} listings.`);
    return results;
  }

  /**
   * Update listing categories in the database
   */
  static async updateListingCategories(updates: Array<{ id: string; category: string }>, table: 'business_listings' | 'deals' = 'business_listings'): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const update of updates) {
      try {
        const { error } = await supabase
          .from(table)
          .update({ 
            industry: update.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
          
        if (error) {
          console.error(`Failed to update ${update.id}:`, error);
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error(`Error updating ${update.id}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }

  /**
   * Analyze and update all listings with unknown categories
   */
  static async analyzeAndUpdateUnknownCategories(
    options: {
      table?: 'business_listings' | 'deals';
      limit?: number;
      confidenceThreshold?: number;
    } = {}
  ): Promise<{
    analyzed: number;
    updated: number;
    failed: number;
    results: Array<{ id: string; name: string; category: string; confidence: number }>;
  }> {
    const { 
      table = 'business_listings', 
      limit = 50,
      confidenceThreshold = 60 
    } = options;
    
    try {
      // Fetch listings with unknown or empty categories
      const { data: listings, error } = await supabase
        .from(table)
        .select('id, name, description, source, annual_revenue, asking_price, industry')
        .or('industry.is.null,industry.eq.Unknown,industry.eq.unknown,industry.eq.,industry.eq.Unknown Category,industry.eq.unknown category')
        .limit(limit);
        
      if (error) {
        throw error;
      }
      
      if (!listings || listings.length === 0) {
        return { analyzed: 0, updated: 0, failed: 0, results: [] };
      }
      
      console.log(`Found ${listings.length} listings with unknown categories`);
      
      // Analyze categories
      const analysisResults = await this.analyzeBatch(listings);
      
      // Filter by confidence threshold and prepare updates
      const updates: Array<{ id: string; category: string }> = [];
      const results: Array<{ id: string; name: string; category: string; confidence: number }> = [];
      
      console.log(`\nFiltering results by confidence threshold (${confidenceThreshold}%)...`);
      
      analysisResults.forEach((result, id) => {
        const listing = listings.find(l => l.id === id);
        if (listing) {
          results.push({
            id,
            name: listing.name,
            category: result.category,
            confidence: result.confidence
          });
          
          if (result.confidence >= confidenceThreshold && result.category !== 'Unknown') {
            updates.push({ id, category: result.category });
            console.log(`✓ Will update "${listing.name}" to "${result.category}" (${result.confidence}% confidence)`);
          } else {
            console.log(`✗ Skipping "${listing.name}": ${result.category} (${result.confidence}% confidence) - ${result.confidence < confidenceThreshold ? 'below threshold' : 'unknown category'}`);
          }
        }
      });
      
      console.log(`\nPrepared ${updates.length} updates out of ${listings.length} analyzed listings.`);
      
      // Update database
      const updateResult = await this.updateListingCategories(updates, table);
      
      return {
        analyzed: listings.length,
        updated: updateResult.success,
        failed: updateResult.failed,
        results
      };
    } catch (error) {
      console.error('Error in analyzeAndUpdateUnknownCategories:', error);
      throw error;
    }
  }
}