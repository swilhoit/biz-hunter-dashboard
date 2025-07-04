import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Search, 
  Filter, 
  Grid2X2, 
  List, 
  Trash2,
  ExternalLink,
  TrendingUp,
  DollarSign,
  MapPin,
  Building2,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useToggleFavorite } from '@/hooks/useBusinessListings';
import { BusinessCard } from '@/components/BusinessCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface SavedListing {
  id: string;
  created_at: string;
  notes?: string;
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

const SavedListingsDashboard = () => {
  const { user } = useAuth();
  const { data: favorites = [], isLoading, error } = useFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();
  const [filteredListings, setFilteredListings] = useState<SavedListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');

  // Convert favorites data to match expected SavedListing format
  const savedListings = favorites.map(fav => ({
    id: fav.id,
    created_at: fav.created_at,
    business_listings: fav.business_listings
  }));

  useEffect(() => {
    filterListings();
  }, [favorites, searchTerm, selectedIndustries, statusFilter, sortBy]);


  const filterListings = () => {
    let filtered = [...savedListings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.business_listings.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.business_listings.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.business_listings.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Industry filter
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(item =>
        selectedIndustries.includes(item.business_listings.industry)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = item.business_listings.verification_status || 'live';
        return status === statusFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_high':
          return b.business_listings.asking_price - a.business_listings.asking_price;
        case 'price_low':
          return a.business_listings.asking_price - b.business_listings.asking_price;
        default:
          return 0;
      }
    });

    setFilteredListings(filtered);
  };

  const handleRemoveSaved = async (listingId: string) => {
    if (!user?.id) return;
    
    try {
      await toggleFavorite.mutateAsync({
        listingId,
        userId: user.id
      });
      toast.success('Listing removed from saved');
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
    return new Date(dateString).toLocaleDateString();
  };

  const uniqueIndustries = [...new Set(savedListings.map(item => item.business_listings.industry))];

  const getStatusCounts = () => {
    const counts = {
      all: savedListings.length,
      live: savedListings.filter(item => item.business_listings.verification_status === 'live').length,
      removed: savedListings.filter(item => item.business_listings.verification_status === 'removed').length,
      pending: savedListings.filter(item => item.business_listings.verification_status === 'pending').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Saved Listings</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'Failed to load saved listings'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Saved Listings</h1>
          <p className="text-gray-600">
            {savedListings.length} saved {savedListings.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <Link to="/">
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            Browse More Listings
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold">{statusCounts.all}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setStatusFilter('live')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Live</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.live}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setStatusFilter('removed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Removed</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.removed}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checking</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search saved listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="live">Live</option>
                <option value="removed">Removed</option>
                <option value="pending">Checking</option>
              </select>

              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {savedListings.length === 0 ? 'No Saved Listings Yet' : 'No Results Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {savedListings.length === 0 
                ? 'Save interesting business opportunities to keep track of them here.'
                : 'Try adjusting your search or filters.'
              }
            </p>
            <Link to="/">
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Browse Listings
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => (
                <Card key={item.id} className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardHeader className="pb-3">
                    <Link to={`/dashboard/saved/${item.id}`} className="block mb-3">
                      <CardTitle className="text-lg font-light text-gray-900 hover:text-blue-600 transition-colors truncate">
                        {item.business_listings.name}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <StatusBadge 
                          status={item.business_listings.verification_status || 'live'}
                          lastVerified={item.business_listings.last_verified_at}
                        />
                        <Badge variant="outline" className="text-xs">
                          {item.business_listings.source}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveSaved(item.business_listings.id)}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove from saved"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                        {item.business_listings.original_url && (
                          <a
                            href={item.business_listings.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {item.business_listings.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(item.business_listings.asking_price)}
                        </p>
                        <p className="text-xs text-gray-600">Asking Price</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(item.business_listings.annual_revenue)}
                        </p>
                        <p className="text-xs text-gray-600">Revenue</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{item.business_listings.industry}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{item.business_listings.location}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Saved {formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {filteredListings.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link to={`/dashboard/saved/${item.id}`}>
                                <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 mb-1">
                                  {item.business_listings.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {item.business_listings.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(item.business_listings.asking_price)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Building2 className="h-4 w-4" />
                                  <span>{item.business_listings.industry}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{item.business_listings.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Saved {formatDate(item.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <StatusBadge 
                                status={item.business_listings.verification_status || 'live'}
                                lastVerified={item.business_listings.last_verified_at}
                              />
                              {item.business_listings.original_url && (
                                <a 
                                  href={item.business_listings.original_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-blue-600"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleRemoveSaved(item.business_listings.id)}
                                className="p-2 text-gray-400 hover:text-red-600"
                                title="Remove from saved"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SavedListingsDashboard;