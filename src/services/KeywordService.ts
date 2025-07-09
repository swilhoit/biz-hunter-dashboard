import { supabase } from '../lib/supabase';
import { fetchDataForKeywords } from '../utils/explorer/junglescout';

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
   * Fetch keywords for a specific ASIN from JungleScout
   */
  static async fetchKeywordsForASIN(asin: string): Promise<KeywordData[]> {
    try {
      console.log('Fetching keywords for ASIN:', asin);
      
      // JungleScout doesn't have a direct ASIN to keywords endpoint in our current implementation
      // We'll need to use a different approach or implement the keywords_by_asin endpoint
      // For now, we'll fetch based on the product title or brand
      
      // Get ASIN details first
      const { data: asinData, error } = await supabase
        .from('asins')
        .select('title, brand, category')
        .eq('asin', asin)
        .single();
        
      if (error || !asinData) {
        console.error('Error fetching ASIN data:', error);
        return [];
      }
      
      // Create search terms from product data
      const searchTerms = [];
      if (asinData.title) {
        // Extract key words from title (first few words)
        const titleWords = asinData.title.split(' ').slice(0, 3).join(' ');
        searchTerms.push(titleWords);
      }
      if (asinData.brand && asinData.brand !== 'Unknown') {
        searchTerms.push(asinData.brand);
      }
      if (asinData.category && asinData.category !== 'Unknown') {
        searchTerms.push(asinData.category);
      }
      
      // Fetch keyword data from JungleScout
      const keywords = await fetchDataForKeywords(searchTerms.slice(0, 3)); // Limit to 3 searches
      
      // Deduplicate keywords by keyword text
      const uniqueKeywords = keywords.reduce((acc, keyword) => {
        const existing = acc.find(k => k.keyword === keyword.keyword);
        if (!existing) {
          acc.push(keyword);
        }
        return acc;
      }, [] as KeywordData[]);
      
      return uniqueKeywords;
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
      
      // Prepare keyword data for insertion with validation
      const keywordRecords = keywords.map(keyword => ({
        asin_id: asinData.id,
        keyword: keyword.keyword,
        search_volume: keyword.search_volume || 0,
        relevancy_score: Math.min(keyword.relevancy_score || 0, 999.99), // Ensure it fits in DECIMAL(5,2)
        monthly_trend: keyword.monthly_trend || 0,
        quarterly_trend: keyword.quarterly_trend || 0,
        ppc_bid_broad: keyword.ppc_bid_broad || 0,
        ppc_bid_exact: keyword.ppc_bid_exact || 0,
        organic_product_count: keyword.organic_product_count || 0,
        sponsored_product_count: keyword.sponsored_product_count || 0
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