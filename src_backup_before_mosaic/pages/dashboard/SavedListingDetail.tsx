import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Heart,
  ExternalLink,
  DollarSign,
  TrendingUp,
  MapPin,
  Building2,
  Calendar,
  Eye,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  Download,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useToggleFavorite } from '@/hooks/useBusinessListings';
import { StatusBadge } from '@/components/StatusBadge';
import { FavoriteNotesAndFiles } from '@/components/FavoriteNotesAndFiles';
import { toast } from 'sonner';

const SavedListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: favorites = [], isLoading, error } = useFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();

  // Find the specific favorite listing
  const favorite = favorites.find(fav => fav.id === id);
  const listing = favorite?.business_listings;

  const handleRemoveSaved = async () => {
    if (!user?.id || !listing?.id) return;
    
    try {
      await toggleFavorite.mutateAsync({
        listingId: listing.id,
        userId: user.id
      });
      toast.success('Listing removed from saved');
      // Navigate back to saved listings
      window.history.back();
    } catch (error) {
      console.error('Error removing saved listing:', error);
      toast.error('Failed to remove listing');
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !favorite || !listing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link to="/dashboard/saved">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Saved Listings
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error ? 'Error Loading Listing' : 'Listing Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'The saved listing you\'re looking for could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard/saved">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Saved Listings
          </Button>
        </Link>
        
        <div className="flex items-center space-x-2">
          <StatusBadge 
            status={listing.verification_status || 'live'}
            lastVerified={listing.last_verified_at}
          />
          <Button
            onClick={handleRemoveSaved}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Heart className="h-4 w-4 mr-2 fill-current" />
            Remove from Saved
          </Button>
        </div>
      </div>

      {/* Main Listing Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{listing.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4" />
                  <span>{listing.industry}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Saved {formatDate(favorite.created_at)}</span>
                </div>
              </div>
            </div>
            {listing.image_url && (
              <img 
                src={listing.image_url} 
                alt={listing.name}
                className="w-24 h-24 object-cover rounded-lg ml-4"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(listing.asking_price)}
              </p>
              <p className="text-sm text-gray-600">Asking Price</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(listing.annual_revenue)}
              </p>
              <p className="text-sm text-gray-600">Annual Revenue</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {((listing.asking_price / listing.annual_revenue) || 0).toFixed(1)}x
              </p>
              <p className="text-sm text-gray-600">Revenue Multiple</p>
            </div>
          </div>

          {listing.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {listing.highlights && listing.highlights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Key Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {listing.highlights.map((highlight, index) => (
                  <Badge key={index} variant="secondary">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Source: <span className="font-medium">{listing.source}</span>
            </div>
            {listing.original_url && (
              <a
                href={listing.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Original Listing
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes and Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Notes & Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FavoriteNotesAndFiles
            favoriteId={favorite.id}
            initialNotes={favorite.notes}
            businessListing={{
              id: listing.id,
              name: listing.name,
              description: listing.description || '',
              asking_price: listing.asking_price,
              annual_revenue: listing.annual_revenue,
              industry: listing.industry,
              location: listing.location
            }}
          />
        </CardContent>
      </Card>

      {/* Investment Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Financial Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Revenue Multiple:</span>
                  <span className="font-medium">
                    {((listing.asking_price / listing.annual_revenue) || 0).toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Revenue:</span>
                  <span className="font-medium">
                    {formatCurrency(listing.annual_revenue / 12)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Asking Price:</span>
                  <span className="font-medium">{formatCurrency(listing.asking_price)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Due Diligence Checklist</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Financial statements review</p>
                <p>• Customer concentration analysis</p>
                <p>• Market competition assessment</p>
                <p>• Technical infrastructure audit</p>
                <p>• Legal compliance verification</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedListingDetail;