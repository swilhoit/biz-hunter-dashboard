import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

interface RecommendedKeyword {
  keyword: string;
  search_intent: 'informational' | 'commercial' | 'transactional';
  estimated_competition: 'low' | 'medium' | 'high';
  relevance_reason: string;
  // Search volume metrics
  search_volume?: number; // Legacy field
  amazon_search_volume?: number;
  google_search_volume?: number;
  google_cpc?: number;
  google_competition?: number;
  // Other metrics
  monthly_trend?: number;
  quarterly_trend?: number;
  ppc_bid_broad?: number;
  ppc_bid_exact?: number;
  organic_product_count?: number;
  sponsored_product_count?: number;
  junglescout_updated_at?: string;
}

export class KeywordRecommendationService {
  private static openai: OpenAI | null = null;

  private static getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
      }
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
      });
    }
    return this.openai;
  }

  /**
   * Fetch keyword data from DataForSEO for both Google and Amazon
   */
  private static async fetchKeywordDataFromDataForSEO(keywords: string[]): Promise<Map<string, any>> {
    const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
    const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
    
    if (!username || !password) {
      console.error('[DataForSEO] Credentials not configured');
      return new Map();
    }

    const credentials = btoa(`${username}:${password}`);
    const keywordData = new Map<string, any>();

    try {
      // Batch fetch Amazon search volumes (up to 1000 keywords at once)
      try {
        const amazonEndpoint = 'https://api.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live';
        const amazonPayload = [{
          keywords: keywords,
          location_code: 2840, // USA
          language_code: 'en'
        }];

        console.log('[DataForSEO] Fetching Amazon bulk search volume for', keywords.length, 'keywords');

        const amazonResponse = await fetch(amazonEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(amazonPayload)
        });

        if (amazonResponse.ok) {
          const amazonData = await amazonResponse.json();
          
          if (amazonData.status_code === 20000 && amazonData.tasks?.[0]?.result?.[0]?.items) {
            const items = amazonData.tasks[0].result[0].items;
            console.log('[DataForSEO] Amazon API returned', items.length, 'results');
            
            // Map Amazon results
            items.forEach((item: any) => {
              const key = item.keyword.toLowerCase();
              if (!keywordData.has(key)) {
                keywordData.set(key, {
                  keyword: item.keyword,
                  amazon_search_volume: 0,
                  google_search_volume: 0,
                  google_cpc: 0,
                  google_competition: 0
                });
              }
              keywordData.get(key).amazon_search_volume = item.search_volume || 0;
            });
          }
        } else {
          const errorText = await amazonResponse.text();
          console.error('[DataForSEO] Amazon API error:', amazonResponse.status, errorText);
        }
      } catch (error) {
        console.error('[DataForSEO] Error fetching Amazon data:', error);
      }

      // Batch fetch Google keyword data
      try {
        const googleEndpoint = 'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live';
        const googlePayload = [{
          keywords: keywords,
          location_code: 2840, // USA
          language_code: 'en'
        }];

        console.log('[DataForSEO] Fetching Google keyword data for', keywords.length, 'keywords');

        const googleResponse = await fetch(googleEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googlePayload)
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          
          if (googleData.status_code === 20000 && googleData.tasks?.[0]?.result) {
            const results = googleData.tasks[0].result;
            console.log('[DataForSEO] Google API returned', results.length, 'results');
            
            // Map Google results
            results.forEach((result: any) => {
              const key = result.keyword.toLowerCase();
              if (!keywordData.has(key)) {
                keywordData.set(key, {
                  keyword: result.keyword,
                  amazon_search_volume: 0,
                  google_search_volume: 0,
                  google_cpc: 0,
                  google_competition: 0
                });
              }
              const data = keywordData.get(key);
              data.google_search_volume = result.search_volume || 0;
              data.google_cpc = result.cpc || 0;
              data.google_competition = result.competition || 0;
            });
          }
        } else {
          const errorText = await googleResponse.text();
          console.error('[DataForSEO] Google API error:', googleResponse.status, errorText);
        }
      } catch (error) {
        console.error('[DataForSEO] Error fetching Google data:', error);
      }

    } catch (error) {
      console.error('[DataForSEO] Error fetching keyword data:', error);
    }

    console.log('[DataForSEO] Final keyword data map size:', keywordData.size);
    return keywordData;
  }

  static async generateKeywordRecommendations(
    productTitles: string[],
    category?: string,
    brand?: string
  ): Promise<RecommendedKeyword[]> {
    try {
      const client = this.getClient();
      
      // Prepare the prompt
      const prompt = `As an Amazon SEO expert, analyze these product titles and generate 10 highly relevant keyword recommendations for Amazon search optimization.

Product Titles:
${productTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')}

${category ? `Category: ${category}` : ''}
${brand ? `Brand: ${brand}` : ''}

Generate 10 keywords that:
1. Are highly relevant to these products
2. Have commercial/transactional search intent
3. Are specific enough to convert but broad enough to have search volume
4. Include a mix of short-tail and long-tail keywords
5. Avoid brand names unless specifically relevant

For each keyword, provide:
- The keyword phrase
- Search intent type (informational/commercial/transactional)
- Estimated competition level (low/medium/high)
- Brief reason why this keyword is valuable

Return as JSON array with this structure:
[
  {
    "keyword": "keyword phrase",
    "search_intent": "commercial",
    "estimated_competition": "medium",
    "relevance_reason": "Targets buyers looking for..."
  }
]`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini', // Using the mini model for fast results
        messages: [
          {
            role: 'system',
            content: 'You are an Amazon SEO expert who generates highly relevant keyword recommendations based on product data. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the response
      const parsed = JSON.parse(content);
      const keywords = parsed.keywords || parsed.recommendations || Object.values(parsed)[0] || [];
      
      // Validate and clean the response
      return keywords
        .filter((kw: any) => kw.keyword && typeof kw.keyword === 'string')
        .slice(0, 10) // Ensure we only return 10 keywords
        .map((kw: any) => ({
          keyword: kw.keyword.trim(), // Don't force lowercase - JungleScout might be case-sensitive
          search_intent: kw.search_intent || 'commercial',
          estimated_competition: kw.estimated_competition || 'medium',
          relevance_reason: kw.relevance_reason || 'Relevant to product category',
          relevance_score: kw.relevance_score || 85 // Default relevance score
        }));

    } catch (error) {
      console.error('Error generating keyword recommendations:', error);
      throw error;
    }
  }

  static async generateKeywordVariations(
    baseKeyword: string,
    productContext?: string
  ): Promise<string[]> {
    try {
      const client = this.getClient();
      
      const prompt = `Generate 5 variations of this Amazon search keyword: "${baseKeyword}"
${productContext ? `Product context: ${productContext}` : ''}

Include variations like:
- Synonyms
- Related search terms
- Long-tail versions
- Common misspellings (if applicable)
- Singular/plural variations

Return as a simple JSON array of strings.`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const variations = parsed.variations || parsed.keywords || Object.values(parsed)[0] || [];
      
      return variations
        .filter((v: any) => typeof v === 'string')
        .map((v: string) => v.toLowerCase().trim())
        .slice(0, 5);

    } catch (error) {
      console.error('Error generating keyword variations:', error);
      return [];
    }
  }

  /**
   * Enhance recommended keywords with DataForSEO metrics
   */
  static async enhanceKeywordsWithDataForSEOMetrics(
    keywords: RecommendedKeyword[]
  ): Promise<RecommendedKeyword[]> {
    try {
      console.log('[DataForSEO] Enhancing keywords with DataForSEO data:', keywords.length);
      console.log('[DataForSEO] Keywords to enhance:', keywords.map(k => k.keyword));
      
      // Extract just the keyword strings
      const keywordStrings = keywords.map(kw => kw.keyword);
      
      // Fetch DataForSEO data for these keywords
      const dataForSEOMap = await this.fetchKeywordDataFromDataForSEO(keywordStrings);
      
      console.log('[DataForSEO] Data received for', dataForSEOMap.size, 'keywords');
      
      // Enhance each keyword with DataForSEO metrics
      const enhancedKeywords = keywords.map(keyword => {
        // Try to find metrics with case-insensitive lookup
        const metrics = dataForSEOMap.get(keyword.keyword.toLowerCase());
        
        if (metrics) {
          console.log(`[DataForSEO] Enhanced keyword "${keyword.keyword}" with metrics:`, {
            amazon_search_volume: metrics.amazon_search_volume,
            google_search_volume: metrics.google_search_volume,
            google_cpc: metrics.google_cpc,
            google_competition: metrics.google_competition
          });
          
          // Map competition level to estimated values
          const competitionMap: { [key: string]: number } = {
            'low': 20,
            'medium': 50,
            'high': 80,
            'unknown': 0
          };
          
          return {
            ...keyword,
            search_volume: metrics.amazon_search_volume || 0, // Legacy field uses Amazon volume
            amazon_search_volume: metrics.amazon_search_volume || 0,
            google_search_volume: metrics.google_search_volume || 0,
            google_cpc: metrics.google_cpc || 0,
            google_competition: metrics.google_competition || 0,
            monthly_trend: 0, // DataForSEO doesn't provide trend in same format
            quarterly_trend: 0,
            ppc_bid_broad: metrics.google_cpc || 0, // Use Google CPC as estimate
            ppc_bid_exact: metrics.google_cpc || 0,
            organic_product_count: competitionMap[metrics.amazon_competition_level] || Math.floor(metrics.google_competition * 100) || 0,
            sponsored_product_count: Math.floor((competitionMap[metrics.amazon_competition_level] || (metrics.google_competition * 100)) * 0.3) || 0,
            junglescout_updated_at: new Date().toISOString() // Using same field name for compatibility
          };
        } else {
          console.log(`[DataForSEO] No metrics found for keyword "${keyword.keyword}" - returning with defaults`);
          // Return keyword with default/zero values so UI can still display something
          return {
            ...keyword,
            search_volume: 0,
            amazon_search_volume: 0,
            google_search_volume: 0,
            google_cpc: 0,
            google_competition: 0,
            monthly_trend: 0,
            quarterly_trend: 0,
            ppc_bid_broad: 0,
            ppc_bid_exact: 0,
            organic_product_count: 0,
            sponsored_product_count: 0,
            junglescout_updated_at: null
          };
        }
      });
      
      console.log('[DataForSEO] Enhanced keywords:', enhancedKeywords.length);
      console.log('[DataForSEO] Sample enhanced keyword:', enhancedKeywords[0]);
      return enhancedKeywords;
      
    } catch (error) {
      console.error('[DataForSEO] Error enhancing keywords with DataForSEO data:', error);
      // Return original keywords if enhancement fails
      return keywords;
    }
  }

  /**
   * Generate keyword recommendations with DataForSEO metrics
   */
  static async generateKeywordRecommendationsWithMetrics(
    productTitles: string[],
    category?: string,
    brand?: string
  ): Promise<RecommendedKeyword[]> {
    try {
      // First generate AI recommendations
      const recommendations = await this.generateKeywordRecommendations(
        productTitles,
        category,
        brand
      );
      
      // Then enhance with DataForSEO metrics
      const enhancedRecommendations = await this.enhanceKeywordsWithDataForSEOMetrics(
        recommendations
      );
      
      return enhancedRecommendations;
      
    } catch (error) {
      console.error('Error generating keyword recommendations with metrics:', error);
      throw error;
    }
  }
}

export default KeywordRecommendationService;