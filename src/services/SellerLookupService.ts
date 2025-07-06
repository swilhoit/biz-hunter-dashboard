import { supabase } from '../lib/supabase';
import DataForSEOService from './DataForSEOService';
import RevenueEstimationService from './RevenueEstimationService';

interface SellerLookupJob {
  id: string;
  asin: string;
  category: string;
  est_rev: number;
  priority: 'high' | 'medium' | 'low';
}

interface SellerLookupResult {
  sellersFound: number;
  newSellers: number;
  duplicateSellers: number;
  totalCost: number;
  processingTime: number;
}

interface SellerMetrics {
  totalSellers: number;
  whales: number;
  withContacts: number;
  avgEstRevenue: number;
  topCategories: string[];
}

class SellerLookupService {
  private dataForSEO: DataForSEOService;
  private revenueEstimation: RevenueEstimationService;

  constructor() {
    this.dataForSEO = new DataForSEOService();
    this.revenueEstimation = new RevenueEstimationService();
  }

  // Main method to process seller lookup for top 20% ASINs
  async processTop20SellerLookup(options: {
    batchSize?: number;
    maxConcurrent?: number;
    priorityFilter?: 'high' | 'medium' | 'low';
  } = {}): Promise<SellerLookupResult> {
    const { batchSize = 100, maxConcurrent = 5, priorityFilter } = options;
    
    const startTime = Date.now();
    let totalSellersFound = 0;
    let totalNewSellers = 0;
    let totalDuplicateSellers = 0;
    let totalCost = 0;

    try {
      // Get top 20% ASINs that haven't been processed for seller lookup
      const jobs = await this.getUnprocessedASINs(batchSize, priorityFilter);
      
      if (jobs.length === 0) {
        console.log('No unprocessed ASINs found for seller lookup');
        return {
          sellersFound: 0,
          newSellers: 0,
          duplicateSellers: 0,
          totalCost: 0,
          processingTime: 0
        };
      }

      console.log(`Starting seller lookup for ${jobs.length} ASINs`);

      // Process jobs in batches with concurrency control
      const chunks = this.chunkArray(jobs, maxConcurrent);
      
      for (const chunk of chunks) {
        const promises = chunk.map(job => this.processSellerLookupJob(job));
        const results = await Promise.allSettled(promises);
        
        // Aggregate results
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            totalSellersFound += result.value.sellersFound;
            totalNewSellers += result.value.newSellers;
            totalDuplicateSellers += result.value.duplicateSellers;
            totalCost += result.value.cost;
          } else {
            console.error(`Failed to process ASIN ${chunk[index].asin}:`, result.reason);
          }
        });

