
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
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
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
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          business_listings (*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, userId }: { listingId: string; userId: string }) => {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return 'removed';
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ listing_id: listingId, user_id: userId });
        if (error) throw error;
        return 'added';
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    }
  });
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
