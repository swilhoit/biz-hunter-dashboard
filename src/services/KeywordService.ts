import { supabase } from '../lib/supabase';

export interface KeywordData {
  id: string;
  keyword: string;
  search_volume: number;
  relevancy_score: number;
  monthly_trend: number;
  quarterly_trend: number;
  ppc_bid_broad: number;
  ppc_bid_exact: number;
  organic_product_count: number;
  sponsored_product_count: number;
  rank_organic?: number;
  rank_sponsored?: number;
}

export interface ASINKeyword {
  id: string;
  asin_id: string;
  keyword: string;
  search_volume: number;
  relevancy_score: number;
  rank_organic?: number;
  rank_sponsored?: number;
  last_updated: string;
}

export class KeywordService {
  /**
   * Fetch keywords for a specific ASIN from DataForSEO
   */
  static async fetchKeywordsForASIN(asin: string): Promise<KeywordData[]> {
    try {
      console.log('Fetching keywords for ASIN:', asin);
      
      const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
      const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
      
      if (!username || !password) {
        console.error('[DataForSEO] Credentials not configured');
        return [];
      }

      const credentials = btoa(`${username}:${password}`);
      const endpoint = 'https://api.dataforseo.com/v3/dataforseo_labs/amazon/ranked_keywords/live';
      
      const payload = [{
        asin: asin,
        location_code: 2840, // USA
        language_code: 'en',
        limit: 1000 // Maximum keywords to return
      }];

      console.log('[DataForSEO] Fetching ranked keywords for ASIN:', asin);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DataForSEO] API error:', response.status, errorText);
        return [];
      }

      const data = await response.json();
      
      if (data.status_code === 20000 && data.tasks?.[0]?.result?.[0]?.items) {
        const items = data.tasks[0].result[0].items;
        console.log('[DataForSEO] Found', items.length, 'keywords for ASIN');
        
        // Map DataForSEO results to our KeywordData interface
        return items.map((item: any, index: number) => ({
          id: `${asin}-${index}`, // Generate unique ID
          keyword: item.keyword_data?.keyword || item.keyword || '',
          search_volume: item.keyword_data?.search_volume || 0,
          relevancy_score: item.keyword_data?.keyword_difficulty || 50, // Use difficulty as relevancy proxy
          monthly_trend: 0, // DataForSEO doesn't provide this in same format
          quarterly_trend: 0,
          ppc_bid_broad: item.keyword_data?.cpc || 0,
          ppc_bid_exact: item.keyword_data?.cpc || 0,
          organic_product_count: item.ranked_serp_element?.serp_item?.total_count || 0,
          sponsored_product_count: 0, // Not provided by DataForSEO
          rank_organic: item.ranked_serp_element?.rank_absolute || null,
          rank_sponsored: null // Not provided in this endpoint
        }));
      }
      
      console.log('[DataForSEO] No keywords found or API error');
      return [];
    } catch (error) {
      console.error('Error fetching keywords for ASIN:', error);
      return [];
    }
  }
  
  /**
   * Save keywords for an ASIN to the database
   */
  static async saveKeywordsForASIN(asin: string, keywords: KeywordData[]): Promise<boolean> {
    try {
      // First get the ASIN ID
      const { data: asinData, error: asinError } = await supabase
        .from('asins')
        .select('id')
        .eq('asin', asin)
        .single();
        
      if (asinError || !asinData) {
        console.error('Error finding ASIN:', asinError);
        return false;
      }
      
      // Deduplicate keywords by keyword text (keep the one with best rank)
      const uniqueKeywordsMap = new Map<string, KeywordData>();
      keywords.forEach(keyword => {
        const existing = uniqueKeywordsMap.get(keyword.keyword);
        if (!existing || (keyword.rank_organic && (!existing.rank_organic || keyword.rank_organic < existing.rank_organic))) {
          uniqueKeywordsMap.set(keyword.keyword, keyword);
        }
      });
      
      console.log(`[KeywordService] Saving ${uniqueKeywordsMap.size} unique keywords (from ${keywords.length} total)`);
      
      // Prepare keyword data for insertion with validation
      const keywordRecords = Array.from(uniqueKeywordsMap.values()).map(keyword => ({
        asin_id: asinData.id,
        keyword: keyword.keyword,
        search_volume: keyword.search_volume || 0,
        relevancy_score: Math.min(keyword.relevancy_score || 0, 999.99), // Ensure it fits in DECIMAL(5,2)
        monthly_trend: keyword.monthly_trend || 0,
        quarterly_trend: keyword.quarterly_trend || 0,
        ppc_bid_broad: keyword.ppc_bid_broad || 0,
        ppc_bid_exact: keyword.ppc_bid_exact || 0,
        organic_product_count: keyword.organic_product_count || 0,
        sponsored_product_count: keyword.sponsored_product_count || 0,
        rank_organic: keyword.rank_organic || null,
        rank_sponsored: keyword.rank_sponsored || null
      }));
      
      // Insert keywords (upsert to handle duplicates)
      const { error: insertError } = await supabase
        .from('asin_keywords')
        .upsert(keywordRecords, {
          onConflict: 'asin_id,keyword'
        });
        
      if (insertError) {
        console.error('Error saving keywords:', insertError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in saveKeywordsForASIN:', error);
      return false;
    }
  }
  
  /**
   * Get saved keywords for an ASIN
   */
  static async getKeywordsForASIN(asin: string): Promise<ASINKeyword[]> {
    try {
      const { data: asinData, error: asinError } = await supabase
        .from('asins')
        .select('id')
        .eq('asin', asin)
        .single();
        
      if (asinError || !asinData) {
        console.error('Error finding ASIN:', asinError);
        return [];
      }
      
      const { data, error } = await supabase
        .from('asin_keywords')
        .select('*')
        .eq('asin_id', asinData.id)
        .order('relevancy_score', { ascending: false });
        
      if (error) {
        console.error('Error fetching keywords:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getKeywordsForASIN:', error);
      return [];
    }
  }
}