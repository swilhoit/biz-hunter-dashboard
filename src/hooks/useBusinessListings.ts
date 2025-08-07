import { useState, useEffect } from 'react';
import BigQueryService, { BusinessListing, ListingsFilter } from '../services/BigQueryService';

export function useBusinessListings(filters?: ListingsFilter) {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentLimit] = useState(100);

  useEffect(() => {
    fetchListings(true); // Reset when filters change
  }, [JSON.stringify(filters)]);

  const fetchListings = async (reset = false) => {
    try {
      const offset = reset ? 0 : currentOffset;
      
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
      });
      
      const newListings = response.listings || [];
      setTotalCount(response.total || 0);
      
      if (reset) {
        setListings(newListings);
      } else {
        setListings(prev => [...prev, ...newListings]);
      }
      
      // Check if there are more items to load
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
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchListings(false);
    }
  };

  const refetch = () => {
    fetchListings(true);
  };

  return {
    listings,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch
  };
}

export function useBusinessListing(id: string) {
  const [data, setData] = useState<BusinessListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const listing = await BigQueryService.getListingById(id);
      setData(listing);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch listing');
      setError(errorObj);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error
  };
}

export function useOffMarketDeals() {
  const [deals, setDeals] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BigQueryService.getOffMarketDeals();
      setDeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch off-market deals');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    deals,
    loading,
    error,
    refetch: fetchDeals
  };
}