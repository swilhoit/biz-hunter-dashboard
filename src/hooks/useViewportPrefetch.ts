import { useEffect, useRef, useCallback } from 'react';
import DataPreloader from '../services/DataPreloader';
import { BusinessListing } from '../services/BigQueryService';

interface UseViewportPrefetchOptions {
  listings: BusinessListing[];
  bufferSize?: number; // How many items ahead to prefetch
  rootMargin?: string; // How early to start prefetching (e.g., "200px")
  enabled?: boolean;
}

export function useViewportPrefetch({
  listings,
  bufferSize = 5,
  rootMargin = '200px',
  enabled = true
}: UseViewportPrefetchOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prefetchedIds = useRef<Set<string>>(new Set());
  const pendingPrefetches = useRef<Set<string>>(new Set());

  // Prefetch listing details when they're about to come into view
  const prefetchVisibleListings = useCallback((entries: IntersectionObserverEntry[]) => {
    if (!enabled) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const listingId = entry.target.getAttribute('data-listing-id');
        if (listingId && !prefetchedIds.current.has(listingId) && !pendingPrefetches.current.has(listingId)) {
          // Mark as pending to avoid duplicate requests
          pendingPrefetches.current.add(listingId);
          
          // Find the listing index
          const index = listings.findIndex(l => l.id === listingId);
          if (index !== -1) {
            // Prefetch this listing and the next few
            const toPrefetch = listings.slice(index, index + bufferSize);
            
            // Prefetch in background with staggered delays to avoid overwhelming the API
            toPrefetch.forEach((listing, i) => {
              if (!prefetchedIds.current.has(listing.id)) {
                setTimeout(() => {
                  DataPreloader.prefetchListing(listing.id)
                    .then(() => {
                      prefetchedIds.current.add(listing.id);
                      pendingPrefetches.current.delete(listing.id);
                    })
                    .catch(() => {
                      pendingPrefetches.current.delete(listing.id);
                    });
                }, i * 100); // Stagger by 100ms
              }
            });
          }
        }
      }
    });
  }, [listings, bufferSize, enabled]);

  // Set up the Intersection Observer
  useEffect(() => {
    if (!enabled) return;

    // Create observer
    observerRef.current = new IntersectionObserver(prefetchVisibleListings, {
      rootMargin,
      threshold: 0.01 // Trigger as soon as any part is visible
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [prefetchVisibleListings, rootMargin, enabled]);

  // Function to observe a listing element
  const observeListing = useCallback((element: HTMLElement | null) => {
    if (!element || !enabled) return;
    
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, [enabled]);

  // Function to unobserve a listing element
  const unobserveListing = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    if (observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  // Prefetch on hover for immediate response
  const prefetchOnHover = useCallback((listingId: string) => {
    if (!enabled) return;
    
    if (!prefetchedIds.current.has(listingId) && !pendingPrefetches.current.has(listingId)) {
      pendingPrefetches.current.add(listingId);
      DataPreloader.prefetchListing(listingId)
        .then(() => {
          prefetchedIds.current.add(listingId);
          pendingPrefetches.current.delete(listingId);
        })
        .catch(() => {
          pendingPrefetches.current.delete(listingId);
        });
    }
  }, [enabled]);

  // Clear cache for specific listing
  const clearPrefetchCache = useCallback((listingId?: string) => {
    if (listingId) {
      prefetchedIds.current.delete(listingId);
    } else {
      prefetchedIds.current.clear();
    }
    pendingPrefetches.current.clear();
  }, []);

  return {
    observeListing,
    unobserveListing,
    prefetchOnHover,
    clearPrefetchCache,
    prefetchedCount: prefetchedIds.current.size
  };
}