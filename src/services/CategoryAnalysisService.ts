import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

interface CategoryAnalysisResult {
  businessType: string;
  amazonCategory: string;
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

Analyze this business and determine TWO things:

1. BUSINESS TYPE - The type of business model:
   - Amazon FBA (if selling physical products on Amazon)
   - E-commerce (Shopify, WooCommerce, etc.)
   - SaaS (Software as a Service)
   - Content/Publishing
   - Digital Products
   - Services
   - Marketplace
   - Subscription Box
   - Print on Demand
   - Dropshipping

2. AMAZON CATEGORY - If it's an Amazon FBA business, what product category:
   - Pet Supplies
   - Home & Kitchen
   - Sports & Outdoors
   - Baby
   - Beauty
   - Electronics
   - Health & Personal Care
   - Toys & Games
   - Clothing, Shoes & Jewelry
   - Garden & Outdoor
   - Tools & Home Improvement
   - Grocery & Gourmet Food
   - Office Products
   - Automotive
   - Arts, Crafts & Sewing
   - Industrial & Scientific
   - Books
   - Kitchen & Dining
   - Patio, Lawn & Garden
   - Sports & Fitness

Look for clues:
- If it mentions FBA, Amazon, or product brands → likely Amazon FBA
- Product keywords help identify the Amazon category
- If no clear Amazon connection → identify the business type

Return as JSON:
{
  "businessType": "Amazon FBA",
  "amazonCategory": "Pet Supplies",
  "confidence": 85,
  "reasoning": "Business name mentions dog toys, indicating Amazon FBA pet products",
  "subcategories": []
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing online businesses. First identify the business type (Amazon FBA, E-commerce, SaaS, etc.), then if it\'s Amazon FBA, identify the specific product category. Always provide both businessType and amazonCategory fields. For non-Amazon businesses, set amazonCategory to null.'
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
      
      // Fallback logic
      const name = listing.name.toLowerCase();
      const description = (listing.description || '').toLowerCase();
      const combined = `${name} ${description}`;
      
      // Determine business type
      let businessType = 'Online Business';
      let amazonCategory = null;
      
      if (combined.includes('amazon') || combined.includes('fba')) {
        businessType = 'Amazon FBA';
        
        // Try to determine Amazon category
        if (combined.match(/\b(pet|dog|cat|animal|puppy|kitten)\b/)) {
          amazonCategory = 'Pet Supplies';
        } else if (combined.match(/\b(kitchen|home|decor|furniture|household)\b/)) {
          amazonCategory = 'Home & Kitchen';
        } else if (combined.match(/\b(sport|fitness|outdoor|camping|exercise|gym)\b/)) {
          amazonCategory = 'Sports & Outdoors';
        } else if (combined.match(/\b(baby|infant|nursery|toddler)\b/)) {
          amazonCategory = 'Baby';
        } else if (combined.match(/\b(beauty|cosmetic|skincare|makeup)\b/)) {
          amazonCategory = 'Beauty';
        } else if (combined.match(/\b(electronic|tech|gadget|phone|computer)\b/)) {
          amazonCategory = 'Electronics';
        } else if (combined.match(/\b(health|wellness|supplement|vitamin|medical)\b/)) {
          amazonCategory = 'Health & Personal Care';
        } else if (combined.match(/\b(toy|game|play|puzzle)\b/)) {
          amazonCategory = 'Toys & Games';
        } else {
          amazonCategory = 'General Merchandise';
        }
      } else if (combined.includes('shopify') || combined.includes('ecommerce')) {
        businessType = 'E-commerce';
      } else if (combined.includes('saas') || combined.includes('software')) {
        businessType = 'SaaS';
      }
      
      return {
        businessType,
        amazonCategory,
        confidence: 70,
        reasoning: 'Determined from keywords',
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
          console.log(`✓ Analyzed "${listing.name}": ${result.businessType}${result.amazonCategory ? ` / ${result.amazonCategory}` : ''} (${result.confidence}% confidence)`);
          results.set(listing.id, result);
        } catch (error) {
          console.error(`✗ Error analyzing listing ${listing.id} "${listing.name}":`, error);
          results.set(listing.id, {
            businessType: 'Unknown',
            amazonCategory: null,
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
  static async updateListingCategories(updates: Array<{ id: string; businessType: string; amazonCategory: string | null }>, table: 'business_listings' | 'deals' = 'business_listings'): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const update of updates) {
      try {
        const { error } = await supabase
          .from(table)
          .update({ 
            industry: update.businessType,
            amazon_category: update.amazonCategory,
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
    results: Array<{ id: string; name: string; businessType: string; amazonCategory: string | null; confidence: number }>;
  }> {
    const { 
      table = 'business_listings', 
      limit = 50,
      confidenceThreshold = 60 
    } = options;
    
    try {
      // Fetch listings with unknown or empty categories (either industry or amazon_category)
      const { data: listings, error } = await supabase
        .from(table)
        .select('id, name, description, source, annual_revenue, asking_price, industry, amazon_category')
        .or('industry.is.null,industry.eq.Unknown,industry.eq.unknown,industry.eq.,industry.eq.Unknown Category,industry.eq.unknown category,amazon_category.is.null')
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
      const updates: Array<{ id: string; businessType: string; amazonCategory: string | null }> = [];
      const results: Array<{ id: string; name: string; businessType: string; amazonCategory: string | null; confidence: number }> = [];
      
      console.log(`\nFiltering results by confidence threshold (${confidenceThreshold}%)...`);
      
      analysisResults.forEach((result, id) => {
        const listing = listings.find(l => l.id === id);
        if (listing) {
          results.push({
            id,
            name: listing.name,
            businessType: result.businessType,
            amazonCategory: result.amazonCategory,
            confidence: result.confidence
          });
          
          if (result.confidence >= confidenceThreshold && result.businessType !== 'Unknown') {
            updates.push({ id, businessType: result.businessType, amazonCategory: result.amazonCategory });
            console.log(`✓ Will update "${listing.name}" to "${result.businessType}${result.amazonCategory ? ` / ${result.amazonCategory}` : ''}" (${result.confidence}% confidence)`);
          } else {
            console.log(`✗ Skipping "${listing.name}": ${result.businessType}${result.amazonCategory ? ` / ${result.amazonCategory}` : ''} (${result.confidence}% confidence) - ${result.confidence < confidenceThreshold ? 'below threshold' : 'unknown category'}`);
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