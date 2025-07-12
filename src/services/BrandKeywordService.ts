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
    onProgress?: ProgressCallback
  ): Promise<boolean> {
    return this.trackKeywordRankingsInternal(brandName, keywords, onProgress);
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
    onProgress?: ProgressCallback
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
      onProgress?.('Submitting Tasks', 20, 100, `Found ${keywordsToTrack.length} keywords to track`);

      const credentials = btoa(`${username}:${password}`);
      
      // Submit ALL tasks in parallel (DataForSEO can handle up to 100 tasks)
      const maxBatchSize = 100;
      const allTaskPromises: Promise<any>[] = [];
      
      onProgress?.('Submitting Tasks', 25, 100, 'Creating task batches...');
      
      for (let i = 0; i < keywordsToTrack.length; i += maxBatchSize) {
        const batch = keywordsToTrack.slice(i, i + maxBatchSize);
        
        // Create Amazon SERP API requests for this batch
        const serpRequests = batch.map(kw => ({
          keyword: kw.keyword,
          location_code: 2840, // United States
          language_code: "en_US", // Amazon merchant API requires full locale
          depth: 100, // Track top 100 Amazon results
          tag: `parallel-${brandName}-${Date.now()}-${kw.keyword.replace(/\s+/g, '-').substring(0, 20)}`
        }));

        // Submit this batch in parallel
        const batchPromise = this.submitSerpBatch(serpRequests, batch, brandName, credentials);
        allTaskPromises.push(batchPromise);
      }

      // Wait for all task submissions to complete
      console.log(`[BrandKeywords] Submitting ${allTaskPromises.length} parallel batches`);
      onProgress?.('Submitting Tasks', 30, 100, `Submitting ${allTaskPromises.length} task batches to DataForSEO...`);
      
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
      }

      if (allTasks.length === 0) {
        console.error('[BrandKeywords] No SERP tasks were successfully submitted');
        onProgress?.('Error', 0, 100, 'Failed to submit any SERP tasks');
        return false;
      }

      console.log(`[BrandKeywords] Successfully submitted ${allTasks.length} SERP tasks. Starting parallel processing...`);
      onProgress?.('Processing Tasks', 40, 100, `Successfully submitted ${allTasks.length} tasks. Waiting for results...`);

      // Process all tasks in parallel with optimized polling
      await this.processAllSerpTasksInParallelWithProgress(allTasks, brandName, credentials, onProgress);

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
  private static detectBrandMatch(brandName: string, title: string, url?: string): {
    isBrandResult: boolean;
    matchScore: number;
    matchReason: string;
  } {
    const brandLower = brandName.toLowerCase();
    const titleLower = title.toLowerCase();
    const urlLower = url?.toLowerCase() || '';
    
    let score = 0;
    const reasons: string[] = [];
    
    // Direct brand name match in title (highest confidence)
    if (titleLower.includes(brandLower)) {
      score += 0.8;
      reasons.push('brand_name_in_title');
    }
    
    // Brand name as first word in title (very high confidence)
    if (titleLower.startsWith(brandLower + ' ') || titleLower.startsWith(brandLower + '-')) {
      score += 0.9;
      reasons.push('brand_name_starts_title');
    }
    
    // Brand name in URL (medium confidence)
    if (urlLower.includes(brandLower)) {
      score += 0.3;
      reasons.push('brand_name_in_url');
    }
    
    // Brand variations (handle common cases)
    const brandWords = brandLower.split(' ');
    if (brandWords.length > 1) {
      const allWordsInTitle = brandWords.every(word => titleLower.includes(word));
      if (allWordsInTitle) {
        score += 0.6;
        reasons.push('brand_words_in_title');
      }
    }
    
    // Handle common brand patterns (e.g., "by [Brand]", "[Brand] Official")
    const brandPatterns = [
      `by ${brandLower}`,
      `${brandLower} official`,
      `${brandLower} store`,
      `${brandLower}®`,
      `${brandLower}™`
    ];
    
    for (const pattern of brandPatterns) {
      if (titleLower.includes(pattern)) {
        score += 0.7;
        reasons.push('brand_pattern_match');
        break;
      }
    }
    
    // Cap score at 1.0
    score = Math.min(score, 1.0);
    
    // Consider it a brand result if score is above threshold
    const isBrandResult = score >= 0.5;
    
    return {
      isBrandResult,
      matchScore: Math.round(score * 100) / 100, // Round to 2 decimal places
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
    onProgress?.('Processing Tasks', 45, 100, `Starting parallel processing of ${allTasks.length} tasks...`);
    
    const maxWaitTime = 180000; // 3 minutes max (longer for more tasks)
    const pollInterval = 5000; // Check every 5 seconds (more frequent)
    const startTime = Date.now();
    
    let completedTasks = new Set<string>();
    const processingPromises = new Map<string, Promise<void>>();
    
    while (completedTasks.size < allTasks.length && (Date.now() - startTime) < maxWaitTime) {
      try {
        // Check which tasks are ready
        console.log(`[BrandKeywords] Polling for ready tasks... (${completedTasks.size}/${allTasks.length} completed)`);
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
            
            // Process newly completed tasks in parallel
            console.log(`[BrandKeywords] Ready task IDs:`, readyTaskIds.slice(0, 5), '...');
            console.log(`[BrandKeywords] Our task IDs:`, allTasks.slice(0, 5).map(t => t.taskId), '...');
            
            const newlyReady = allTasks.filter(task => 
              readyTaskIds.includes(task.taskId) && 
              !completedTasks.has(task.taskId) &&
              !processingPromises.has(task.taskId)
            );
            
            console.log(`[BrandKeywords] Found ${newlyReady.length} newly ready tasks to process`);
            
            // Start processing all newly ready tasks in parallel
            for (const task of newlyReady) {
              const processingPromise = this.processSingleSerpResult(
                task.taskId, 
                task.keyword, 
                brandName, 
                credentials
              ).then(() => {
                completedTasks.add(task.taskId);
                processingPromises.delete(task.taskId);
                console.log(`[BrandKeywords] Completed ${completedTasks.size}/${allTasks.length} tasks`);
                
                // Update progress as tasks complete
                const progressPercent = 45 + Math.round((completedTasks.size / allTasks.length) * 45); // 45-90%
                onProgress?.('Processing Tasks', progressPercent, 100, 
                  `Processed ${completedTasks.size}/${allTasks.length} keywords (${processingPromises.size} in progress)`);
              }).catch((error) => {
                console.error(`[BrandKeywords] Error processing task ${task.taskId}:`, error);
                processingPromises.delete(task.taskId);
                // Still mark as completed to avoid infinite loop
                completedTasks.add(task.taskId);
                
                // Update progress even for failed tasks
                const progressPercent = 45 + Math.round((completedTasks.size / allTasks.length) * 45);
                onProgress?.('Processing Tasks', progressPercent, 100, 
                  `Processed ${completedTasks.size}/${allTasks.length} keywords (${processingPromises.size} in progress, 1 failed)`);
              });
              
              processingPromises.set(task.taskId, processingPromise);
            }
            
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
      
      // Wait before next poll if not all tasks are complete
      if (completedTasks.size < allTasks.length) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
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
        `Completed ${finalCompletedCount}/${totalTasks} tasks (${completionPercent}%)`);
    } else {
      console.log(`[BrandKeywords] Successfully completed all ${totalTasks} SERP tasks in parallel in ${Math.round(elapsedTime/1000)}s! 🚀`);
      onProgress?.('Tasks Complete', 90, 100, `Successfully processed all ${totalTasks} keywords! 🚀`);
    }
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

      if (result.status_code === 20000 && result.tasks?.[0]?.result?.[0]?.items) {
        const items = result.tasks[0].result[0].items;
        
        // Process Amazon search results (merchant API returns all as Amazon products)
        const organicResults = items.filter((item: any) => 
          item.type === 'amazon_product' && item.data_asin
        );

        console.log(`[BrandKeywords] Found ${organicResults.length} organic results for keyword: ${keyword.keyword}`);

        // Prepare batch data for rankings
        const rankingsBatch: Partial<KeywordRanking>[] = [];
        const brandMatches: string[] = [];
        
        for (const amazonResult of organicResults) {
          // Detect if this result belongs to the tracked brand
          const brandMatch = this.detectBrandMatch(
            brandName, 
            amazonResult.title || '', 
            amazonResult.url
          );

          const ranking: Partial<KeywordRanking> = {
            brand_keyword_id: keyword.id!,
            asin: amazonResult.data_asin, // ASIN from merchant API
            position: amazonResult.rank_absolute || amazonResult.position_absolute,
            page: Math.ceil((amazonResult.rank_absolute || amazonResult.position_absolute) / 16), // Amazon shows 16 results per page
            url: amazonResult.url,
            title: amazonResult.title,
            domain: 'amazon.com',
            location_code: 2840,
            language_code: 'en_US',
            check_date: new Date().toISOString(),
            is_brand_result: brandMatch.isBrandResult,
            brand_match_score: brandMatch.matchScore,
            brand_match_reason: brandMatch.matchReason
          };

          rankingsBatch.push(ranking);
          
          // Track brand matches for logging
          if (brandMatch.isBrandResult) {
            brandMatches.push(`"${keyword.keyword}": ${amazonResult.title} (score: ${brandMatch.matchScore})`);
          }
        }

        // Batch insert rankings (much faster than individual inserts)
        if (rankingsBatch.length > 0) {
          const { error } = await supabase.from('keyword_rankings').insert(rankingsBatch);
          if (error) {
            console.error(`[BrandKeywords] Error batch saving rankings for ${keyword.keyword}:`, error);
          } else {
            console.log(`[BrandKeywords] Saved ${rankingsBatch.length} rankings for keyword: ${keyword.keyword}`);
          }
        }

        // Log brand matches
        if (brandMatches.length > 0) {
          console.log(`[BrandKeywords] Brand matches found: ${brandMatches.join(', ')}`);
        }

        // Prepare batch data for SERP features (sponsored products, etc)
        const serpFeatures = items.filter((item: any) => item.type !== 'amazon_product');
        const featuresBatch: Partial<SerpFeature>[] = [];

        for (const feature of serpFeatures) {
          const serpFeature: Partial<SerpFeature> = {
            brand_keyword_id: keyword.id!,
            feature_type: feature.type, // 'amazon_sponsored', 'amazon_paid', etc.
            position: feature.rank_absolute || feature.position_absolute,
            title: feature.title,
            url: feature.url,
            description: feature.description,
            additional_data: {
              asin: feature.data_asin,
              price: feature.price?.value,
              currency: feature.price?.currency,
              rating: feature.rating?.value,
              reviews_count: feature.rating?.count,
              is_prime: feature.is_prime,
              delivery_info: feature.delivery_info,
              bestseller_badge: feature.bestseller_label,
              amazon_choice: feature.amazon_choice_label
            },
            check_date: new Date().toISOString()
          };

          featuresBatch.push(serpFeature);
        }

        // Batch insert SERP features
        if (featuresBatch.length > 0) {
          const { error } = await supabase.from('keyword_serp_features').insert(featuresBatch);
          if (error) {
            console.error(`[BrandKeywords] Error batch saving SERP features:`, error);
          }
        }

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
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return volumeData;
    } catch (error) {
      console.error('Error getting keyword volume data:', error);
      return new Map();
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

      const prompt = `You are an Amazon keyword researcher. Generate generic product keywords that customers would search for when they DON'T know about specific brands yet.

Products/Category: ${products.join(', ')}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

🚫 DO NOT INCLUDE THE BRAND NAME: "${brandName}"
- Do not use "${brandName}" in any keyword
- Do not use variations like "${brandName.replace(/\s+/g, '')}" or "${brandName.replace(/\s+/g, '-')}"

✅ GENERATE GENERIC KEYWORDS:
- Product categories (e.g., "scented candles", "soy candles")
- Feature-based terms (e.g., "natural wax candles", "long lasting candles")
- Problem-solving keywords (e.g., "strong scented candles", "clean burning candles")
- Use-case keywords (e.g., "aromatherapy candles", "relaxation candles")

EXAMPLES OF GOOD KEYWORDS:
- "scented candles"
- "soy wax candles"
- "aromatherapy candles" 
- "natural candles"
- "cotton wick candles"
- "home fragrance"
- "essential oil candles"
- "vanilla scented candles"
- "long burning candles"

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