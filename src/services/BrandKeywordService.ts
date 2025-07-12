import { supabase } from '../lib/supabase';

interface BrandKeyword {
  id?: string;
  brand_name: string;
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  relevance_score: number;
  keyword_type: 'brand' | 'product' | 'category' | 'competitor' | 'general';
  source: 'manual' | 'ai_recommendation' | 'competitor_analysis';
  is_active: boolean;
}

interface KeywordRanking {
  id?: string;
  brand_keyword_id: string;
  asin?: string;
  position: number;
  page: number;
  url?: string;
  title?: string;
  domain: string;
  location_code: number;
  language_code: string;
  check_date: string;
}

interface SerpFeature {
  id?: string;
  brand_keyword_id: string;
  feature_type: string;
  position?: number;
  title?: string;
  url?: string;
  description?: string;
  additional_data: any;
  check_date: string;
}

interface BrandRankingSummary {
  brand_name: string;
  total_keywords: number;
  ranking_keywords: number;
  top_10_keywords: number;
  top_3_keywords: number;
  avg_position: number;
  visibility_score: number;
  total_search_volume: number;
  estimated_traffic: number;
  check_date: string;
}

export class BrandKeywordService {
  /**
   * Add recommended keywords for a brand
   */
  static async addBrandKeywords(brandName: string, keywords: Partial<BrandKeyword>[]): Promise<boolean> {
    try {
      const keywordsToInsert = keywords.map(kw => ({
        brand_name: brandName,
        keyword: kw.keyword || '',
        search_volume: kw.search_volume || 0,
        cpc: kw.cpc || 0,
        competition: kw.competition || 0,
        difficulty: kw.difficulty || 0,
        relevance_score: kw.relevance_score || 5,
        keyword_type: kw.keyword_type || 'general',
        source: kw.source || 'manual',
        is_active: true
      }));

      const { error } = await supabase
        .from('brand_keywords')
        .upsert(keywordsToInsert, { 
          onConflict: 'brand_name,keyword',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error adding brand keywords:', error);
        return false;
      }

      console.log(`[BrandKeywords] Added ${keywordsToInsert.length} keywords for brand: ${brandName}`);
      return true;
    } catch (error) {
      console.error('Error in addBrandKeywords:', error);
      return false;
    }
  }

  /**
   * Get all active keywords for a brand
   */
  static async getBrandKeywords(brandName: string): Promise<BrandKeyword[]> {
    try {
      const { data, error } = await supabase
        .from('brand_keywords')
        .select('*')
        .eq('brand_name', brandName)
        .eq('is_active', true)
        .order('relevance_score', { ascending: false });

      if (error) {
        console.error('Error fetching brand keywords:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBrandKeywords:', error);
      return [];
    }
  }

  /**
   * Track keyword rankings using DataForSEO SERP API
   */
  static async trackKeywordRankings(brandName: string, keywords?: string[]): Promise<boolean> {
    try {
      const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
      const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
      
      if (!username || !password) {
        console.error('[DataForSEO] Credentials not configured');
        return false;
      }

      // Get keywords to track
      let keywordsToTrack: BrandKeyword[];
      if (keywords && keywords.length > 0) {
        const { data } = await supabase
          .from('brand_keywords')
          .select('*')
          .eq('brand_name', brandName)
          .in('keyword', keywords)
          .eq('is_active', true);
        keywordsToTrack = data || [];
      } else {
        keywordsToTrack = await this.getBrandKeywords(brandName);
      }

      if (keywordsToTrack.length === 0) {
        console.log(`[BrandKeywords] No keywords found for brand: ${brandName}`);
        return false;
      }

      console.log(`[BrandKeywords] Tracking rankings for ${keywordsToTrack.length} keywords`);

      const credentials = btoa(`${username}:${password}`);
      
      // Process keywords in batches of 10 for API efficiency
      const batchSize = 10;
      for (let i = 0; i < keywordsToTrack.length; i += batchSize) {
        const batch = keywordsToTrack.slice(i, i + batchSize);
        
        // Create SERP API requests
        const serpRequests = batch.map(kw => ({
          keyword: kw.keyword,
          location_code: 2840, // United States
          language_code: "en",
          se_domain: "amazon.com",
          depth: 100, // Track top 100 results
          tag: `brand-tracking-${brandName}-${kw.keyword.replace(/\s+/g, '-')}`
        }));

        // Submit SERP tasks
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/task_post', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serpRequests)
        });

        if (!response.ok) {
          console.error(`[DataForSEO] SERP API error for batch ${i + 1}:`, response.status);
          continue;
        }

        const data = await response.json();
        
        if (data.status_code === 20000 && data.tasks) {
          // Wait for tasks to complete and process results
          const taskIds = data.tasks.map((task: any) => task.id);
          await this.processSerpResults(taskIds, batch, brandName, credentials);
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Update brand ranking summary
      await this.updateBrandRankingSummary(brandName);
      
      return true;
    } catch (error) {
      console.error('Error in trackKeywordRankings:', error);
      return false;
    }
  }

  /**
   * Process SERP results and save rankings
   */
  private static async processSerpResults(
    taskIds: string[], 
    keywords: BrandKeyword[], 
    brandName: string, 
    credentials: string
  ): Promise<void> {
    // Wait for tasks to complete
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds for SERP processing

    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      const keyword = keywords[i];

      try {
        // Get SERP results
        const response = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) continue;

        const result = await response.json();
        
        if (result.status_code === 20000 && result.tasks?.[0]?.result?.[0]?.items) {
          const items = result.tasks[0].result[0].items;
          
          // Find Amazon products in results
          const amazonResults = items.filter((item: any) => 
            item.domain === 'amazon.com' && 
            item.type === 'organic'
          );

          // Save ranking data
          for (const amazonResult of amazonResults) {
            // Extract ASIN from URL if possible
            const asinMatch = amazonResult.url?.match(/\/([A-Z0-9]{10})/);
            const asin = asinMatch ? asinMatch[1] : null;

            const ranking: Partial<KeywordRanking> = {
              brand_keyword_id: keyword.id!,
              asin: asin,
              position: amazonResult.rank_absolute,
              page: Math.ceil(amazonResult.rank_absolute / 10),
              url: amazonResult.url,
              title: amazonResult.title,
              domain: 'amazon.com',
              location_code: 2840,
              language_code: 'en',
              check_date: new Date().toISOString()
            };

            await supabase.from('keyword_rankings').insert(ranking);
          }

          // Save SERP features (ads, shopping results, etc.)
          const serpFeatures = items.filter((item: any) => 
            item.type !== 'organic'
          );

          for (const feature of serpFeatures) {
            const serpFeature: Partial<SerpFeature> = {
              brand_keyword_id: keyword.id!,
              feature_type: feature.type,
              position: feature.rank_absolute,
              title: feature.title,
              url: feature.url,
              description: feature.description,
              additional_data: {
                price: feature.price,
                rating: feature.rating,
                reviews_count: feature.reviews_count
              },
              check_date: new Date().toISOString()
            };

            await supabase.from('keyword_serp_features').insert(serpFeature);
          }

          console.log(`[BrandKeywords] Processed rankings for keyword: ${keyword.keyword}`);
        }
      } catch (error) {
        console.error(`Error processing SERP results for ${keyword.keyword}:`, error);
      }
    }
  }

