import { supabase } from '../lib/supabase';

interface ASINData {
  id: string;
  asin: string;
  category: string;
  price: number;
  bsr: number;
  est_units?: number;
  est_rev?: number;
  is_top_20_percent?: boolean;
}

interface CategoryStats {
  category: string;
  total_asins: number;
  avg_revenue: number;
  top_20_threshold: number;
  top_20_count: number;
}

class RevenueEstimationService {
  
  // Core revenue estimation formula: est_units = 64700 * (bsr ** -0.87)
  private estimateUnitsFromBSR(bsr: number): number {
    if (!bsr || bsr <= 0) return 0;
    return Math.round(64700 * Math.pow(bsr, -0.87));
  }

  // Calculate estimated revenue: price * estimated units
  private calculateEstimatedRevenue(price: number, estimatedUnits: number): number {
    if (!price || !estimatedUnits) return 0;
    return price * estimatedUnits;
  }

  // Update estimates for all ASINs
  async updateAllEstimates(): Promise<void> {
    try {
      // Get all ASINs that need estimate updates
      const { data: asins, error: fetchError } = await supabase
        .from('asins')
        .select('id, asin, category, price, bsr')
        .not('price', 'is', null)
        .not('bsr', 'is', null);

      if (fetchError) {
        throw new Error(`Failed to fetch ASINs: ${fetchError.message}`);
      }

      if (!asins || asins.length === 0) {
        console.log('No ASINs found to update estimates');
        return;
      }

      // Process ASINs in batches to avoid overwhelming the database
      const batchSize = 1000;
      for (let i = 0; i < asins.length; i += batchSize) {
        const batch = asins.slice(i, i + batchSize);
        await this.processBatchEstimates(batch);
      }

      console.log(`Updated estimates for ${asins.length} ASINs`);
    } catch (error) {
      console.error('Error updating estimates:', error);
      throw error;
    }
  }

  // Process a batch of ASINs for estimate updates
  private async processBatchEstimates(asins: ASINData[]): Promise<void> {
    const updates = asins.map(asin => {
      const estUnits = this.estimateUnitsFromBSR(asin.bsr);
      const estRev = this.calculateEstimatedRevenue(asin.price, estUnits);
      
      return {
        id: asin.id,
        est_units: estUnits,
        est_rev: estRev,
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase
      .from('asins')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to update batch estimates: ${error.message}`);
    }
  }

  // Calculate top 20% threshold for each category
  async calculateTop20Percentile(): Promise<CategoryStats[]> {
    try {
      const { data: categories, error } = await supabase
        .from('asins')
        .select('category')
        .not('category', 'is', null)
        .not('est_rev', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];
      const categoryStats: CategoryStats[] = [];

      for (const category of uniqueCategories) {
        const stats = await this.calculateCategoryStats(category);
        categoryStats.push(stats);
      }

      return categoryStats;
    } catch (error) {
      console.error('Error calculating top 20% percentile:', error);
      throw error;
    }
  }

  // Calculate statistics for a specific category
  private async calculateCategoryStats(category: string): Promise<CategoryStats> {
    // Get all ASINs for this category, ordered by revenue descending
    const { data: asins, error } = await supabase
      .from('asins')
      .select('id, asin, est_rev')
      .eq('category', category)
      .not('est_rev', 'is', null)
      .order('est_rev', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ASINs for category ${category}: ${error.message}`);
    }

    const totalAsins = asins?.length || 0;
    const top20Count = Math.ceil(totalAsins * 0.2);
    const top20Asins = asins?.slice(0, top20Count) || [];
    
    const avgRevenue = asins?.reduce((sum, asin) => sum + (asin.est_rev || 0), 0) / totalAsins || 0;
    const top20Threshold = top20Asins.length > 0 ? top20Asins[top20Asins.length - 1].est_rev : 0;

    return {
      category,
      total_asins: totalAsins,
      avg_revenue: avgRevenue,
      top_20_threshold: top20Threshold,
      top_20_count: top20Count
    };
  }

  // Mark top 20% ASINs for each category
  async markTop20Percent(): Promise<void> {
    try {
      // First, reset all top 20% flags
      await supabase
        .from('asins')
        .update({ is_top_20_percent: false })
        .not('id', 'is', null);

      // Get unique categories
      const { data: categories, error: categoryError } = await supabase
        .from('asins')
        .select('category')
        .not('category', 'is', null)
        .not('est_rev', 'is', null);

      if (categoryError) {
        throw new Error(`Failed to fetch categories: ${categoryError.message}`);
      }

      const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

      // Process each category
      for (const category of uniqueCategories) {
        await this.markTop20ForCategory(category);
      }

      // Refresh the materialized view
      await supabase.rpc('refresh_top20_asins');

      console.log(`Marked top 20% ASINs for ${uniqueCategories.length} categories`);
    } catch (error) {
      console.error('Error marking top 20% ASINs:', error);
      throw error;
    }
  }

  // Mark top 20% ASINs for a specific category
  private async markTop20ForCategory(category: string): Promise<void> {
    // Get ASINs for this category ordered by revenue
    const { data: asins, error } = await supabase
      .from('asins')
      .select('id, est_rev')
      .eq('category', category)
      .not('est_rev', 'is', null)
      .order('est_rev', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ASINs for category ${category}: ${error.message}`);
    }

    if (!asins || asins.length === 0) return;

    // Calculate top 20%
    const top20Count = Math.ceil(asins.length * 0.2);
    const top20Ids = asins.slice(0, top20Count).map(asin => asin.id);

    // Update top 20% ASINs
    if (top20Ids.length > 0) {
      const { error: updateError } = await supabase
        .from('asins')
        .update({ is_top_20_percent: true })
        .in('id', top20Ids);

      if (updateError) {
        throw new Error(`Failed to update top 20% ASINs for category ${category}: ${updateError.message}`);
      }
    }
  }

  // Get top 20% ASINs for seller lookup
  async getTop20ASINsForProcessing(limit: number = 1000): Promise<ASINData[]> {
    const { data: asins, error } = await supabase
      .from('asins')
      .select('id, asin, category, price, bsr, est_units, est_rev, is_top_20_percent')
      .eq('is_top_20_percent', true)
      .order('est_rev', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch top 20% ASINs: ${error.message}`);
    }

    return asins || [];
  }

