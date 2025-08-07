interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private readonly CACHE_PREFIX = 'bh_cache_';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  
  // Store data in cache
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.DEFAULT_TTL;
    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };
    
    try {
      localStorage.setItem(
        this.CACHE_PREFIX + key,
        JSON.stringify(cacheItem)
      );
    } catch (e) {
      // Handle quota exceeded or other errors
      console.warn('Cache storage failed:', e);
      this.clearOldestEntries();
    }
  }
  
  // Get data from cache
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!item) return null;
      
      const cacheItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();
      
      // Check if expired
      if (now > cacheItem.expiresAt) {
        this.remove(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (e) {
      console.warn('Cache retrieval failed:', e);
      return null;
    }
  }
  
  // Get data with stale-while-revalidate pattern
  getStale<T>(key: string): { data: T | null; isStale: boolean } {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!item) return { data: null, isStale: false };
      
      const cacheItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();
      const isStale = now > cacheItem.expiresAt;
      
      return { data: cacheItem.data, isStale };
    } catch (e) {
      return { data: null, isStale: false };
    }
  }
  
  // Remove specific key
  remove(key: string): void {
    localStorage.removeItem(this.CACHE_PREFIX + key);
  }
  
  // Clear all cache entries
  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const cacheItem: CacheItem<any> = JSON.parse(item);
            if (now > cacheItem.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });
  }
  
  // Clear oldest entries when storage is full
  private clearOldestEntries(count: number = 5): void {
    const cacheEntries: Array<{ key: string; timestamp: number }> = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const cacheItem: CacheItem<any> = JSON.parse(item);
            cacheEntries.push({ key, timestamp: cacheItem.timestamp });
          }
        } catch (e) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });
    
    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries
    cacheEntries.slice(0, count).forEach(entry => {
      localStorage.removeItem(entry.key);
    });
  }
  
  // Generate cache key for listings
  getListingsKey(filters: any): string {
    // Create a deterministic key from filters
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          acc[key] = filters[key];
        }
        return acc;
      }, {} as any);
    
    return `listings_${JSON.stringify(sortedFilters)}`;
  }
}

export default new CacheService();