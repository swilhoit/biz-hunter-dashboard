import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Eye, 
  TrendingUp, 
  Building2, 
  Clock, 
  Star,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BusinessCard } from '@/components/BusinessCard';
import { Link } from 'react-router-dom';

interface DashboardStats {
  savedListings: number;
  viewedListings: number;
  totalListings: number;
  recentActivity: any[];
}

interface RecentListing {
  id: string;
  name: string;
  asking_price: number;
  industry: string;
  location: string;
  verification_status: string;
  created_at: string;
}

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    savedListings: 0,
    viewedListings: 0,
    totalListings: 0,
    recentActivity: []
  });
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/dashboard/stats/${user?.id}`
      );
      const statsData = await statsResponse.json();
      
      // Fetch saved listings count and data
      const savedResponse = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/favorites/${user?.id}`
      );
      const savedData = await savedResponse.json();
      
      // Fetch recent listings
      const recentResponse = await fetch(
        'https://biz-hunter-dashboard-production.up.railway.app/api/listings/recent'
      );
      const recentData = await recentResponse.json();

      // Update stats with real data
      if (statsData.success) {
        setStats(statsData.data);
      }

      setSavedListings(savedData.success ? savedData.data.slice(0, 3) : []);
      setRecentListings(recentData.success ? recentData.data.slice(0, 6) : []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening with your business search</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/dashboard/saved">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              View Saved
            </Button>
          </Link>
          <Link to="/">
            <Button size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              Browse Listings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Listings</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedListings}</div>
            <p className="text-xs text-muted-foreground">
              Your favorite opportunities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Viewed</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewedListings}</div>
            <p className="text-xs text-muted-foreground">
              Listings you've explored
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Listings</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              Total opportunities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              New listings added
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Listings Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Saves</CardTitle>
            <Link to="/dashboard/saved">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {savedListings.length === 0 ? (
              <div className="text-center py-6">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved listings yet</p>
                <Link to="/">
                  <Button variant="outline" size="sm" className="mt-2">
                    Start Browsing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedListings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.business_listings.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-green-600 font-medium">
                          {formatCurrency(item.business_listings.asking_price)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {item.business_listings.industry}
                        </Badge>
                      </div>
                    </div>
                    <Link to={`/listing/${item.business_listings.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Link to="/dashboard/activity">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Mock activity data */}
              <div className="flex items-center space-x-3 p-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Saved a listing in Technology</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Eye className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Viewed Restaurant listing</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Updated search preferences</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recently Added Listings</CardTitle>
          <Link to="/">
            <Button variant="ghost" size="sm">
              Browse All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentListings.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent listings available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentListings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{listing.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(listing.asking_price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Industry:</span>
                      <Badge variant="secondary" className="text-xs">
                        {listing.industry}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="text-xs">{listing.location}</span>
                    </div>
                  </div>
                  <Link to={`/listing/${listing.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;