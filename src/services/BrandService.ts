import { supabase } from '../lib/supabase';

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  amazon_store_url?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  business_type?: string;
  founded_year?: number;
  headquarters_location?: string;
  employee_count?: string;
  total_asins: number;
  active_asins: number;
  total_reviews: number;
  avg_rating?: number;
  created_at: string;
  updated_at: string;
  data_source?: string;
  last_sync_at?: string;
}

export interface BrandMetrics {
  total_revenue: number;
  total_profit: number;
  avg_margin: number;
  total_units: number;
  growth_rate: number;
  market_share?: number;
}

export class BrandService {
  /**
   * Get or create a brand by name
   */
  static async getOrCreateBrand(brandName: string): Promise<Brand> {
    // First try to get existing brand
    const { data: existingBrand, error: fetchError } = await supabase
      .from('brands')
      .select('*')
      .eq('name', brandName)
      .single();

    if (existingBrand && !fetchError) {
      return existingBrand;
    }

    // Create new brand
    const { data: newBrand, error: createError } = await supabase
      .from('brands')
      .insert({
        name: brandName
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create brand: ${createError.message}`);
    }

    return newBrand;
  }

  /**
   * Get brand by ID
   */
  static async getBrandById(brandId: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) {
      console.error('Error fetching brand:', error);
      return null;
    }

    return data;
  }

  /**
   * Update brand information
   */
  static async updateBrand(brandId: string, updates: Partial<Brand>): Promise<Brand> {
    const { data, error } = await supabase
      .from('brands')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update brand: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all ASINs for a brand
   */
  static async getBrandASINs(brandId: string) {
    const { data, error } = await supabase
      .from('asins')
      .select('*')
      .eq('brand_id', brandId)
      .order('monthly_revenue', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch brand ASINs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get brand metrics
   */
  static async getBrandMetrics(brandId: string): Promise<BrandMetrics> {
    const asins = await this.getBrandASINs(brandId);

    const metrics = asins.reduce((acc, asin) => {
      acc.total_revenue += asin.monthly_revenue || 0;
      acc.total_units += asin.monthly_units || 0;
      // Calculate other metrics as needed
      return acc;
    }, {
      total_revenue: 0,
      total_profit: 0,
      avg_margin: 0,
      total_units: 0,
      growth_rate: 0
    });

    // Calculate profit and margin based on some assumptions
    // This would need to be adjusted based on your actual data
    metrics.total_profit = metrics.total_revenue * 0.15; // Assume 15% margin
    metrics.avg_margin = 15;

    return metrics;
  }

  /**
   * Get all deals for a brand
   */
  static async getBrandDeals(brandId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch brand deals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search brands by name
   */
  static async searchBrands(query: string) {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) {
      throw new Error(`Failed to search brands: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Sync brand metrics from ASINs
   */
  static async syncBrandMetrics(brandId: string) {
    const asins = await this.getBrandASINs(brandId);
    
    const totalAsins = asins.length;
    const activeAsins = asins.filter(a => a.is_active).length;
    const totalReviews = asins.reduce((sum, a) => sum + (a.review_count || 0), 0);
    const avgRating = asins.length > 0
      ? asins.reduce((sum, a) => sum + (a.review_rating || 0), 0) / asins.length
      : 0;

    return this.updateBrand(brandId, {
      total_asins: totalAsins,
      active_asins: activeAsins,
      total_reviews: totalReviews,
      avg_rating: Number(avgRating.toFixed(2))
    });
  }
}