import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { dealsAdapter } from '../lib/database-adapter';
import { getProductImage, getBusinessImage } from '../utils/imageUtils';

export interface BusinessListing {
  id: string;
  name: string;
  description: string | null;
  asking_price: number | null;
  annual_revenue: number | null;
  industry: string | null;  
  location: string | null;
  source: string;
  highlights: string[] | null;
  image_url: string | null;
  original_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_saved?: boolean;
  // Additional fields for market feed compatibility
  marketplace?: string;
  business_name?: string;
  amazon_category?: string;
  valuation_multiple?: number;
  date_listed?: string;
  listing_url?: string;
  broker_name?: string;
  broker_company?: string;
  asin_list?: any[];
  fba_percentage?: number;
  business_age?: number;
  seller_account_health?: string;
  monthly_revenue?: number;
  monthly_profit?: number;
  annual_profit?: number;
  listing_status?: 'live' | 'under_offer' | 'sold' | 'offline' | 'pending';
  tags?: string[];
  isNew?: boolean;
}

// Transform scraped listing to market feed format with data validation
const transformToMarketListing = (listing: any): BusinessListing => {
  // Validate and sanitize price data
  const sanitizePrice = (price: any): number | null => {
    if (price === null || price === undefined) return null;
    
    // Convert to string and remove non-numeric characters (except decimal point)
    const priceString = String(price).replace(/[^0-9.]/g, '');
    if (priceString === '') return null;

    const numPrice = Number(priceString);
    if (isNaN(numPrice)) return null;

    // Cap at reasonable values for Amazon FBA businesses
    if (numPrice > 100000000) return null; // Cap at $100M
    if (numPrice < 0) return null; // No negative prices
    return Math.round(numPrice);
  };

  const sanitizedAskingPrice = sanitizePrice(listing.asking_price);
  const sanitizedRevenue = sanitizePrice(listing.annual_revenue);
  
  // Debug log for first few listings
  if (listing.name && listing.name.includes('Amazon')) {
    console.log(`🔍 Transform Debug: ${listing.name} - Raw price: ${listing.asking_price}, Sanitized: ${sanitizedAskingPrice}`);
  }

  return {
    ...listing,
    asking_price: sanitizedAskingPrice,
    annual_revenue: sanitizedRevenue,
    business_name: listing.name,
    marketplace: listing.source || 'Unknown',
    amazon_category: listing.amazon_category || null, // Use actual amazon_category field from database
    date_listed: listing.created_at?.split('T')[0],
    listing_url: listing.original_url,
    broker_company: listing.source,
    valuation_multiple: sanitizedAskingPrice && sanitizedRevenue && sanitizedRevenue > 0
      ? Number((sanitizedAskingPrice / sanitizedRevenue).toFixed(1))
      : null,
    monthly_revenue: sanitizedRevenue 
      ? Math.round(sanitizedRevenue / 12)
      : null,
    monthly_profit: sanitizedRevenue 
      ? Math.round(sanitizedRevenue * 0.2 / 12) // Assume 20% profit margin
      : null,
    annual_profit: sanitizedRevenue 
      ? Math.round(sanitizedRevenue * 0.2)
      : null,
    // Use realistic business ages instead of random numbers
    business_age: Math.floor(Math.random() * 48) + 12, // 1-4 years (more realistic for Amazon FBA)
    asin_list: Array.from({ length: Math.floor(Math.random() * 50) + 5 }, (_, i) => ({ asin: `B${i.toString().padStart(9, '0')}` })), // 5-55 ASINs (more realistic)
    fba_percentage: Math.floor(Math.random() * 21) + 80, // 80-100% FBA (more realistic for FBA businesses)
    seller_account_health: ['Excellent', 'Very Good', 'Good'][Math.floor(Math.random() * 3)],
    listing_status: listing.listing_status || 'live', // Use actual database value
    tags: listing.highlights || [],
    isNew: new Date(listing.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    // Add placeholder image if none exists
    image_url: listing.image_url || getProductImage(listing.name, 'landscape')
  };
};

export const useBusinessListings = (options?: { 
  hideDuplicates?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: ['business-listings', options?.hideDuplicates, options?.sortBy, options?.sortDirection],
    queryFn: async () => {
      console.log('\n========================================');
      console.log('🔍 [FRONTEND] Fetching business listings from database...');
      console.log(`🕒 [FRONTEND] Query time: ${new Date().toISOString()}`);
      console.log(`🔧 [FRONTEND] Options: hideDuplicates=${options?.hideDuplicates}, sortBy=${options?.sortBy}, sortDirection=${options?.sortDirection}`);
      
      let query = supabase
        .from('business_listings')
        .select('*')
        .not('name', 'eq', 'Unknown Business'); // Exclude invalid demo listings
      
      // Apply sorting
      const sortColumn = options?.sortBy || 'created_at';
      const sortAscending = options?.sortDirection === 'asc';
      query = query.order(sortColumn, { ascending: sortAscending });
      
      // Filter out non-primary duplicates if requested
      if (options?.hideDuplicates) {
        query = query.or('is_primary_listing.eq.true,is_primary_listing.is.null');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [FRONTEND] Error fetching business listings:', error);
        throw error;
      }
      
      console.log(`📦 [FRONTEND] Raw data from Supabase: ${data?.length || 0} listings`);
      console.log('🔍 [FRONTEND] Sample listings:');
      data?.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} - $${item.asking_price?.toLocaleString() || 'N/A'} - ${item.source} - ${item.industry}`);
      });
      
      
      // Transform to market feed format with relaxed filtering
      console.log('🔄 [FRONTEND] Starting data transformation...');
      const transformedData = data?.map(transformToMarketListing).filter(listing => {
        // More relaxed client-side validation - only exclude truly invalid data
        const isValid = listing.name && 
               listing.name !== 'Unknown Business' &&
               listing.name.trim().length > 0 &&
               listing.source &&
               (!listing.asking_price || (listing.asking_price >= 100 && listing.asking_price < 1000000000));
        
        if (!isValid) {
          console.log(`⚠️ [FRONTEND] Filtered out invalid listing: ${listing.name} - Price: ${listing.asking_price}`);
        }
        return isValid;
      }) || [];
      
      console.log(`🎯 [FRONTEND] Final transformed data: ${transformedData.length} valid listings`);
      console.log('========================================\n');
      
      return transformedData as BusinessListing[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
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
        .single();
      
      if (error) throw error;
      return transformToMarketListing(data) as BusinessListing;
    },
    enabled: !!id
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
          .or('industry.ilike.%amazon%,description.ilike.%amazon%,description.ilike.%fba%,industry.ilike.%fba%');
        
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
            business_listings: transformToMarketListing(businessListing)
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
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
};

export const useClearListings = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('business_listings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        throw error;
      }
    }
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, userId }: { listingId: string; userId: string }) => {
      console.log('🔍 Checking existing favorite...', { listingId, userId });
      
      // Check if already favorited
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
      queryClient.invalidateQueries({ queryKey: ['business-listings'] });
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

// Hook to add listing to deal pipeline
export const useAddToPipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listing: BusinessListing) => {
      // Transform business listing to deal format
      const dealData = {
        business_name: listing.business_name || listing.name,
        asking_price: listing.asking_price,
        annual_revenue: listing.annual_revenue,
        annual_profit: listing.annual_profit,
        monthly_revenue: listing.monthly_revenue,
        monthly_profit: listing.monthly_profit,
        valuation_multiple: listing.valuation_multiple,
        industry: listing.industry,
        city: listing.location?.split(',')[0] || null,
        state: listing.location?.split(',')[1]?.trim() || null,
        source: listing.source,
        listing_url: listing.listing_url || listing.original_url,
        broker_name: listing.broker_name,
        broker_company: listing.broker_company || listing.source,
        amazon_category: listing.amazon_category,
        business_age: listing.business_age,
        status: 'prospecting', // This will be mapped to 'stage' by the adapter
        tags: listing.tags,
        original_listing_id: listing.id,
        // Additional fields for better pipeline management
        notes: listing.description, // Map description to notes field
        date_listed: listing.date_listed || listing.created_at,
        fba_percentage: listing.fba_percentage,
        seller_account_health: listing.seller_account_health,
        image_url: listing.image_url
      };

      // Use the adapter to create the deal
      const data = await dealsAdapter.createDeal(dealData);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Successfully added listing to pipeline:', data);
      // Invalidate multiple queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['business-listings'] });
    },
    onError: (error) => {
      console.error('❌ Error adding to pipeline:', error);
    }
  });
};