  /**
   * Update brand ranking summary statistics
   */
  static async updateBrandRankingSummary(brandName: string): Promise<void> {
    try {
      // Get latest rankings and calculate summary
      const { data: performanceData } = await supabase
        .from('brand_keyword_performance')
        .select('*')
        .eq('brand_name', brandName);

      if (!performanceData || performanceData.length === 0) {
        return;
      }

      const totalKeywords = performanceData.length;
      const rankingKeywords = performanceData.filter(p => p.position && p.position <= 100).length;
      const top10Keywords = performanceData.filter(p => p.position && p.position <= 10).length;
      const top3Keywords = performanceData.filter(p => p.position && p.position <= 3).length;
      
      const positions = performanceData
        .filter(p => p.position && p.position <= 100)
        .map(p => p.position);
      const avgPosition = positions.length > 0 ? 
        positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 0;

      const totalSearchVolume = performanceData.reduce((sum, p) => sum + (p.search_volume || 0), 0);
      const estimatedTraffic = performanceData.reduce((sum, p) => sum + (p.estimated_traffic || 0), 0);
      
      // Calculate visibility score (weighted by search volume and position)
      const visibilityScore = performanceData.reduce((score, p) => {
        if (!p.position || p.position > 100) return score;
        const positionWeight = Math.max(0, (101 - p.position) / 100);
        return score + (p.search_volume || 0) * positionWeight;
      }, 0);

      const summary: Partial<BrandRankingSummary> = {
        brand_name: brandName,
        total_keywords: totalKeywords,
        ranking_keywords: rankingKeywords,
        top_10_keywords: top10Keywords,
        top_3_keywords: top3Keywords,
        avg_position: Math.round(avgPosition * 100) / 100,
        visibility_score: Math.round(visibilityScore * 100) / 100,
        total_search_volume: totalSearchVolume,
        estimated_traffic: Math.round(estimatedTraffic),
        check_date: new Date().toISOString()
      };

      // First try to update existing record for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('brand_ranking_summary')
        .select('id')
        .eq('brand_name', brandName)
        .gte('check_date', `${today}T00:00:00.000Z`)
        .lt('check_date', `${today}T23:59:59.999Z`)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('brand_ranking_summary')
          .update(summary)
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('brand_ranking_summary')
          .insert(summary);
      }

      console.log(`[BrandKeywords] Updated ranking summary for ${brandName}`);
    } catch (error) {
      console.error('Error updating brand ranking summary:', error);
    }
  }

  /**
   * Get brand ranking performance overview
   */
  static async getBrandPerformance(brandName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('brand_keyword_performance')
        .select('*')
        .eq('brand_name', brandName)
        .order('relevance_score', { ascending: false });

      if (error) {
        console.error('Error fetching brand performance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBrandPerformance:', error);
      return [];
    }
  }

  /**
   * Get brand ranking summary history
   */
  static async getBrandRankingHistory(brandName: string, days: number = 30): Promise<BrandRankingSummary[]> {
    try {
      const { data, error } = await supabase
        .from('brand_ranking_summary')
        .select('*')
        .eq('brand_name', brandName)
        .gte('check_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('check_date', { ascending: true });

      if (error) {
        console.error('Error fetching brand ranking history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBrandRankingHistory:', error);
      return [];
    }
  }

  /**
   * Get keyword suggestions from AI based on brand analysis
   */
  static async generateKeywordRecommendations(
    brandName: string, 
    products: string[], 
    targetAudience?: string
  ): Promise<Partial<BrandKeyword>[]> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('OpenAI API key not configured');
        return [];
      }

      const prompt = `Generate strategic Amazon keyword recommendations for the brand "${brandName}".

Products/Services: ${products.join(', ')}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Return ONLY a JSON array of keywords with this structure:
[
  {
    "keyword": "specific keyword phrase",
    "keyword_type": "brand|product|category|competitor",
    "relevance_score": 1-10,
    "estimated_search_volume": estimated_number,
    "estimated_difficulty": 1-10
  }
]

Focus on:
- High-intent purchase keywords
- Brand-specific terms and variations
- Product category keywords
- Long-tail phrases with commercial intent
- Competitor comparison terms

Provide 20-30 diverse, strategic keywords.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an Amazon SEO expert. Generate strategic keyword recommendations in valid JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        return [];
      }

      const data = await response.json();
      const recommendations = JSON.parse(data.choices[0].message.content);
      
      // Convert to our format
      return recommendations.map((rec: any) => ({
        keyword: rec.keyword,
        search_volume: rec.estimated_search_volume || 0,
        difficulty: rec.estimated_difficulty || 5,
        relevance_score: rec.relevance_score || 5,
        keyword_type: rec.keyword_type || 'general',
        source: 'ai_recommendation',
        cpc: 0,
        competition: 0
      }));

    } catch (error) {
      console.error('Error generating keyword recommendations:', error);
      return [];
    }
  }
}