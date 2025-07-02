import { supabase } from '../lib/supabase';

export interface DuplicateGroup {
  normalized_name: string;
  duplicate_count: number;
  first_seen: string;
  last_seen: string;
  sources: string[];
  listing_ids: string[];
  price_variations: number[];
  min_price: number;
  max_price: number;
}

export interface SimilarListing {
  similar_id: string;
  similar_name: string;
  similar_source: string;
  similarity_score: number;
  price_difference: number | null;
}

export interface DuplicateDetectionOptions {
  similarityThreshold?: number;
  priceVariationThreshold?: number;
  includeSourceDuplicates?: boolean;
  autoMerge?: boolean;
}

class DuplicateDetectionService {
  /**
   * Get all duplicate groups in the database
   */
  async getDuplicateGroups(): Promise<DuplicateGroup[]> {
    console.log('🔍 [DUPLICATE] Fetching duplicate groups...');
    
    const { data, error } = await supabase
      .from('business_listing_duplicates')
      .select('*')
      .limit(100);

    if (error) {
      console.error('❌ [DUPLICATE] Error fetching duplicate groups:', error);
      throw error;
    }

    console.log(`📊 [DUPLICATE] Found ${data?.length || 0} duplicate groups`);
    return data || [];
  }

  /**
   * Find similar listings for a given listing
   */
  async findSimilarListings(
    listingId: string, 
    threshold: number = 0.8
  ): Promise<SimilarListing[]> {
    console.log(`🔍 [DUPLICATE] Finding similar listings for ${listingId} with threshold ${threshold}`);
    
    const { data, error } = await supabase
      .rpc('find_similar_listings', {
        listing_id: listingId,
        threshold: threshold
      });

    if (error) {
      console.error('❌ [DUPLICATE] Error finding similar listings:', error);
      throw error;
    }

    console.log(`📊 [DUPLICATE] Found ${data?.length || 0} similar listings`);
    return data || [];
  }

  /**
   * Merge duplicate listings into a primary listing
   */
  async mergeDuplicates(
    primaryId: string, 
    duplicateIds: string[]
  ): Promise<any> {
    console.log(`🔄 [DUPLICATE] Merging ${duplicateIds.length} duplicates into ${primaryId}`);
    
    const { data, error } = await supabase
      .rpc('merge_duplicate_listings', {
        primary_id: primaryId,
        duplicate_ids: duplicateIds
      });

    if (error) {
      console.error('❌ [DUPLICATE] Error merging duplicates:', error);
      throw error;
    }

    console.log('✅ [DUPLICATE] Merge successful:', data);
    return data;
  }

