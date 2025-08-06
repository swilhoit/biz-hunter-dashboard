import { useState, useEffect } from 'react';
import BigQueryService, { BusinessListing, ListingsFilter } from '../services/BigQueryService';

export function useBusinessListings(filters?: ListingsFilter) {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, [JSON.stringify(filters)]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BigQueryService.getListings(filters);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchListings();
  };

  return {
    listings,
    loading,
    error,
    refetch
  };
}

export function useBusinessListing(id: string) {
  const [listing, setListing] = useState<BusinessListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BigQueryService.getListingById(id);
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listing');
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    listing,
    loading,
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