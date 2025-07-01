import Navigation from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useBusinessListings";
import { FavoriteNotesAndFiles } from "@/components/FavoriteNotesAndFiles";
import { Heart, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SavedListing {
  id: string;
  created_at: string;
  notes?: string;
  updated_at?: string;
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
  favorite_files?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }>;
}

const SavedListings = () => {
  const { user } = useAuth();
  const { data: favorites = [], isLoading, error, refetch } = useFavorites(user?.id);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpanded = (favoriteId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(favoriteId)) {
      newExpanded.delete(favoriteId);
    } else {
      newExpanded.add(favoriteId);
    }
    setExpandedCards(newExpanded);
  };

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
    console.error('SavedListings error:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Saved Listings</h2>
            <p className="text-gray-600 mb-2">{error?.message || 'Unknown error occurred'}</p>
            <p className="text-sm text-gray-500 mb-4">
              Debug info: {JSON.stringify(error, null, 2)}
            </p>
            <div className="space-x-2">
              <Button onClick={() => refetch()}>Try Again</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
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
            <div className="space-y-6">
              {favorites.map((favorite) => {
                const isExpanded = expandedCards.has(favorite.id);
                return (
                  <Card key={favorite.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Business Card Section */}
                      <div className="p-6">
                        <BusinessCard 
                          listing={{
                            ...favorite.business_listings,
                            is_saved: true
                          }}
                        />
                        
                        {/* Expand/Collapse Button for Notes */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Button
                            onClick={() => toggleExpanded(favorite.id)}
                            variant="ghost"
                            className="w-full justify-between"
                          >
                            <span className="text-sm font-medium">
                              Notes & Documents
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Expandable Notes Section */}
                      {isExpanded && (
                        <div className="px-6 pb-6 bg-gray-50">
                          <FavoriteNotesAndFiles
                            favoriteId={favorite.id}
                            listingName={favorite.business_listings.name}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SavedListings;