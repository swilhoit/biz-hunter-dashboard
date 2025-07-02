import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useBusinessListings } from '@/hooks/useBusinessListings';
import { useListingViews } from '@/hooks/useListingViews';
import { 
  Heart, 
  Eye, 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  Target,
  Clock
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: favorites = [] } = useFavorites(user?.id);
  const { data: allListings = [] } = useBusinessListings();
  const { getViewStats } = useListingViews();
  
  const viewStats = getViewStats();

  if (!user) {
    return null; // Don't show dashboard if not signed in
  }

  // Calculate metrics from available data
  const totalSavedListings = favorites.length;
  const totalAvailableListings = allListings.length;
  
  // Calculate total value of saved listings
  const totalSavedValue = favorites.reduce((sum, fav) => {
    return sum + (fav.business_listings?.asking_price || 0);
  }, 0);

  // Calculate average asking price of saved listings
  const averageSavedPrice = totalSavedListings > 0 ? totalSavedValue / totalSavedListings : 0;

  // Get user join date (from user metadata)
  const userJoinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';

  // Get most recent save date
  const mostRecentSave = favorites.length > 0 
    ? new Date(Math.max(...favorites.map(f => new Date(f.created_at).getTime())))
    : null;

  // Get favorite industries from saved listings
  const favoriteIndustries = favorites.reduce((acc, fav) => {
    const industry = fav.business_listings?.industry;
    if (industry) {
      acc[industry] = (acc[industry] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topIndustry = Object.entries(favoriteIndustries)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const savePercentage = totalAvailableListings > 0 
    ? ((totalSavedListings / totalAvailableListings) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Welcome back, {user.email?.split('@')[0] || 'User'}!</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Member since {userJoinDate}
          </p>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Saved Listings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalSavedListings}</p>
                <p className="text-sm text-gray-600">Saved Listings</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {savePercentage}% of available
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Portfolio Value */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSavedValue)}</p>
                <p className="text-sm text-gray-600">Portfolio Value</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Avg: {formatCurrency(averageSavedPrice)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Available Listings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalAvailableListings}</p>
                <p className="text-sm text-gray-600">Available Listings</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Ready to explore
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Viewed Listings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{viewStats.uniqueListings}</p>
                <p className="text-sm text-gray-600">Viewed Listings</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {viewStats.viewsThisWeek} this week
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Last Activity */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {mostRecentSave ? mostRecentSave.toLocaleDateString() : 'No activity'}
                </p>
                <p className="text-sm text-gray-600">Last Save</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {mostRecentSave ? 'Recent activity' : 'Start exploring'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      {totalSavedListings > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Industry Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Your Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Favorite Industry</p>
                  <p className="text-lg text-gray-900">
                    {topIndustry || 'Various'} 
                    {favoriteIndustries[topIndustry || ''] && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({favoriteIndustries[topIndustry]} listings)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Price Range Interest</p>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(Math.min(...favorites.map(f => f.business_listings?.asking_price || 0)))} - {formatCurrency(Math.max(...favorites.map(f => f.business_listings?.asking_price || 0)))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Saves</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {favorites.slice(0, 3).map((fav) => (
                  <div key={fav.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {fav.business_listings?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(fav.business_listings?.asking_price || 0)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(fav.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {favorites.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    ...and {favorites.length - 3} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {totalSavedListings === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Portfolio</h3>
            <p className="text-gray-600 mb-4">
              Save interesting business opportunities to track them here and build your investment portfolio insights.
            </p>
            <Badge variant="outline">💡 Tip: Click the ❤️ icon on any listing to save it</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
};