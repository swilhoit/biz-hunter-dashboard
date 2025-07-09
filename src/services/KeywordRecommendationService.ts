import OpenAI from 'openai';
import { fetchDataForKeywords } from '../utils/explorer/junglescout';

interface RecommendedKeyword {
  keyword: string;
  search_intent: 'informational' | 'commercial' | 'transactional';
  estimated_competition: 'low' | 'medium' | 'high';
  relevance_reason: string;
  // JungleScout metrics
  search_volume?: number;
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
          keyword: kw.keyword.toLowerCase().trim(),
          search_intent: kw.search_intent || 'commercial',
          estimated_competition: kw.estimated_competition || 'medium',
          relevance_reason: kw.relevance_reason || 'Relevant to product category'
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
   * Enhance recommended keywords with JungleScout metrics
   */
  static async enhanceKeywordsWithJungleScoutData(
    keywords: RecommendedKeyword[]
  ): Promise<RecommendedKeyword[]> {
    try {
      console.log('Enhancing keywords with JungleScout data:', keywords.length);
      
      // Extract just the keyword strings
      const keywordStrings = keywords.map(kw => kw.keyword);
      
      // Fetch JungleScout data for these keywords
      const junglescoutData = await fetchDataForKeywords(keywordStrings);
      
      console.log('JungleScout data received:', junglescoutData.length);
      
      // Create a map of keyword to JungleScout metrics
      const metricsMap = new Map();
      junglescoutData.forEach(data => {
        metricsMap.set(data.keyword.toLowerCase(), data);
      });
      
      // Enhance each keyword with JungleScout metrics
      const enhancedKeywords = keywords.map(keyword => {
        const metrics = metricsMap.get(keyword.keyword.toLowerCase());
        
        if (metrics) {
          return {
            ...keyword,
            search_volume: metrics.search_volume || 0,
            monthly_trend: metrics.monthly_trend || 0,
            quarterly_trend: metrics.quarterly_trend || 0,
            ppc_bid_broad: metrics.ppc_bid_broad || 0,
            ppc_bid_exact: metrics.ppc_bid_exact || 0,
            organic_product_count: metrics.organic_product_count || 0,
            sponsored_product_count: metrics.sponsored_product_count || 0,
            junglescout_updated_at: new Date().toISOString()
          };
        }
        
        return keyword;
      });
      
      console.log('Enhanced keywords:', enhancedKeywords.length);
      return enhancedKeywords;
      
    } catch (error) {
      console.error('Error enhancing keywords with JungleScout data:', error);
      // Return original keywords if enhancement fails
      return keywords;
    }
  }

  /**
   * Generate keyword recommendations with JungleScout metrics
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
      
      // Then enhance with JungleScout metrics
      const enhancedRecommendations = await this.enhanceKeywordsWithJungleScoutData(
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