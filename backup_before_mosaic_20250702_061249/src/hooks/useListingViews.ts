import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ViewedListing {
  listingId: string;
  viewedAt: string;
  listingName?: string;
}

export const useListingViews = () => {
  const { user } = useAuth();
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);

  // Load viewed listings from localStorage on mount
  useEffect(() => {
    if (user) {
      const storageKey = `viewed_listings_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setViewedListings(parsed);
        } catch (error) {
          console.error('Error parsing viewed listings:', error);
          setViewedListings([]);
        }
      }
    }
  }, [user]);

  // Track a new listing view
  const trackView = (listingId: string, listingName?: string) => {
    if (!user) return;

    const storageKey = `viewed_listings_${user.id}`;
    
    // Don't track duplicate views on the same day
    const today = new Date().toDateString();
    const existingView = viewedListings.find(
      view => view.listingId === listingId && 
      new Date(view.viewedAt).toDateString() === today
    );

    if (existingView) return;

    const newView: ViewedListing = {
      listingId,
      viewedAt: new Date().toISOString(),
      listingName
    };

    const updatedViews = [newView, ...viewedListings].slice(0, 100); // Keep only last 100 views
    setViewedListings(updatedViews);
    localStorage.setItem(storageKey, JSON.stringify(updatedViews));
    
    console.log('📊 Tracked view for listing:', listingName || listingId);
  };

  // Get view statistics
  const getViewStats = () => {
    const totalViews = viewedListings.length;
    const uniqueListings = new Set(viewedListings.map(v => v.listingId)).size;
    const today = new Date().toDateString();
    const viewsToday = viewedListings.filter(
      view => new Date(view.viewedAt).toDateString() === today
    ).length;
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const viewsThisWeek = viewedListings.filter(
      view => new Date(view.viewedAt) >= thisWeek
    ).length;

    return {
      totalViews,
      uniqueListings,
      viewsToday,
      viewsThisWeek,
      recentViews: viewedListings.slice(0, 5)
    };
  };

  // Clear all views (for privacy/reset)
  const clearViews = () => {
    if (!user) return;
    
    const storageKey = `viewed_listings_${user.id}`;
    localStorage.removeItem(storageKey);
    setViewedListings([]);
  };

  return {
    viewedListings,
    trackView,
    getViewStats,
    clearViews
  };
};