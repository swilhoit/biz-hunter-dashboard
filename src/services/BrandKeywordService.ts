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
  is_brand_result?: boolean;
  brand_match_score?: number;
  brand_match_reason?: string;
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
  check_date: string;
  check_date_only: string;
}

type ProgressCallback = (stage: string, current: number, total: number, message: string) => void;

export class BrandKeywordService {
  /**
   * Helper function to check if a keyword contains the exact brand name
   */
  private static containsBrandName(keywordLower: string, brandNameLower: string): boolean {
    // Only check for exact brand name matches, not individual words
    const exactBrandVariations = [
      brandNameLower, // "mister candle"
      brandNameLower.replace(/\s+/g, ''), // "mistercandle"
      brandNameLower.replace(/\s+/g, '-'), // "mister-candle"
      brandNameLower.replace(/\s+/g, '_'), // "mister_candle"
    ];
    
    // Check if keyword contains the full brand name (not individual words)
    for (const brandVariation of exactBrandVariations) {
      if (keywordLower.includes(brandVariation)) {
        return true;
      }
    }
    
    // Check for exact brand name with word boundaries
    const brandNameRegex = new RegExp(`\\b${brandNameLower.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (brandNameRegex.test(keywordLower)) {
      return true;
    }
    
    return false;
  }
  /**
   * Add recommended keywords for a brand (with final brand validation)
   */
  static async addBrandKeywords(brandName: string, keywords: Partial<BrandKeyword>[]): Promise<boolean> {
    try {
      // Final validation to ensure NO branded keywords slip through
      const validatedKeywords = keywords.filter(kw => {
        if (!kw.keyword) return false;
        
        const keywordLower = kw.keyword.toLowerCase();
        const brandNameLower = brandName.toLowerCase();
        
        // Final check - reject if contains brand name or words
        if (this.containsBrandName(keywordLower, brandNameLower)) {
          console.warn(`[BrandKeywords] 🚫 REJECTED at final validation: "${kw.keyword}"`);
          return false;
        }
        
        console.log(`[BrandKeywords] ✅ FINAL APPROVAL: "${kw.keyword}"`);
        return true;
      });

      if (validatedKeywords.length === 0) {
        console.warn(`[BrandKeywords] All keywords were rejected during validation for brand: ${brandName}`);
        return false;
      }

      const keywordsToInsert = validatedKeywords.map(kw => ({
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

      console.log(`[BrandKeywords] Added ${keywordsToInsert.length} non-branded keywords for brand: ${brandName}`);
      return true;
    } catch (error) {
      console.error('Error in addBrandKeywords:', error);
      return false;
    }
  }

  /**
   * Clean up existing branded keywords from database
   */
  static async cleanupBrandedKeywords(brandName: string): Promise<number> {
    try {
      // Get all existing keywords for the brand
      const { data: existingKeywords, error: fetchError } = await supabase
        .from('brand_keywords')
        .select('id, keyword')
        .eq('brand_name', brandName);

      if (fetchError) {
        console.error('Error fetching existing keywords:', fetchError);
        return 0;
      }

      if (!existingKeywords || existingKeywords.length === 0) {
        return 0;
      }

      // Find branded keywords that need to be removed
      const brandedKeywordIds: string[] = [];
      const brandNameLower = brandName.toLowerCase();

      for (const kw of existingKeywords) {
        if (this.containsBrandName(kw.keyword.toLowerCase(), brandNameLower)) {
          brandedKeywordIds.push(kw.id);
          console.log(`[BrandKeywords] 🗑️ Marked for removal: "${kw.keyword}"`);
        }
      }

      if (brandedKeywordIds.length === 0) {
        console.log(`[BrandKeywords] No branded keywords found to clean up for: ${brandName}`);
        return 0;
      }

      // Remove branded keywords
      const { error: deleteError } = await supabase
        .from('brand_keywords')
        .delete()
        .in('id', brandedKeywordIds);

      if (deleteError) {
        console.error('Error deleting branded keywords:', deleteError);
        return 0;
      }

      console.log(`[BrandKeywords] 🧹 Cleaned up ${brandedKeywordIds.length} branded keywords for: ${brandName}`);
      return brandedKeywordIds.length;
    } catch (error) {
      console.error('Error in cleanupBrandedKeywords:', error);
      return 0;
    }
  }

  /**
   * Clean up old non-brand keyword rankings
   */
  static async cleanupNonBrandRankings(brandName: string): Promise<number> {
    try {
      console.log(`[BrandKeywords] Cleaning up non-brand rankings for: ${brandName}`);
      
      // First get all keyword IDs for this brand
      const { data: keywords, error: keywordError } = await supabase
        .from('brand_keywords')
        .select('id')
        .eq('brand_name', brandName);
        
      if (keywordError || !keywords) {
        throw new Error('Failed to fetch brand keywords');
      }
      
      const keywordIds = keywords.map(k => k.id);
      if (keywordIds.length === 0) {
        return 0;
      }
      
      // Delete non-brand rankings in batches
      let totalDeleted = 0;
      for (const keywordId of keywordIds) {
        const { error: deleteError, count } = await supabase
          .from('keyword_rankings')
          .delete()
          .eq('brand_keyword_id', keywordId)
          .eq('is_brand_result', false);
          
        if (deleteError) {
          console.error('[BrandKeywords] Error deleting rankings for keyword:', keywordId, deleteError);
        } else {
          totalDeleted += (count || 0);
        }
      }
      
      console.log(`[BrandKeywords] Deleted ${totalDeleted} non-brand rankings`);
      return totalDeleted;
    } catch (error) {
      console.error('[BrandKeywords] Error in cleanupNonBrandRankings:', error);
      throw error;
    }
  }
  
  /**
   * Pre-populate ASINs for a brand to improve keyword tracking performance
   */
  static async prePopulateBrandASINs(brandName: string): Promise<number> {
    try {
      console.log(`[BrandKeywords] Pre-populating ASINs for brand: ${brandName}`);
      
      // Search for the brand's products to populate ASIN database
      const searchKeywords = [
        brandName,
        `${brandName} products`,
        `${brandName} official`
      ];
      
      let totalASINsAdded = 0;
      const dataForSEOConfig = {
        username: import.meta.env.VITE_DATAFORSEO_USERNAME || '',
        password: import.meta.env.VITE_DATAFORSEO_PASSWORD || ''
      };
      const credentials = btoa(`${dataForSEOConfig.username}:${dataForSEOConfig.password}`);
      
      for (const searchTerm of searchKeywords) {
        try {
          const response = await fetch('https://api.dataforseo.com/v3/merchant/amazon/products/task_post', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
              keyword: searchTerm,
              location_code: 2840,
              language_code: 'en_US',
              depth: 100
            }])
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.tasks?.[0]?.id) {
              // Wait for task to complete
              await new Promise(resolve => setTimeout(resolve, 10000));
              
              // Fetch results
              const resultResponse = await fetch(
                `https://api.dataforseo.com/v3/merchant/amazon/products/task_get/advanced/${data.tasks[0].id}`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (resultResponse.ok) {
                const result = await resultResponse.json();
                const items = result.tasks?.[0]?.result?.[0]?.items || [];
                
                // Store ASINs that likely belong to the brand
                const asinsToStore = [];
                for (const item of items) {
                  if (item.asin && item.title && item.type === 'amazon_serp') {
                    // Simple brand check in title
                    if (item.title.toLowerCase().includes(brandName.toLowerCase())) {
                      asinsToStore.push({
                        asin: item.asin,
                        title: item.title,
                        brand: brandName,
                        current_price: item.price?.current || 0,
                        review_rating: item.rating?.value || 0,
                        review_count: item.rating?.votes_count || 0,
                        category: item.main_category || '',
                        subcategory: item.sub_category || '',
                        last_updated: new Date().toISOString()
                      });
                    }
                  }
                }
                
                if (asinsToStore.length > 0) {
                  const { error } = await supabase
                    .from('asins')
                    .upsert(asinsToStore, {
                      onConflict: 'asin',
                      ignoreDuplicates: false
                    });
                    
                  if (!error) {
                    totalASINsAdded += asinsToStore.length;
                    console.log(`[BrandKeywords] Added ${asinsToStore.length} ASINs for search term: ${searchTerm}`);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`[BrandKeywords] Error pre-populating ASINs for ${searchTerm}:`, error);
        }
      }
      
      console.log(`[BrandKeywords] Pre-populated ${totalASINsAdded} total ASINs for brand: ${brandName}`);
      return totalASINsAdded;
    } catch (error) {
      console.error('[BrandKeywords] Error in prePopulateBrandASINs:', error);
      return 0;
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
   * Track keyword rankings with progress callback
   */
  static async trackKeywordRankingsWithProgress(
    brandName: string, 
    keywords?: string[], 
    onProgress?: ProgressCallback,
    depth: number = 100 // Allow customizable depth
  ): Promise<boolean> {
    return this.trackKeywordRankingsInternal(brandName, keywords, onProgress, depth);
  }

  /**
   * Track keyword rankings using DataForSEO SERP API with parallel processing
   */
  static async trackKeywordRankings(brandName: string, keywords?: string[]): Promise<boolean> {
    return this.trackKeywordRankingsInternal(brandName, keywords);
  }

  /**
   * Internal method for tracking keyword rankings with optional progress reporting
   */
  private static async trackKeywordRankingsInternal(
    brandName: string, 
    keywords?: string[], 
    onProgress?: ProgressCallback,
    depth: number = 100
  ): Promise<boolean> {
    try {
      const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
      const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
      
      if (!username || !password) {
        console.error('[DataForSEO] Credentials not configured');
        onProgress?.('Error', 0, 100, 'DataForSEO credentials not configured');
        return false;
      }

      onProgress?.('Loading Keywords', 10, 100, 'Fetching keywords from database...');

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
        onProgress?.('Error', 0, 100, 'No keywords found to track');
        return false;
      }

      console.log(`[BrandKeywords] Starting parallel ranking tracking for ${keywordsToTrack.length} keywords`);
      
      // Submit ALL tasks in parallel (DataForSEO can handle up to 100 tasks)
      const maxBatchSize = 100;
      // Maximize parallel batch submissions for speed
      const maxParallelBatches = 20; // Submit up to 20 batches simultaneously (2000 keywords)
      
      onProgress?.('Loading', 15, 100, `Found ${keywordsToTrack.length} keywords for brand "${brandName}"`);
      onProgress?.('Loading', 20, 100, `Preparing to submit ${Math.ceil(keywordsToTrack.length / maxBatchSize)} batch${Math.ceil(keywordsToTrack.length / maxBatchSize) > 1 ? 'es' : ''}...`);

      const credentials = btoa(`${username}:${password}`);
      
      onProgress?.('Submitting Tasks', 25, 100, 'Creating task batches...');
      
      // Split keywords into batches
      const batches: BrandKeyword[][] = [];
      for (let i = 0; i < keywordsToTrack.length; i += maxBatchSize) {
        batches.push(keywordsToTrack.slice(i, i + maxBatchSize));
      }
      
      // Process batches in parallel groups
      const allTaskPromises: Promise<any>[] = [];
      for (let i = 0; i < batches.length; i += maxParallelBatches) {
        const parallelGroup = batches.slice(i, i + maxParallelBatches);
        
        // Submit this group of batches in parallel
        const groupPromises = parallelGroup.map(batch => {
          // Create Amazon SERP API requests for this batch
          const serpRequests = batch.map(kw => ({
            keyword: kw.keyword,
            location_code: 2840, // United States
            language_code: "en_US", // Amazon merchant API requires full locale
            depth: depth, // Configurable depth (default 100)
            tag: `parallel-${brandName}-${Date.now()}-${kw.keyword.replace(/\s+/g, '-').substring(0, 20)}`
          }));
          
          return this.submitSerpBatch(serpRequests, batch, brandName, credentials);
        });
        
        // Wait for this group before proceeding to avoid rate limits
        const groupResults = await Promise.allSettled(groupPromises);
        allTaskPromises.push(...groupPromises);
        
        // No delay between groups - rely on DataForSEO's rate limiting
        // This maximizes submission speed
      }

      // Wait for all task submissions to complete
      console.log(`[BrandKeywords] Submitting ${allTaskPromises.length} parallel batches`);
      onProgress?.('Submitting', 30, 100, `Submitting ${batches.length} batch${batches.length > 1 ? 'es' : ''} (${keywordsToTrack.length} keywords) to DataForSEO...`);
      onProgress?.('Submitting', 32, 100, `Using ${maxParallelBatches} parallel connections for maximum speed...`);
      
      const allTaskResults = await Promise.allSettled(allTaskPromises);
      
      // Collect all successful task IDs and their corresponding keywords
      const allTasks: Array<{ taskId: string; keyword: BrandKeyword }> = [];
      let failedBatches = 0;
      allTaskResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allTasks.push(...result.value);
        } else {
          failedBatches++;
          console.error(`[BrandKeywords] Batch ${index} failed:`, result.status === 'rejected' ? result.reason : 'No value returned');
        }
      });

      if (failedBatches > 0) {
        console.warn(`[BrandKeywords] ${failedBatches} batches failed to submit`);
        onProgress?.('Warning', 35, 100, `⚠️ ${failedBatches} batch${failedBatches > 1 ? 'es' : ''} failed to submit`);
      }

      if (allTasks.length === 0) {
        console.error('[BrandKeywords] No SERP tasks were successfully submitted');
        onProgress?.('Error', 0, 100, '❌ Failed to submit any SERP tasks - check API credentials');
        return false;
      }

      console.log(`[BrandKeywords] Successfully submitted ${allTasks.length} SERP tasks. Starting parallel processing...`);
      onProgress?.('Submitted', 38, 100, `✅ Successfully submitted ${allTasks.length} keyword${allTasks.length > 1 ? 's' : ''} for tracking`);
      onProgress?.('Processing', 40, 100, `🔄 Starting parallel processing to check rankings...`);

      // Process all tasks in parallel with optimized polling
      await this.processAllSerpTasksInParallelWithProgress(allTasks, brandName, credentials, onProgress);

      // Ensure all pending database operations are completed
      onProgress?.('Finalizing', 90, 100, 'Completing database operations...');
      await this.executeBatchInsert();
      
      // Update brand ranking summary
      onProgress?.('Finalizing', 95, 100, 'Updating brand ranking summary...');
      await this.updateBrandRankingSummary(brandName);
      
      onProgress?.('Complete', 100, 100, 'Keyword ranking tracking completed successfully!');
      return true;
    } catch (error) {
      console.error('Error in trackKeywordRankings:', error);
      onProgress?.('Error', 0, 100, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Submit a batch of SERP requests and return task info
   */
  private static async submitSerpBatch(
    serpRequests: any[], 
    keywords: BrandKeyword[], 
    brandName: string, 
    credentials: string
  ): Promise<Array<{ taskId: string; keyword: BrandKeyword }> | null> {
    try {
      const response = await fetch('https://api.dataforseo.com/v3/merchant/amazon/products/task_post', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serpRequests)
      });

      if (!response.ok) {
        console.error(`[DataForSEO] SERP batch submission failed:`, response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.status_code === 20000 && data.tasks) {
        const taskResults: Array<{ taskId: string; keyword: BrandKeyword }> = [];
        
        data.tasks.forEach((task: any, index: number) => {
          if (task.id && task.status_code === 20100) {
            taskResults.push({
              taskId: task.id,
              keyword: keywords[index]
            });
          } else {
            console.warn(`[BrandKeywords] Task ${index} failed:`, task.status_code, task.status_message);
          }
        });
        
        console.log(`[BrandKeywords] Submitted batch of ${taskResults.length} tasks (out of ${data.tasks.length} total)`);
        if (taskResults.length === 0) {
          console.error('[BrandKeywords] All tasks in batch failed:', data.tasks);
        }
        return taskResults.length > 0 ? taskResults : null;
      }
      
      console.error('[BrandKeywords] Invalid response from DataForSEO:', data);
      return null;
    } catch (error) {
      console.error('[BrandKeywords] Error submitting SERP batch:', error);
      return null;
    }
  }

  /**
   * Detect if a search result belongs to the tracked brand
   */
  private static detectBrandMatch(brandName: string, title: string, url?: string, additionalData?: any): {
    isBrandResult: boolean;
    matchScore: number;
    matchReason: string;
  } {
    const brandLower = brandName.toLowerCase().trim();
    const titleLower = title.toLowerCase();
    const urlLower = url?.toLowerCase() || '';
    
    let score = 0;
    const reasons: string[] = [];
    
    // Exact brand name match at start of title (highest confidence)
    if (titleLower.startsWith(brandLower + ' ') || titleLower.startsWith(brandLower + ':') || titleLower.startsWith(brandLower + ',')) {
      score = 1.0; // Maximum confidence
      reasons.push('exact_brand_start');
      return {
        isBrandResult: true,
        matchScore: score,
        matchReason: reasons.join(', ')
      };
    }
    
    // Check if title starts with brand (accounting for variations)
    const brandVariations = [
      brandLower,
      brandLower.replace(/[\s-_]/g, ''), // Remove spaces/hyphens
      brandLower.replace(/\s+/g, '-'), // Space to hyphen
      brandLower.replace(/\s+/g, '_'), // Space to underscore
    ];
    
    for (const variant of brandVariations) {
      if (titleLower.startsWith(variant + ' ') || titleLower.startsWith(variant + ':') || titleLower.startsWith(variant + ',')) {
        score = 0.95;
        reasons.push('brand_variant_start');
        return {
          isBrandResult: true,
          matchScore: score,
          matchReason: reasons.join(', ')
        };
      }
    }
    
    // Direct brand name match anywhere in title (high confidence)
    const brandRegex = new RegExp(`\\b${brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (brandRegex.test(title)) {
      score += 0.8;
      reasons.push('brand_name_in_title');
    }
    
    // Check "by [Brand]" pattern (very high confidence)
    const byBrandPattern = new RegExp(`\\bby\\s+${brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (byBrandPattern.test(title)) {
      score += 0.9;
      reasons.push('by_brand_pattern');
    }
    
    // Brand name in URL (low confidence - many URLs contain multiple brand names)
    if (urlLower.includes(brandLower.replace(/\s+/g, '-')) || urlLower.includes(brandLower.replace(/\s+/g, ''))) {
      score += 0.2;
      reasons.push('brand_in_url');
    }
    
    // Handle multi-word brands - all words must be present in correct order
    const brandWords = brandLower.split(/\s+/);
    if (brandWords.length > 1) {
      // Check if words appear in order (not necessarily consecutive)
      let lastIndex = -1;
      let allWordsInOrder = true;
      for (const word of brandWords) {
        const index = titleLower.indexOf(word, lastIndex + 1);
        if (index === -1) {
          allWordsInOrder = false;
          break;
        }
        lastIndex = index;
      }
      if (allWordsInOrder) {
        score += 0.5;
        reasons.push('brand_words_in_order');
      }
    }
    
    // Cap score at 1.0
    score = Math.min(score, 1.0);
    
    // Higher threshold for brand matching to reduce false positives
    const isBrandResult = score >= 0.7; // Increased from 0.5
    
    return {
      isBrandResult,
      matchScore: Math.round(score * 100) / 100,
      matchReason: reasons.join(', ') || 'no_match'
    };
  }

  /**
   * Process all SERP tasks in parallel with progress reporting
   */
  private static async processAllSerpTasksInParallelWithProgress(
    allTasks: Array<{ taskId: string; keyword: BrandKeyword }>,
    brandName: string, 
    credentials: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    return this.processAllSerpTasksInParallelInternal(allTasks, brandName, credentials, onProgress);
  }

  /**
   * Process all SERP tasks in parallel with optimized polling
   */
  private static async processAllSerpTasksInParallel(
    allTasks: Array<{ taskId: string; keyword: BrandKeyword }>,
    brandName: string, 
    credentials: string
  ): Promise<void> {
    return this.processAllSerpTasksInParallelInternal(allTasks, brandName, credentials);
  }

  /**
   * Internal method for processing SERP tasks with optional progress reporting
   */
  private static async processAllSerpTasksInParallelInternal(
    allTasks: Array<{ taskId: string; keyword: BrandKeyword }>,
    brandName: string, 
    credentials: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    console.log(`[BrandKeywords] Starting parallel processing of ${allTasks.length} SERP tasks`);
    onProgress?.('Processing', 45, 100, `🔄 Beginning result collection for ${allTasks.length} keywords...`);
    
    let failedTasks = 0;
    let processedKeywords: string[] = [];
    
    const maxWaitTime = 180000; // 3 minutes max
    const pollInterval = 500; // Check every 500ms for even faster response
    const startTime = Date.now();
    
    let completedTasks = new Set<string>();
    const processingPromises = new Map<string, Promise<void>>();
    const maxConcurrentProcessing = 100; // Process up to 100 results simultaneously for maximum speed
    
    while (completedTasks.size < allTasks.length && (Date.now() - startTime) < maxWaitTime) {
      try {
        // Check which tasks are ready
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        console.log(`[BrandKeywords] Polling for ready tasks... (${completedTasks.size}/${allTasks.length} completed)`);
        onProgress?.('Polling', 45 + Math.round((completedTasks.size / allTasks.length) * 45), 100, 
          `⏱️ Checking task status... (${completedTasks.size}/${allTasks.length} complete, ${elapsedSeconds}s elapsed)`);
        
        // Use GET to check ready tasks
        const readyResponse = await fetch('https://api.dataforseo.com/v3/merchant/amazon/products/tasks_ready', {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (readyResponse.ok) {
          const readyData = await readyResponse.json();
          console.log(`[BrandKeywords] Ready tasks response:`, readyData.status_code, readyData.tasks?.length || 0);
          if (readyData.status_code === 20000 && readyData.tasks) {
            const readyTaskIds = readyData.tasks.map((task: any) => task.id);
            
            // Debug: Log the structure of ready tasks to understand tag placement
            if (readyData.tasks.length > 0) {
              console.log(`[BrandKeywords] Sample ready task structure:`, JSON.stringify(readyData.tasks[0], null, 2));
            }
            
            // Filter ready tasks by our tag pattern and ensure they're actually complete
            const tagFilter = `parallel-${brandName}-`;
            const relevantReadyTasks = readyData.tasks.filter((task: any) => {
              // According to DataForSEO docs, tag is at the root level of task object
              const taskTag = task.tag;
              const isOurTask = taskTag && typeof taskTag === 'string' && taskTag.startsWith(tagFilter);
              
              if (isOurTask && task.status_code !== 20000) {
                console.log(`[BrandKeywords] Task ${task.id} matches tag but status is ${task.status_code} (not ready)`);
                return false;
              }
              
              if (taskTag) {
                console.log(`[BrandKeywords] Task ${task.id} has tag: "${taskTag}", status: ${task.status_code}`);
              }
              
              return isOurTask && task.status_code === 20000;
            });
            
            console.log(`[BrandKeywords] Total ready tasks:`, readyTaskIds.length, 'Relevant tasks:', relevantReadyTasks.length);
            
            const relevantTaskIds = relevantReadyTasks.map((task: any) => task.id);
            
            // Process newly completed tasks in parallel
            console.log(`[BrandKeywords] Ready task IDs:`, relevantTaskIds.slice(0, 5), '...');
            console.log(`[BrandKeywords] Our task IDs:`, allTasks.slice(0, 5).map(t => t.taskId), '...');
            
            // Debug: Check if any task IDs match
            const matchingIds = allTasks.filter(task => relevantTaskIds.includes(task.taskId));
            console.log(`[BrandKeywords] Matching task IDs found:`, matchingIds.length);
            if (matchingIds.length === 0 && relevantTaskIds.length > 0) {
              console.warn(`[BrandKeywords] No matching task IDs! Example ready ID: "${relevantTaskIds[0]}", Example our ID: "${allTasks[0]?.taskId}"`);
            }
            
            const newlyReady = allTasks.filter(task => 
              relevantTaskIds.includes(task.taskId) && 
              !completedTasks.has(task.taskId) &&
              !processingPromises.has(task.taskId)
            );
            
            console.log(`[BrandKeywords] Found ${newlyReady.length} newly ready tasks to process`);
            
            // Only attempt direct fetch if enough time has passed
            if (newlyReady.length === 0 && completedTasks.size < allTasks.length) {
              const remaining = allTasks.length - completedTasks.size;
              const elapsedMs = Date.now() - startTime;
              
              // Don't attempt any fetches in the first 10 seconds
              if (elapsedMs < 10000) {
                console.log(`[BrandKeywords] ${remaining} tasks pending. Waiting for initial processing...`);
              } else {
                console.log(`[BrandKeywords] No matching ready tasks found. ${remaining} tasks still pending.`);
                
                // Only try direct fetch if there are unmatched ready tasks (likely tag mismatch)
                if (readyTaskIds.length > relevantTaskIds.length && elapsedMs > 30000) {
                  console.log(`[BrandKeywords] Found ${readyTaskIds.length - relevantTaskIds.length} unmatched ready tasks after ${Math.round(elapsedMs/1000)}s`);
                  console.log(`[BrandKeywords] Attempting direct fetch for some unprocessed tasks...`);
                  
                  // Try to fetch some unprocessed tasks directly
                  const unprocessedTasks = allTasks.filter(task => 
                    !completedTasks.has(task.taskId) && 
                    !processingPromises.has(task.taskId)
                  ).slice(0, 1); // Try 1 at a time to avoid overwhelming
                  
                  if (unprocessedTasks.length > 0) {
                    console.log(`[BrandKeywords] Attempting direct fetch for ${unprocessedTasks.length} tasks`);
                    newlyReady.push(...unprocessedTasks);
                  }
                }
              }
            }
            
            // Process tasks in batches to limit concurrent connections
            const tasksToProcess = newlyReady.slice(0, maxConcurrentProcessing - processingPromises.size);
            
            // Start processing newly ready tasks in parallel
            const newProcessingPromises = tasksToProcess.map(task => {
              const processingPromise = this.processSingleSerpResult(
                task.taskId, 
                task.keyword, 
                brandName, 
                credentials
              ).then(() => {
                completedTasks.add(task.taskId);
                processingPromises.delete(task.taskId);
                processedKeywords.push(task.keyword.keyword);
                console.log(`[BrandKeywords] Completed ${completedTasks.size}/${allTasks.length} tasks`);
                
                // Update progress as tasks complete
                const progressPercent = 45 + Math.round((completedTasks.size / allTasks.length) * 45); // 45-90%
                const remainingTime = completedTasks.size > 0 ? 
                  Math.round(((Date.now() - startTime) / completedTasks.size) * (allTasks.length - completedTasks.size) / 1000) : 0;
                  
                onProgress?.('Processing', progressPercent, 100, 
                  `📊 Processed "${task.keyword.keyword}" (${completedTasks.size}/${allTasks.length} complete, ~${remainingTime}s remaining)`);
              }).catch((error) => {
                processingPromises.delete(task.taskId);
                
                // Check if it's a temporary error (task not ready yet)
                const isTemporaryError = (error as any).isTemporary || 
                  error.message?.includes('in queue') || 
                  error.message?.includes('in progress');
                
                if (!isTemporaryError) {
                  // Permanent failure - log error and mark as completed
                  console.error(`[BrandKeywords] Error processing task ${task.taskId}:`, error);
                  completedTasks.add(task.taskId);
                  failedTasks++;
                  
                  // Update progress for failed tasks
                  const progressPercent = 45 + Math.round((completedTasks.size / allTasks.length) * 45);
                  onProgress?.('Warning', progressPercent, 100, 
                    `⚠️ Failed to process "${task.keyword.keyword}" (${completedTasks.size}/${allTasks.length}, ${failedTasks} failed)`);
                } else {
                  // Temporary error - this is normal, task will be retried
                  // Don't log as error to avoid confusion
                  console.log(`[BrandKeywords] Task for "${task.keyword.keyword}" not ready yet - will check again`);
                }
              });
              
              processingPromises.set(task.taskId, processingPromise);
              return processingPromise;
            });
            
            // Process in parallel
            await Promise.allSettled(newProcessingPromises);
            
            if (newlyReady.length > 0) {
              console.log(`[BrandKeywords] Started processing ${newlyReady.length} newly ready tasks (${processingPromises.size} in progress)`);
            }
          } else {
            console.warn('[BrandKeywords] No ready tasks found in response or invalid status code');
          }
        } else {
          console.error('[BrandKeywords] Failed to check ready tasks:', readyResponse.status, readyResponse.statusText);
        }
      } catch (error) {
        console.warn('[BrandKeywords] Error in parallel polling:', error);
      }
      
      // Add longer initial wait for first attempt to reduce "in queue" errors
      const elapsedTime = Date.now() - startTime;
      const minWaitBeforeFirstAttempt = 10000; // Wait 10 seconds before first attempt
      
      if (elapsedTime < minWaitBeforeFirstAttempt && processingPromises.size === 0 && completedTasks.size === 0) {
        const waitRemaining = Math.round((minWaitBeforeFirstAttempt - elapsedTime) / 1000);
        console.log(`[BrandKeywords] Waiting ${waitRemaining}s before first processing attempt...`);
        onProgress?.('Waiting', 45 + Math.round((elapsedTime / minWaitBeforeFirstAttempt) * 10), 100, 
          `⏳ Tasks submitted, waiting ${waitRemaining}s for processing to begin...`);
      }
      
      // If we're processing tasks, poll more aggressively
      const currentPollInterval = processingPromises.size > 0 ? pollInterval / 2 : pollInterval;
      
      // Wait before next poll if not all tasks are complete
      if (completedTasks.size < allTasks.length) {
        await new Promise(resolve => setTimeout(resolve, currentPollInterval));
      }
    }
    
    // Wait for any remaining processing to complete
    if (processingPromises.size > 0) {
      console.log(`[BrandKeywords] Waiting for ${processingPromises.size} remaining tasks to finish processing...`);
      onProgress?.('Processing Tasks', 90, 100, `Waiting for ${processingPromises.size} remaining tasks...`);
      await Promise.allSettled(Array.from(processingPromises.values()));
    }
    
    const finalCompletedCount = completedTasks.size;
    const totalTasks = allTasks.length;
    const elapsedTime = Date.now() - startTime;
    
    if (elapsedTime >= maxWaitTime) {
      console.warn(`[BrandKeywords] Timeout reached after ${Math.round(elapsedTime/1000)}s`);
    }
    
    if (finalCompletedCount < totalTasks) {
      const completionPercent = ((finalCompletedCount/totalTasks)*100).toFixed(1);
      console.warn(`[BrandKeywords] Completed ${finalCompletedCount}/${totalTasks} tasks (${completionPercent}%) in ${Math.round(elapsedTime/1000)}s`);
      onProgress?.('Partial Complete', 90, 100, 
        `⚠️ Partial completion: ${finalCompletedCount}/${totalTasks} keywords processed (${completionPercent}%) in ${Math.round(elapsedTime/1000)}s`);
    } else {
      const avgTimePerKeyword = (elapsedTime / totalTasks / 1000).toFixed(1);
      console.log(`[BrandKeywords] Successfully completed all ${totalTasks} SERP tasks in parallel in ${Math.round(elapsedTime/1000)}s! 🚀`);
      onProgress?.('Complete', 90, 100, 
        `✅ Successfully processed all ${totalTasks} keywords in ${Math.round(elapsedTime/1000)}s (${avgTimePerKeyword}s per keyword)! 🚀`);
    }
    
    if (failedTasks > 0) {
      onProgress?.('Summary', 91, 100, `⚠️ Note: ${failedTasks} keyword${failedTasks > 1 ? 's' : ''} failed to process`);
    }
  }

  /**
   * Batch database operations for better performance
   */
  private static pendingRankings: Partial<KeywordRanking>[] = [];
  private static pendingSerpFeatures: Partial<SerpFeature>[] = [];
  private static batchInsertPromise: Promise<void> | null = null;
  private static batchInsertTimeout: NodeJS.Timeout | null = null;

  /**
   * Add rankings to batch and trigger batch insert
   */
  private static async addToBatch(
    rankings: Partial<KeywordRanking>[], 
    serpFeatures: Partial<SerpFeature>[]
  ): Promise<void> {
    this.pendingRankings.push(...rankings);
    this.pendingSerpFeatures.push(...serpFeatures);
    
    // Clear existing timeout
    if (this.batchInsertTimeout) {
      clearTimeout(this.batchInsertTimeout);
    }
    
    // Execute batch insert more frequently for real-time updates
    if (this.pendingRankings.length >= 100 || this.pendingSerpFeatures.length >= 50) { // Reduced thresholds
      await this.executeBatchInsert();
    } else {
      // Otherwise, wait a bit to collect more data
      this.batchInsertTimeout = setTimeout(() => {
        this.executeBatchInsert();
      }, 250); // Reduced from 1000ms to 250ms for faster updates
    }
  }

  /**
   * Execute batch database insert
   */
  private static async executeBatchInsert(): Promise<void> {
    if (this.batchInsertPromise) {
      return this.batchInsertPromise;
    }
    
    this.batchInsertPromise = (async () => {
      try {
        // Insert rankings in batches
        if (this.pendingRankings.length > 0) {
          const rankingsToInsert = [...this.pendingRankings];
          this.pendingRankings = [];
          
          // Process multiple chunks in parallel for faster DB operations
          const chunkSize = 500;
          const insertPromises = [];
          for (let i = 0; i < rankingsToInsert.length; i += chunkSize) {
            const chunk = rankingsToInsert.slice(i, i + chunkSize);
            insertPromises.push(
              supabase.from('keyword_rankings').insert(chunk)
                .then(({ error }) => {
                  if (error) {
                    console.error(`[BrandKeywords] Error batch inserting rankings:`, error);
                  } else {
                    console.log(`[BrandKeywords] Batch inserted ${chunk.length} rankings`);
                  }
                })
            );
          }
          await Promise.all(insertPromises);
        }
        
        // Insert SERP features in batches
        if (this.pendingSerpFeatures.length > 0) {
          const featuresToInsert = [...this.pendingSerpFeatures];
          this.pendingSerpFeatures = [];
          
          const { error } = await supabase.from('keyword_serp_features').insert(featuresToInsert);
          if (error) {
            console.error(`[BrandKeywords] Error batch inserting SERP features:`, error);
          } else {
            console.log(`[BrandKeywords] Batch inserted ${featuresToInsert.length} SERP features`);
          }
        }
      } finally {
        this.batchInsertPromise = null;
      }
    })();
    
    return this.batchInsertPromise;
  }

  /**
   * Process a single SERP result
   */
  private static async processSingleSerpResult(
    taskId: string,
    keyword: BrandKeyword,
    brandName: string,
    credentials: string
  ): Promise<void> {
    try {
      // Get Amazon SERP results
      const response = await fetch(`https://api.dataforseo.com/v3/merchant/amazon/products/task_get/advanced/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`[BrandKeywords] Failed to get SERP results for keyword: ${keyword.keyword}`);
        return;
      }

      const result = await response.json();
      
      // Debug logging to understand response structure
      console.log(`[BrandKeywords] Task ${taskId} response status:`, result.status_code);
      
      if (result.status_code !== 20000) {
        console.error(`[BrandKeywords] Task ${taskId} failed with status:`, result.status_code, result.status_message);
        return;
      }
      
      if (!result.tasks || result.tasks.length === 0) {
        console.error(`[BrandKeywords] Task ${taskId} has no tasks in response`);
        return;
      }
      
      const task = result.tasks[0];
      console.log(`[BrandKeywords] Task ${taskId} status:`, task.status_code, task.status_message);
      
      // Check if task is still processing or in queue
      if (task.status_code === 20100 || task.status_code === 40602) {
        // This is expected behavior - tasks take time to process
        const status = task.status_code === 40602 ? 'in queue' : 'in progress';
        console.log(`[BrandKeywords] Task ${taskId} is still ${status} - will retry later`);
        // Throw a specific error that will be caught and handled gracefully
        const error = new Error(`Task still ${status}`);
        (error as any).isTemporary = true;
        throw error;
      }
      
      if (task.status_code !== 20000) {
        console.error(`[BrandKeywords] Task ${taskId} failed:`, task.status_code, task.status_message);
        return;
      }

      console.log(`[BrandKeywords] Task result structure:`, {
        hasResult: !!task.result,
        resultLength: task.result?.length,
        hasFirstResult: !!task.result?.[0],
        hasItems: !!task.result?.[0]?.items,
        itemsLength: task.result?.[0]?.items?.length || 0
      });
      
      if (task.result?.[0]?.items) {
        const items = task.result[0].items;
        
        // Debug: Log the structure of the first few items
        if (items.length > 0) {
          console.log(`[BrandKeywords] Sample item structure for keyword "${keyword.keyword}":`, JSON.stringify(items[0], null, 2));
          console.log(`[BrandKeywords] Total items returned: ${items.length}`);
          console.log(`[BrandKeywords] Item types found:`, [...new Set(items.map((item: any) => item.type))]);
        }
        
        // Process Amazon search results
        // According to DataForSEO docs, Amazon products have type "amazon_serp"
        let organicResults = items.filter((item: any) => 
          item.type === 'amazon_serp' && item.asin
        );
        
        // If no results with amazon_serp, try other product types
        if (organicResults.length === 0 && items.length > 0) {
          console.log(`[BrandKeywords] No results with type 'amazon_serp', trying alternative filter...`);
          organicResults = items.filter((item: any) => 
            item.asin && item.title && !item.type?.includes('paid')
          );
        }

        console.log(`[BrandKeywords] Found ${organicResults.length} organic results for keyword: ${keyword.keyword}`);
        
        // Debug: Log sample results to understand the data
        if (organicResults.length > 0) {
          console.log(`[BrandKeywords] Sample result for brand matching:`, {
            keyword: keyword.keyword,
            brandName: brandName,
            firstResult: {
              title: organicResults[0].title,
              asin: organicResults[0].asin,
              url: organicResults[0].url
            }
          });
        }

        // First, get all ASINs from results to check their brands
        const asinList = organicResults.map(r => r.asin).filter(Boolean);
        
        // Fetch brand info for all ASINs in one query
        const asinBrandMap = new Map<string, string>();
        if (asinList.length > 0) {
          // Query in chunks to avoid potential query size limits
          const chunkSize = 100;
          for (let i = 0; i < asinList.length; i += chunkSize) {
            const chunk = asinList.slice(i, i + chunkSize);
            const { data: asinData, error } = await supabase
              .from('asins')
              .select('asin, brand')
              .in('asin', chunk);
              
            if (!error && asinData) {
              asinData.forEach(item => {
                if (item.brand) {
                  asinBrandMap.set(item.asin, item.brand);
                }
              });
            }
          }
          
          console.log(`[BrandKeywords] Found brand data for ${asinBrandMap.size}/${asinList.length} ASINs`);
        }
        
        // Prepare batch data for rankings and features
        const rankingsBatch: Partial<KeywordRanking>[] = [];
        const featuresBatch: Partial<SerpFeature>[] = [];
        const brandMatches: string[] = [];
        let nonBrandCount = 0;
        let unknownBrandCount = 0;
        
        for (const amazonResult of organicResults) {
          if (!amazonResult.asin) {
            continue; // Skip results without ASIN
          }
          
          // Check if this ASIN belongs to the tracked brand
          const asinBrand = asinBrandMap.get(amazonResult.asin);
          
          if (!asinBrand) {
            // ASIN not in our database yet - try to extract brand from title
            unknownBrandCount++;
            
            // Extract potential brand from title (usually first words before certain patterns)
            let extractedBrand = '';
            const titleLower = amazonResult.title?.toLowerCase() || '';
            const title = amazonResult.title || '';
            
            // Common patterns where brand name appears before
            const patterns = [
              /^([^,:\-\(\[]+?)\s*[,:\-\(\[]/,  // Brand before comma, colon, dash, or parenthesis
              /^(\S+(?:\s+\S+){0,2})\s+/,  // First 1-3 words
            ];
            
            for (const pattern of patterns) {
              const match = title.match(pattern);
              if (match && match[1]) {
                extractedBrand = match[1].trim();
                break;
              }
            }
            
            // Store new ASIN for future reference
            if (extractedBrand && amazonResult.asin) {
              const { error } = await supabase
                .from('asins')
                .upsert({
                  asin: amazonResult.asin,
                  title: amazonResult.title,
                  brand: extractedBrand,
                  current_price: amazonResult.price?.current || 0,
                  review_rating: amazonResult.rating?.value || 0,
                  review_count: amazonResult.rating?.votes_count || 0,
                  category: amazonResult.main_category || '',
                  subcategory: amazonResult.sub_category || '',
                  last_updated: new Date().toISOString()
                }, {
                  onConflict: 'asin',
                  ignoreDuplicates: false
                });
                
              if (!error) {
                console.log(`[BrandKeywords] Added new ASIN ${amazonResult.asin} with brand: ${extractedBrand}`);
                
                // Check if it matches our target brand
                if (extractedBrand.toLowerCase() === brandName.toLowerCase()) {
                  // Add to our map for immediate use
                  asinBrandMap.set(amazonResult.asin, extractedBrand);
                  // Don't continue - let it be processed below
                } else {
                  continue;
                }
              } else {
                console.error(`[BrandKeywords] Error adding ASIN ${amazonResult.asin}:`, error);
                continue;
              }
            } else {
              console.log(`[BrandKeywords] Unknown ASIN ${amazonResult.asin}: ${amazonResult.title} (no brand extracted)`);
              continue;
            }
          }
          
          // Get the brand from our map (which includes newly added ASINs)
          const currentBrand = asinBrandMap.get(amazonResult.asin);
          
          // Compare brands (case-insensitive)
          const isBrandMatch = currentBrand && currentBrand.toLowerCase() === brandName.toLowerCase();
          
          if (isBrandMatch) {
            const ranking: Partial<KeywordRanking> = {
              brand_keyword_id: keyword.id!,
              asin: amazonResult.asin,
              position: amazonResult.rank_absolute || amazonResult.position,
              page: Math.ceil((amazonResult.rank_absolute || amazonResult.position_absolute) / 16),
              url: amazonResult.url,
              title: amazonResult.title,
              domain: 'amazon.com',
              location_code: 2840,
              language_code: 'en_US',
              check_date: new Date().toISOString(),
              is_brand_result: true,
              brand_match_score: 1.0, // 100% confidence from database
              brand_match_reason: 'database_brand_match'
            };

            rankingsBatch.push(ranking);
            brandMatches.push(`"${keyword.keyword}": Position ${ranking.position} - ${amazonResult.title}`);
          } else {
            nonBrandCount++;
          }
        }
        
        // Always log filtering results to confirm it's working
        console.log(`[BrandKeywords] Keyword "${keyword.keyword}" filtering complete:`);
        console.log(`  - ${brandMatches.length} ${brandName} products found and stored`);
        console.log(`  - ${nonBrandCount} products from other brands filtered out`);
        console.log(`  - ${unknownBrandCount} unknown ASINs (${unknownBrandCount > 0 ? 'added to database' : 'none'})`);

        // Add to batch instead of immediate insert
        if (rankingsBatch.length > 0 || featuresBatch.length > 0) {
          await this.addToBatch(rankingsBatch, featuresBatch);
          console.log(`[BrandKeywords] Added ${rankingsBatch.length} rankings and ${featuresBatch.length} features to batch for keyword: ${keyword.keyword}`);
        }

        // Log brand matches
        if (brandMatches.length > 0) {
          console.log(`[BrandKeywords] Brand matches found: ${brandMatches.join(', ')}`);
        }

        // Prepare batch data for SERP features (sponsored products, etc)
        const serpFeatures = items.filter((item: any) => 
          item.type === 'amazon_paid' || item.type === 'editorial_recommendations' || item.type === 'amazon_featured_snippet'
        );

        for (const feature of serpFeatures) {
          const serpFeature: Partial<SerpFeature> = {
            brand_keyword_id: keyword.id!,
            feature_type: feature.type, // 'amazon_sponsored', 'amazon_paid', etc.
            position: feature.rank_absolute || feature.position_absolute,
            title: feature.title,
            url: feature.url,
            description: feature.description,
            additional_data: {
              asin: feature.asin,
              price: feature.price?.current,
              currency: feature.price?.currency,
              rating: feature.rating?.value,
              reviews_count: feature.rating?.votes_count,
              is_prime: feature.is_prime,
              delivery_info: feature.delivery_info,
              bestseller_badge: feature.bestseller_label,
              amazon_choice: feature.amazon_choice_label
            },
            check_date: new Date().toISOString()
          };

          featuresBatch.push(serpFeature);
        }

        // SERP features are now handled by the batch insert system

        console.log(`[BrandKeywords] Successfully processed ${organicResults.length} rankings for keyword: ${keyword.keyword}`);
      } else {
        console.warn(`[BrandKeywords] No valid SERP data for keyword: ${keyword.keyword}`);
        console.log(`[BrandKeywords] API Response:`, result);
      }
    } catch (error) {
      console.error(`[BrandKeywords] Error processing SERP results for ${keyword.keyword}:`, error);
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
      
      // Calculate visibility score (weighted by search volume and position)
      const visibilityScore = performanceData.reduce((score, p) => {
        if (!p.position || p.position > 100) return score;
        const positionWeight = Math.max(0, (101 - p.position) / 100);
        return score + (p.search_volume || 0) * positionWeight;
      }, 0);

      const now = new Date();
      const summary: Partial<BrandRankingSummary> = {
        brand_name: brandName,
        total_keywords: totalKeywords,
        ranking_keywords: rankingKeywords,
        top_10_keywords: top10Keywords,
        top_3_keywords: top3Keywords,
        avg_position: Math.round(avgPosition * 100) / 100,
        visibility_score: Math.round(visibilityScore * 100) / 100,
        total_search_volume: totalSearchVolume,
        check_date: now.toISOString(),
        check_date_only: now.toISOString().split('T')[0]
      };

      await supabase
        .from('brand_ranking_summary')
        .upsert(summary, { 
          onConflict: 'brand_name,check_date_only' 
        });

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
   * Get brand-specific ranking performance (only results where brand appears)
   */
  static async getBrandVisibilityPerformance(brandName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('brand_keyword_performance')
        .select('*')
        .eq('brand_name', brandName)
        .eq('is_brand_result', true)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching brand visibility performance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBrandVisibilityPerformance:', error);
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
   * Get real keyword volume data from DataForSEO Keywords API
   */
  static async getKeywordVolumeData(keywords: string[]): Promise<Map<string, { volume: number; cpc: number; competition: number }>> {
    try {
      const username = import.meta.env.VITE_DATAFORSEO_USERNAME;
      const password = import.meta.env.VITE_DATAFORSEO_PASSWORD;
      
      if (!username || !password) {
        console.error('[DataForSEO] Credentials not configured for keyword volume');
        return new Map();
      }

      const credentials = btoa(`${username}:${password}`);
      const volumeData = new Map();

      // Process keywords in batches of 100 (DataForSEO limit)
      const batchSize = 100;
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        
        const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google/search_volume/task_post', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            keywords: batch,
            location_code: 2840, // United States
            language_code: "en",
            tag: `volume-check-${Date.now()}`
          }])
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status_code === 20000 && data.tasks?.[0]?.id) {
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Get results
            const taskId = data.tasks[0].id;
            const resultsResponse = await fetch(`https://api.dataforseo.com/v3/keywords_data/google/search_volume/task_get/${taskId}`, {
              method: 'GET',
              headers: { 'Authorization': `Basic ${credentials}` }
            });
            
            if (resultsResponse.ok) {
              const results = await resultsResponse.json();
              if (results.status_code === 20000 && results.tasks?.[0]?.result) {
                for (const item of results.tasks[0].result) {
                  volumeData.set(item.keyword, {
                    volume: item.search_volume || 0,
                    cpc: item.cpc || 0,
                    competition: item.competition || 0
                  });
                }
              }
            }
          }
        }
        
        // Minimal delay between batches
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000ms
      }

      return volumeData;
    } catch (error) {
      console.error('Error getting keyword volume data:', error);
      return new Map();
    }
  }

  /**
   * Get actual product data for a brand from the database
   */
  static async getBrandProducts(brandName: string): Promise<any[]> {
    try {
      // Use the correct columns from the actual schema
      const { data, error } = await supabase
        .from('asins')
        .select('asin, title, category, subcategory, current_price, review_rating, review_count')
        .eq('brand', brandName)
        .limit(10); // Get up to 10 products for context

      if (error) {
        console.error('Error fetching brand products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching brand products:', error);
      return [];
    }
  }

  /**
   * Get keyword suggestions from AI based on brand analysis (NON-BRANDED ONLY)
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

      // Get actual product data for better recommendations
      const brandProducts = await this.getBrandProducts(brandName);
      
      let productDetails = '';
      if (brandProducts.length > 0) {
        console.log(`[BrandKeywords] Found ${brandProducts.length} actual products for brand: ${brandName}`);
        productDetails = brandProducts.map(p => {
          const parts = [
            `- ${p.title || 'Unknown Product'}`,
            p.category ? `Category: ${p.category}` : null,
            p.subcategory ? `Subcategory: ${p.subcategory}` : null,
            p.current_price ? `Price: $${p.current_price}` : null,
            p.review_rating ? `Rating: ${p.review_rating}/5 (${p.review_count || 0} reviews)` : null
          ].filter(Boolean);
          return parts.join(' | ');
        }).join('\n');
      } else if (products.length > 0) {
        productDetails = `Generic products: ${products.join(', ')}`;
      } else {
        productDetails = 'No specific product data available';
      }

      const prompt = `You are an Amazon keyword researcher. Generate SPECIFIC product keywords that customers would search for when looking for these EXACT types of products (but without knowing the brand).

Actual Products Being Sold:
${productDetails}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

🚫 DO NOT INCLUDE THE BRAND NAME: "${brandName}"
- Do not use "${brandName}" in any keyword
- Do not use variations like "${brandName.replace(/\s+/g, '')}" or "${brandName.replace(/\s+/g, '-')}"

✅ GENERATE SPECIFIC KEYWORDS BASED ON THE ACTUAL PRODUCTS:
- Look at the specific product titles and categories above
- Extract key features, materials, and uses from the actual products
- Create keywords that match what customers would search for these specific items
- Focus on the unique characteristics of THESE products, not generic terms

Instructions:
1. Analyze the actual product titles and categories provided
2. Extract specific features, materials, scents, sizes, uses from the products
3. Generate keywords that are specific to these exact products
4. Include variations like "[material] [product]", "[feature] [product]", "[use case] [product]"
5. DO NOT generate generic category keywords unless they specifically match the products

Return ONLY valid JSON array:
[
  {
    "keyword": "generic keyword",
    "keyword_type": "product|category|general",
    "relevance_score": 1-10
  }
]

Generate 15-20 generic, non-branded keywords.`;

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
      
      // Clean the response content to remove markdown code blocks
      let content = data.choices[0].message.content;
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Trim whitespace
      content = content.trim();
      
      const recommendations = JSON.parse(content);
      
      // Apply focused brand filtering - only filter exact brand name matches
      const brandNameLower = brandName.toLowerCase();
      
      const strictlyNonBrandedRecommendations = recommendations.filter((rec: any) => {
        const keywordLower = rec.keyword.toLowerCase();
        
        // Use the same logic as the helper function for consistency
        if (this.containsBrandName(keywordLower, brandNameLower)) {
          console.log(`[BrandKeywords] ❌ FILTERED branded keyword: "${rec.keyword}" (contains exact brand name)`);
          return false;
        }
        
        console.log(`[BrandKeywords] ✅ APPROVED non-branded keyword: "${rec.keyword}"`);
        return true;
      });
      
      // Get real volume data for the non-branded keywords
      const keywordStrings = strictlyNonBrandedRecommendations.map((rec: any) => rec.keyword);
      const volumeData = await this.getKeywordVolumeData(keywordStrings);
      
      // Convert to our format with REAL volume data
      return strictlyNonBrandedRecommendations.map((rec: any) => {
        const realData = volumeData.get(rec.keyword);
        return {
          keyword: rec.keyword,
          search_volume: realData?.volume || 0, // REAL DataForSEO volume
          difficulty: rec.estimated_difficulty || 5,
          relevance_score: rec.relevance_score || 5,
          keyword_type: rec.keyword_type === 'brand' ? 'general' : rec.keyword_type || 'general',
          source: 'ai_recommendation', // But volume is real
          cpc: realData?.cpc || 0, // REAL DataForSEO CPC
          competition: realData?.competition || 0 // REAL DataForSEO competition
        };
      });

    } catch (error) {
      console.error('Error generating keyword recommendations:', error);
      return [];
    }
  }
}