        // Small delay between batches to avoid overwhelming the API
        await this.sleep(2000);
      }

      // Update seller metrics after processing
      await this.updateSellerMetrics();

      const processingTime = Date.now() - startTime;
      
      console.log(`Seller lookup completed: ${totalSellersFound} sellers found, ${totalNewSellers} new, cost: $${totalCost.toFixed(2)}`);

      return {
        sellersFound: totalSellersFound,
        newSellers: totalNewSellers,
        duplicateSellers: totalDuplicateSellers,
        totalCost,
        processingTime
      };

    } catch (error) {
      console.error('Error in processTop20SellerLookup:', error);
      throw error;
    }
  }

  // Get unprocessed ASINs for seller lookup
  private async getUnprocessedASINs(limit: number, priorityFilter?: string): Promise<SellerLookupJob[]> {
    let query = supabase
      .from('asins')
      .select('id, asin, category, est_rev')
      .eq('is_top_20_percent', true)
      .not('est_rev', 'is', null);

    // Filter out ASINs that already have seller lookups
    const { data: processedASINs } = await supabase
      .from('asin_sellers')
      .select('asin_id');

    const processedIds = processedASINs?.map(p => p.asin_id) || [];
    
    if (processedIds.length > 0) {
      query = query.not('id', 'in', processedIds);
    }

    // Apply priority filter based on revenue
    if (priorityFilter === 'high') {
      query = query.gte('est_rev', 50000); // $50k+ revenue
    } else if (priorityFilter === 'medium') {
      query = query.gte('est_rev', 10000).lt('est_rev', 50000); // $10k-$50k
    } else if (priorityFilter === 'low') {
      query = query.lt('est_rev', 10000); // <$10k
    }

    const { data: asins, error } = await query
      .order('est_rev', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch unprocessed ASINs: ${error.message}`);
    }

    return (asins || []).map(asin => ({
      id: asin.id,
      asin: asin.asin,
      category: asin.category,
      est_rev: asin.est_rev,
      priority: this.calculatePriority(asin.est_rev)
    }));
  }

  // Process individual seller lookup job
  private async processSellerLookupJob(job: SellerLookupJob): Promise<{
    sellersFound: number;
    newSellers: number;
    duplicateSellers: number;
    cost: number;
  }> {
    try {
      const beforeCount = await this.getSellerCount();
      
      // Use DataForSEO service to lookup sellers for this ASIN
      await this.dataForSEO.lookupSellersForASIN(job.asin);
      
      const afterCount = await this.getSellerCount();
      const newSellers = afterCount - beforeCount;
      
      // Get the number of sellers found for this ASIN
      const { data: asinSellers } = await supabase
        .from('asin_sellers')
        .select('seller_id')
        .eq('asin_id', job.id);

      const sellersFound = asinSellers?.length || 0;
      const duplicateSellers = sellersFound - newSellers;

      // Estimate cost (DataForSEO seller lookup is $0.001 per ASIN)
      const cost = 0.001;

      return {
        sellersFound,
        newSellers,
        duplicateSellers,
        cost
      };

    } catch (error) {
      console.error(`Error processing seller lookup for ASIN ${job.asin}:`, error);
      return {
        sellersFound: 0,
        newSellers: 0,
        duplicateSellers: 0,
        cost: 0
      };
    }
  }

  // Calculate priority based on estimated revenue
  private calculatePriority(estRev: number): 'high' | 'medium' | 'low' {
    if (estRev >= 50000) return 'high';
    if (estRev >= 10000) return 'medium';
    return 'low';
  }

  // Get current seller count
  private async getSellerCount(): Promise<number> {
    const { count, error } = await supabase
      .from('sellers')
      .select('id', { count: 'exact' });

    if (error) {
      throw new Error(`Failed to get seller count: ${error.message}`);
    }

    return count || 0;
  }

  // Update seller metrics after processing
  private async updateSellerMetrics(): Promise<void> {
    try {
      // Update total estimated revenue and listings count for all sellers
      await supabase.rpc('identify_whale_sellers');
      
      console.log('Seller metrics updated successfully');
    } catch (error) {
      console.error('Error updating seller metrics:', error);
    }
  }

  // Get seller metrics summary
  async getSellerMetrics(): Promise<SellerMetrics> {
    const { data: sellerData, error } = await supabase
      .from('seller_metrics')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch seller metrics: ${error.message}`);
    }

    const totalSellers = sellerData?.length || 0;
    const whales = sellerData?.filter(s => s.is_whale).length || 0;
    const withContacts = sellerData?.filter(s => s.total_contacts > 0).length || 0;
    const avgEstRevenue = sellerData?.reduce((sum, s) => sum + (s.total_est_revenue || 0), 0) / totalSellers || 0;

    // Get top categories by seller count
    const categoryCount: { [key: string]: number } = {};
    
    const { data: categoryData } = await supabase
      .from('asins')
      .select('category, asin_sellers(seller_id)')
      .not('category', 'is', null);

    categoryData?.forEach(item => {
      if (item.asin_sellers && item.asin_sellers.length > 0) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + item.asin_sellers.length;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      totalSellers,
      whales,
      withContacts,
      avgEstRevenue,
      topCategories
    };
  }

  // Get sellers ready for storefront parsing
  async getSellersForStorefrontParsing(limit: number = 100): Promise<Array<{
    id: string;
    seller_url: string;
    total_est_revenue: number;
    listings_count: number;
  }>> {
    const { data: sellers, error } = await supabase
      .from('sellers')
      .select('id, seller_url, total_est_revenue, listings_count')
      .eq('storefront_parsed', false)
      .order('total_est_revenue', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch sellers for storefront parsing: ${error.message}`);
    }

    return sellers || [];
  }

  // Get whale sellers for deep contact enrichment
  async getWhaleSellers(limit: number = 50): Promise<Array<{
    id: string;
    seller_name: string;
    seller_url: string;
    total_est_revenue: number;
    listings_count: number;
    email_contacts: number;
    phone_contacts: number;
  }>> {
    const { data: whales, error } = await supabase
      .from('seller_metrics')
      .select('*')
      .eq('is_whale', true)
      .order('total_est_revenue', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch whale sellers: ${error.message}`);
    }

    return whales || [];
  }

  // Get processing statistics
  async getProcessingStats(): Promise<{
    totalASINs: number;
    top20ASINs: number;
    processedASINs: number;
    unprocessedASINs: number;
    totalSellers: number;
    avgSellersPerASIN: number;
    processingProgress: number;
  }> {
    const { data: asinStats } = await supabase
      .from('asins')
      .select('id, is_top_20_percent');

    const totalASINs = asinStats?.length || 0;
    const top20ASINs = asinStats?.filter(a => a.is_top_20_percent).length || 0;

    const { data: processedASINs } = await supabase
      .from('asin_sellers')
      .select('asin_id');

    const processedCount = new Set(processedASINs?.map(p => p.asin_id) || []).size;
    const unprocessedASINs = top20ASINs - processedCount;

    const { count: totalSellers } = await supabase
      .from('sellers')
      .select('id', { count: 'exact' });

    const avgSellersPerASIN = processedCount > 0 ? (totalSellers || 0) / processedCount : 0;
    const processingProgress = top20ASINs > 0 ? (processedCount / top20ASINs) * 100 : 0;

    return {
      totalASINs,
      top20ASINs,
      processedASINs: processedCount,
      unprocessedASINs,
      totalSellers: totalSellers || 0,
      avgSellersPerASIN,
      processingProgress
    };
  }

  // Utility method to chunk array
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Utility method to sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Full pipeline for seller lookup
  async executeSellerLookupPipeline(options: {
    maxASINs?: number;
    batchSize?: number;
    includeStorefrontParsing?: boolean;
  } = {}): Promise<{
    sellerLookupResult: SellerLookupResult;
    storefrontParsingResult?: any;
    finalMetrics: SellerMetrics;
  }> {
    const { maxASINs = 1000, batchSize = 100, includeStorefrontParsing = false } = options;

    console.log('Starting seller lookup pipeline...');

    try {
      // Step 1: Process seller lookup for top 20% ASINs
      const sellerLookupResult = await this.processTop20SellerLookup({
        batchSize: Math.min(batchSize, maxASINs)
      });

      let storefrontParsingResult;
      
      // Step 2: Optionally process storefront parsing for new sellers
      if (includeStorefrontParsing && sellerLookupResult.newSellers > 0) {
        console.log('Starting storefront parsing for new sellers...');
        
        const sellersToProcess = await this.getSellersForStorefrontParsing(
          Math.min(sellerLookupResult.newSellers, 50)
        );

        storefrontParsingResult = await this.dataForSEO.processBatchStorefrontParsing(
          sellersToProcess.length
        );
      }

      // Step 3: Get final metrics
      const finalMetrics = await this.getSellerMetrics();

      console.log('Seller lookup pipeline completed successfully!');

      return {
        sellerLookupResult,
        storefrontParsingResult,
        finalMetrics
      };

    } catch (error) {
      console.error('Seller lookup pipeline failed:', error);
      throw error;
    }
  }
}

export default SellerLookupService;