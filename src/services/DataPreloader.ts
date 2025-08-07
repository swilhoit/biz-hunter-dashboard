import BigQueryService from './BigQueryService';
import CacheService from './CacheService';

class DataPreloader {
  private preloadPromise: Promise<void> | null = null;
  
  // Preload common data patterns
  async preloadEssentialData(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise;
    }
    
    this.preloadPromise = this.doPreload();
    return this.preloadPromise;
  }
  
  private async doPreload(): Promise<void> {
    try {
      // Clear expired cache entries first
      CacheService.clearExpired();
      
      const preloadTasks = [];
      
      // Only preload the initial visible content
      // Homepage listings (just 10 items)
      preloadTasks.push(
        BigQueryService.getListings({
          limit: 10,
          sortBy: 'created_at',
          sortDirection: 'desc'
        }, true).catch(err => {
          console.warn('Failed to preload homepage listings:', err);
        })
      );
      
      // First page of main feed (just what's visible)
      preloadTasks.push(
        BigQueryService.getListings({
          limit: 50, // Reduced from 100
          offset: 0,
          sortBy: 'created_at',
          sortDirection: 'desc'
        }, true).catch(err => {
          console.warn('Failed to preload main feed:', err);
        })
      );
      
      // Wait for all preloads to complete
      await Promise.all(preloadTasks);
      
      console.log('Initial data preloading completed');
    } catch (error) {
      console.warn('Preloading failed:', error);
    } finally {
      this.preloadPromise = null;
    }
  }
  
  // Prefetch a specific listing
  async prefetchListing(id: string): Promise<void> {
    try {
      await BigQueryService.getListingById(id, true);
    } catch (error) {
      console.warn(`Failed to prefetch listing ${id}:`, error);
    }
  }
  
  // Prefetch next page of results
  async prefetchNextPage(currentFilters: any, currentOffset: number): Promise<void> {
    try {
      await BigQueryService.getListings({
        ...currentFilters,
        offset: currentOffset + 100,
        limit: 100
      }, true);
    } catch (error) {
      console.warn('Failed to prefetch next page:', error);
    }
  }
}

export default new DataPreloader();