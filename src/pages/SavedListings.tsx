import Navigation from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useBusinessListings";
import { Heart, Loader2, AlertCircle } from "lucide-react";

interface SavedListing {
  id: string;
  created_at: string;
  business_listings: {
    id: string;
    name: string;
    description: string;
    asking_price: number;
    annual_revenue: number;
    industry: string;
    location: string;
    source: string;
    highlights: string[];
    image_url?: string;
    original_url?: string;
    status: string;
    is_active?: boolean;
    last_verified_at?: string;
    verification_status?: 'live' | 'removed' | 'pending';
  };
}

const SavedListings = () => {
  const { user } = useAuth();
  const { data: favorites = [], isLoading, error, refetch } = useFavorites(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to view your saved listings.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your saved listings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Saved Listings</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-light text-gray-900">Saved Listings</h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} saved {favorites.length === 1 ? 'listing' : 'listings'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Saved Listings Yet</h2>
              <p className="text-gray-600 mb-4">
                Save interesting business opportunities to keep track of them here.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Browse Businesses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <BusinessCard 
                  key={favorite.id} 
                  listing={{
                    ...favorite.business_listings,
                    is_saved: true
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SavedListings;