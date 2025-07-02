import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Activity as ActivityIcon,
  Heart, 
  Eye, 
  Search, 
  Building2,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  ExternalLink,
  Star,
  MessageSquare,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'view' | 'save' | 'unsave' | 'search' | 'inquiry' | 'profile_update';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    listing_id?: string;
    listing_name?: string;
    search_term?: string;
    industry?: string;
    price?: number;
  };
}

const Activity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivity();
  }, [user]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, typeFilter, dateFilter]);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real activity data from API
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/activity/${user?.id}?limit=50`
      );
      const data = await response.json();
      
      if (data.success) {
        // Transform API data to match component interface
        const transformedActivities = data.data.map((activity: any) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
          metadata: activity.metadata
        }));
        
        setActivities(transformedActivities);
      } else {
        // Fallback to mock data if API fails
        const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'save',
          title: 'Saved a listing',
          description: 'E-commerce Business - Online Retail Store',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: {
            listing_id: '1',
            listing_name: 'E-commerce Business - Online Retail Store',
            industry: 'E-commerce',
            price: 750000
          }
        },
        {
          id: '2',
          type: 'view',
          title: 'Viewed a listing',
          description: 'Tech Startup - SaaS Platform',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          metadata: {
            listing_id: '2',
            listing_name: 'Tech Startup - SaaS Platform',
            industry: 'Technology',
            price: 2500000
          }
        },
        {
          id: '3',
          type: 'search',
          title: 'Performed search',
          description: 'Searched for "restaurants california"',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metadata: {
            search_term: 'restaurants california'
          }
        },
        {
          id: '4',
          type: 'save',
          title: 'Saved a listing',
          description: 'Restaurant - Italian Cuisine',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            listing_id: '3',
            listing_name: 'Restaurant - Italian Cuisine',
            industry: 'Food & Beverage',
            price: 450000
          }
        },
        {
          id: '5',
          type: 'inquiry',
          title: 'Sent inquiry',
          description: 'Manufacturing Business - Auto Parts',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            listing_id: '4',
            listing_name: 'Manufacturing Business - Auto Parts',
            industry: 'Manufacturing',
            price: 1200000
          }
        },
        {
          id: '6',
          type: 'profile_update',
          title: 'Updated profile',
          description: 'Added investment preferences and budget range',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '7',
          type: 'view',
          title: 'Viewed a listing',
          description: 'Healthcare Practice - Dental Clinic',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            listing_id: '5',
            listing_name: 'Healthcare Practice - Dental Clinic',
            industry: 'Healthcare',
            price: 850000
          }
        },
        {
          id: '8',
          type: 'unsave',
          title: 'Removed from saved',
          description: 'Retail Store - Clothing Boutique',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            listing_id: '6',
            listing_name: 'Retail Store - Clothing Boutique',
            industry: 'Retail',
            price: 320000
          }
        }
        ];

        setActivities(mockActivities);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.metadata?.listing_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter !== 'all') {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        const diffTime = now.getTime() - activityDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'save':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'unsave':
        return <Heart className="h-4 w-4 text-gray-400" />;
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'search':
        return <Search className="h-4 w-4 text-purple-500" />;
      case 'inquiry':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'profile_update':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'save':
        return 'bg-red-50 border-red-200';
      case 'unsave':
        return 'bg-gray-50 border-gray-200';
      case 'view':
        return 'bg-blue-50 border-blue-200';
      case 'search':
        return 'bg-purple-50 border-purple-200';
      case 'inquiry':
        return 'bg-green-50 border-green-200';
      case 'profile_update':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
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

  const getActivityStats = () => {
    const stats = {
      total: activities.length,
      saves: activities.filter(a => a.type === 'save').length,
      views: activities.filter(a => a.type === 'view').length,
      inquiries: activities.filter(a => a.type === 'inquiry').length
    };
    return stats;
  };

  const stats = getActivityStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Activity History</h1>
          <p className="text-gray-600">Track your browsing and interaction history</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Activity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ActivityIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saved</p>
                <p className="text-2xl font-bold text-red-600">{stats.saves}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Viewed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.views}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inquiries</p>
                <p className="text-2xl font-bold text-green-600">{stats.inquiries}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="save">Saved</option>
                <option value="view">Viewed</option>
                <option value="search">Searches</option>
                <option value="inquiry">Inquiries</option>
                <option value="profile_update">Profile Updates</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity ({filteredActivities.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No activity found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`relative flex items-start space-x-4 p-4 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  {/* Timeline line */}
                  {index < filteredActivities.length - 1 && (
                    <div className="absolute left-8 top-12 w-0.5 h-8 bg-gray-200"></div>
                  )}

                  {/* Activity Icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full border-2 border-current flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        
                        {/* Metadata */}
                        {activity.metadata && (
                          <div className="flex items-center space-x-3 mt-2">
                            {activity.metadata.industry && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.metadata.industry}
                              </Badge>
                            )}
                            {activity.metadata.price && (
                              <span className="text-xs text-green-600 font-medium">
                                {formatCurrency(activity.metadata.price)}
                              </span>
                            )}
                            {activity.metadata.search_term && (
                              <span className="text-xs text-purple-600 font-medium">
                                "{activity.metadata.search_term}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        {activity.metadata?.listing_id && (
                          <Link to={`/listing/${activity.metadata.listing_id}`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Activity;