  /**
   * Check if a listing is likely a duplicate before inserting
   */
  async checkForDuplicates(
    name: string,
    source: string,
    askingPrice?: number,
    options: DuplicateDetectionOptions = {}
  ): Promise<{
    isDuplicate: boolean;
    duplicates: any[];
    confidence: number;
  }> {
    const {
      similarityThreshold = 0.85,
      priceVariationThreshold = 0.2,
      includeSourceDuplicates = false
    } = options;

    console.log(`🔍 [DUPLICATE] Checking for duplicates of "${name}" from ${source}`);

    // Normalize the name for comparison
    const { data: normalizedData } = await supabase
      .rpc('normalize_business_name', { name });
    
    const normalizedName = normalizedData;

    // Search for similar listings
    let query = supabase
      .from('business_listings')
      .select('*')
      .eq('status', 'active')
      .or(`normalized_name.eq.${normalizedName},name.ilike.%${name}%`);

    if (!includeSourceDuplicates) {
      query = query.neq('source', source);
    }

    const { data: potentialDuplicates, error } = await query;

    if (error) {
      console.error('❌ [DUPLICATE] Error checking duplicates:', error);
      return { isDuplicate: false, duplicates: [], confidence: 0 };
    }

    if (!potentialDuplicates || potentialDuplicates.length === 0) {
      console.log('✅ [DUPLICATE] No duplicates found');
      return { isDuplicate: false, duplicates: [], confidence: 0 };
    }

    // Calculate similarity scores
    const duplicatesWithScores = potentialDuplicates.map(listing => {
      let score = 0;
      let factors = 0;

      // Name similarity (using simple comparison for now)
      if (listing.normalized_name === normalizedName) {
        score += 1;
      } else if (listing.name.toLowerCase().includes(name.toLowerCase()) || 
                 name.toLowerCase().includes(listing.name.toLowerCase())) {
        score += 0.7;
      }
      factors++;

      // Price similarity
      if (askingPrice && listing.asking_price) {
        const priceDiff = Math.abs(askingPrice - listing.asking_price) / askingPrice;
        if (priceDiff <= priceVariationThreshold) {
          score += (1 - priceDiff);
          factors++;
        }
      }

      // Source penalty (same source is more likely duplicate)
      if (listing.source === source) {
        score += 0.3;
      }

      const confidence = factors > 0 ? score / factors : 0;

      return {
        ...listing,
        similarity_confidence: confidence
      };
    }).filter(listing => listing.similarity_confidence >= similarityThreshold);

    const isDuplicate = duplicatesWithScores.length > 0;
    const maxConfidence = Math.max(...duplicatesWithScores.map(d => d.similarity_confidence), 0);

    console.log(`📊 [DUPLICATE] Found ${duplicatesWithScores.length} potential duplicates with max confidence ${maxConfidence}`);

    return {
      isDuplicate,
      duplicates: duplicatesWithScores,
      confidence: maxConfidence
    };
  }

  /**
   * Auto-detect and group duplicates in the database
   */
  async autoDetectDuplicates(options: DuplicateDetectionOptions = {}): Promise<{
    grouped: number;
    total: number;
  }> {
    console.log('🤖 [DUPLICATE] Starting auto-detection of duplicates...');

    const duplicateGroups = await this.getDuplicateGroups();
    let grouped = 0;
    let total = 0;

    for (const group of duplicateGroups) {
      if (group.listing_ids.length > 1) {
        // Use the oldest listing as primary
        const [primaryId, ...duplicateIds] = group.listing_ids;
        
        if (options.autoMerge) {
          try {
            await this.mergeDuplicates(primaryId, duplicateIds);
            grouped++;
            total += duplicateIds.length;
          } catch (error) {
            console.error(`❌ [DUPLICATE] Failed to merge group ${group.normalized_name}:`, error);
          }
        }
      }
    }

    console.log(`✅ [DUPLICATE] Auto-detection complete: ${grouped} groups, ${total} duplicates processed`);
    return { grouped, total };
  }

  /**
   * Get statistics about duplicates in the system
   */
  async getDuplicateStats(): Promise<{
    totalDuplicates: number;
    duplicateGroups: number;
    duplicatesBySource: Record<string, number>;
    averagePriceVariation: number;
  }> {
    const groups = await this.getDuplicateGroups();
    
    const stats = {
      totalDuplicates: groups.reduce((sum, g) => sum + g.duplicate_count - 1, 0),
      duplicateGroups: groups.length,
      duplicatesBySource: {} as Record<string, number>,
      averagePriceVariation: 0
    };

    // Calculate source distribution
    groups.forEach(group => {
      group.sources.forEach(source => {
        stats.duplicatesBySource[source] = (stats.duplicatesBySource[source] || 0) + 1;
      });
    });

    // Calculate average price variation
    const priceVariations = groups
      .filter(g => g.min_price && g.max_price && g.max_price > g.min_price)
      .map(g => (g.max_price - g.min_price) / g.min_price);
    
    if (priceVariations.length > 0) {
      stats.averagePriceVariation = priceVariations.reduce((a, b) => a + b, 0) / priceVariations.length;
    }

    return stats;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();