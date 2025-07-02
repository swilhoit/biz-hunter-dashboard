
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessListing {
  id: string;
  name: string;
  description: string | null;
  asking_price: number;
  annual_revenue: number;
  industry: string;
  location: string;
  source: string;
  highlights: string[];
  image_url: string | null;
  original_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_saved?: boolean;
  // Optional verification fields (may not exist in database yet)
  is_active?: boolean;
  last_verified_at?: string;
  verification_status?: 'live' | 'removed' | 'pending';
}

export const useBusinessListings = () => {
  return useQuery({
    queryKey: ['business-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BusinessListing[];
    }
  });
};

export const useBusinessListing = (id: string) => {
  return useQuery({
    queryKey: ['business-listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single();
      
      if (error) throw error;
      return data as BusinessListing;
    }
  });
};

export const useFavorites = (userId?: string) => {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      try {
        if (!userId) {
          console.log('🔍 useFavorites: No userId provided');
          return [];
        }
        
        console.log('🔍 useFavorites: Fetching favorites for user:', userId);
        
        // Step 1: Get user's favorites
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('id, created_at, listing_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (favoritesError) {
          console.error('❌ Favorites query error:', favoritesError);
          throw new Error(`Failed to fetch favorites: ${favoritesError.message}`);
        }
        
        if (!favoritesData || favoritesData.length === 0) {
          console.log('✅ No favorites found for user');
          return [];
        }
        
        console.log('✅ Found', favoritesData.length, 'favorites');
        
        // Step 2: Get business listings for those favorites
        const listingIds = favoritesData.map(fav => fav.listing_id);
        
        const { data: listingsData, error: listingsError } = await supabase
          .from('business_listings')
          .select('*')
          .in('id', listingIds)
          .eq('status', 'active');
        
        if (listingsError) {
          console.error('❌ Listings query error:', listingsError);
          throw new Error(`Failed to fetch business listings: ${listingsError.message}`);
        }
        
        console.log('✅ Found', listingsData?.length || 0, 'business listings');
        
        // Step 3: Combine the data
        const result = favoritesData.map(favorite => {
          const businessListing = listingsData?.find(listing => listing.id === favorite.listing_id);
          if (!businessListing) {
            console.warn('⚠️ No business listing found for favorite:', favorite.id);
            return null;
          }
          
          return {
            id: favorite.id,
            created_at: favorite.created_at,
            business_listings: businessListing
          };
        }).filter(Boolean); // Remove nulls
        
        console.log('✅ Final result:', result.length, 'favorites with listings');
        return result;
        
      } catch (error) {
        console.error('❌ useFavorites error:', error);
        // Return empty array instead of throwing to prevent crash
        return [];
      }
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, userId }: { listingId: string; userId: string }) => {
      console.log('🔍 Checking existing favorite...', { listingId, userId });
      
      // Check if already favorited (don't use .single() to avoid 406 errors)
      const { data: existingList, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', userId);

      const existing = existingList && existingList.length > 0 ? existingList[0] : null;
      console.log('🔍 Existing favorite check result:', { existing, checkError, foundCount: existingList?.length || 0 });

      if (existing) {
        console.log('🗑️ Removing existing favorite:', existing.id);
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);
        if (error) {
          console.error('❌ Delete error:', error);
          throw error;
        }
        console.log('✅ Favorite removed successfully');
        return 'removed';
      } else {
        console.log('💾 Adding new favorite...');
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ listing_id: listingId, user_id: userId });
        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }
        console.log('✅ Favorite added successfully');
        return 'added';
      }
    },
    onSuccess: (result, { userId }) => {
      console.log('🔄 Invalidating queries after:', result);
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
    onError: (error) => {
      console.error('❌ useToggleFavorite error:', error);
    }
  });
};

export const useBusinessListingsWithSavedStatus = (userId?: string) => {
  const listingsQuery = useBusinessListings();
  const favoritesQuery = useFavorites(userId);

  console.log('🔍 useBusinessListingsWithSavedStatus:', {
    userId,
    listingsCount: listingsQuery.data?.length || 0,
    favoritesCount: favoritesQuery.data?.length || 0,
    favoritesLoading: favoritesQuery.isLoading
  });

  return {
    ...listingsQuery,
    data: listingsQuery.data?.map(listing => {
      const is_saved = favoritesQuery.data?.some(fav => fav.business_listings?.id === listing.id) || false;
      
      // Log saved status for first few listings
      if (listingsQuery.data?.indexOf(listing) < 3) {
        console.log(`📋 Listing ${listing.name.substring(0, 30)}... is_saved:`, is_saved);
      }
      
      return {
        ...listing,
        is_saved
      };
    }) || []
  };
};

export const useCreateInquiry = () => {
  return useMutation({
    mutationFn: async (inquiry: {
      listing_id: string;
      user_id: string;
      message: string;
      contact_email: string;
      contact_phone?: string;
    }) => {
      const { data, error } = await supabase
        .from('inquiries')
        .insert(inquiry);
      
      if (error) throw error;
      return data;
    }
  });
};
