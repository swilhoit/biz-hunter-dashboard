
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
        .in('source', ['BizBuySell', 'QuietLight', 'Acquire', 'BizQuest', 'MicroAcquire', 'Flippa', 'EmpireFlippers', 'ExitAdviser'])
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
        .in('source', ['BizBuySell', 'QuietLight', 'Acquire', 'BizQuest', 'MicroAcquire', 'Flippa', 'EmpireFlippers', 'ExitAdviser'])
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
      if (!userId) {
        console.log('🔍 useFavorites: No userId provided');
        return [];
      }
      
      console.log('🔍 useFavorites: Fetching favorites for user:', userId);
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          business_listings (*)
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ useFavorites error:', error);
        throw error;
      }
      
      console.log('✅ useFavorites: Found', data?.length || 0, 'favorites');
      return data;
    },
    enabled: !!userId
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
