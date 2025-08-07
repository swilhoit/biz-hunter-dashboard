import { useState, useEffect, useCallback, useRef } from 'react';
import BigQueryService, { BusinessListing, ListingsFilter } from '../services/BigQueryService';
import CacheService from '../services/CacheService';

interface UseCachedListingsResult {
  listings: BusinessListing[];
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: (forceRefresh?: boolean) => void;
  isStale: boolean;
}

export function useCachedListings(filters?: ListingsFilter): UseCachedListingsResult {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isStale, setIsStale] = useState(false);
  const [currentLimit] = useState(100);
  const isRevalidating = useRef(false);

  // Fetch listings with stale-while-revalidate pattern
  const fetchListings = useCallback(async (reset = false, forceRefresh = false) => {
    try {
      const offset = reset ? 0 : currentOffset;
      const cacheKey = CacheService.getListingsKey({
        ...filters,
        limit: currentLimit,
        offset: offset
      });
      
      // Try to get stale data immediately
      if (!forceRefresh && reset) {
        const { data: staleData, isStale: stale } = CacheService.getStale<{ listings: BusinessListing[]; total: number }>(cacheKey);
        
        if (staleData) {
          // Show stale data immediately
          setListings(staleData.listings || []);
          setTotalCount(staleData.total || 0);
          setLoading(false);
          setIsStale(stale);
          
          // If data is stale, revalidate in background
          if (stale && !isRevalidating.current) {
            isRevalidating.current = true;
            // Don't await - let it run in background
            BigQueryService.getListings({
              ...filters,
              limit: currentLimit,
              offset: offset
            }, true).then(response => {
              setListings(response.listings || []);
              setTotalCount(response.total || 0);
              setIsStale(false);
              isRevalidating.current = false;
            }).catch(() => {
              isRevalidating.current = false;
            });
            return;
          }
          
          if (!stale) {
            // Data is fresh, no need to revalidate
            return;
          }
        }
      }
      
      // If no cache or force refresh, load normally
      if (reset) {
        setLoading(true);
        setListings([]);
        setCurrentOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      const response = await BigQueryService.getListings({
        ...filters,
        limit: currentLimit,
        offset: offset
      }, !forceRefresh); // Use cache unless force refresh
      
      const newListings = response.listings || [];
      setTotalCount(response.total || 0);
      setIsStale(false);
      
      if (reset) {
        setListings(newListings);
      } else {
        setListings(prev => [...prev, ...newListings]);
      }
      
      setHasMore(newListings.length === currentLimit);
      setCurrentOffset(offset + currentLimit);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      if (reset) {
        setListings([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, currentLimit, currentOffset]);

  useEffect(() => {
    fetchListings(true);
  }, [JSON.stringify(filters)]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchListings(false);
    }
  }, [loadingMore, hasMore, fetchListings]);

  const refetch = useCallback((forceRefresh = false) => {
    fetchListings(true, forceRefresh);
  }, [fetchListings]);

  return {
    listings,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    isStale
  };
}