  // Get category performance summary
  async getCategoryPerformanceSummary(): Promise<CategoryStats[]> {
    const categoryStats = await this.calculateTop20Percentile();
    return categoryStats.sort((a, b) => b.avg_revenue - a.avg_revenue);
  }

  // Update estimates for ASINs that need BSR refresh
  async updateStaleEstimates(): Promise<void> {
    try {
      const { data: staleAsins, error } = await supabase
        .from('asins')
        .select('id, asin, category, price, bsr')
        .lte('next_bsr_refresh', new Date().toISOString())
        .not('price', 'is', null)
        .not('bsr', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch stale ASINs: ${error.message}`);
      }

      if (!staleAsins || staleAsins.length === 0) {
        console.log('No stale ASINs found');
        return;
      }

      // Process in batches
      const batchSize = 500;
      for (let i = 0; i < staleAsins.length; i += batchSize) {
        const batch = staleAsins.slice(i, i + batchSize);
        await this.processBatchEstimates(batch);
        
        // Update refresh timestamps
        const batchIds = batch.map(asin => asin.id);
        await supabase
          .from('asins')
          .update({ 
            next_bsr_refresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
          })
          .in('id', batchIds);
      }

      console.log(`Updated estimates for ${staleAsins.length} stale ASINs`);
    } catch (error) {
      console.error('Error updating stale estimates:', error);
      throw error;
    }
  }

  // Get revenue distribution statistics
  async getRevenueDistribution(): Promise<any> {
    const { data, error } = await supabase
      .from('asins')
      .select('category, est_rev')
      .not('est_rev', 'is', null)
      .order('est_rev', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch revenue distribution: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { total_asins: 0, categories: [] };
    }

    // Calculate percentiles
    const revenues = data.map(asin => asin.est_rev).sort((a, b) => b - a);
    const percentiles = {
      p90: this.getPercentile(revenues, 0.9),
      p75: this.getPercentile(revenues, 0.75),
      p50: this.getPercentile(revenues, 0.5),
      p25: this.getPercentile(revenues, 0.25),
      p10: this.getPercentile(revenues, 0.1)
    };

    // Group by category
    const categoryData = data.reduce((acc: any, asin) => {
      if (!acc[asin.category]) {
        acc[asin.category] = [];
      }
      acc[asin.category].push(asin.est_rev);
      return acc;
    }, {});

    const categories = Object.keys(categoryData).map(category => ({
      category,
      count: categoryData[category].length,
      avg_revenue: categoryData[category].reduce((sum: number, rev: number) => sum + rev, 0) / categoryData[category].length,
      max_revenue: Math.max(...categoryData[category]),
      min_revenue: Math.min(...categoryData[category])
    }));

    return {
      total_asins: data.length,
      percentiles,
      categories: categories.sort((a, b) => b.avg_revenue - a.avg_revenue)
    };
  }

  // Helper method to calculate percentile
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[index] || 0;
  }

  // Full pipeline execution
  async executeFullPipeline(): Promise<void> {
    console.log('Starting full revenue estimation pipeline...');
    
    try {
      // Step 1: Update all estimates
      console.log('Step 1: Updating all estimates...');
      await this.updateAllEstimates();
      
      // Step 2: Mark top 20% ASINs
      console.log('Step 2: Marking top 20% ASINs...');
      await this.markTop20Percent();
      
      // Step 3: Get summary
      console.log('Step 3: Generating summary...');
      const summary = await this.getCategoryPerformanceSummary();
      
      console.log('Pipeline completed successfully!');
      console.log(`Processed ${summary.reduce((sum, cat) => sum + cat.total_asins, 0)} ASINs across ${summary.length} categories`);
      
      return;
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      throw error;
    }
  }
}

export default RevenueEstimationService;