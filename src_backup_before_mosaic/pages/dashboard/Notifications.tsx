import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Heart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  X,
  Settings,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new_listing' | 'price_change' | 'status_change' | 'market_update' | 'system';
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
  actionable?: {
    text: string;
    url: string;
  };
  metadata?: {
    listing_id?: string;
    old_price?: number;
    new_price?: number;
    industry?: string;
  };
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  new_listings: boolean;
  price_changes: boolean;
  saved_listing_updates: boolean;
  market_reports: boolean;
  system_updates: boolean;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    new_listings: true,
    price_changes: true,
    saved_listing_updates: true,
    market_reports: false,
    system_updates: true
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real notifications from API
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/notifications/${user?.id}?limit=50`
      );
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      } else {
        // Fallback to mock notifications
        const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New listing in Technology',
          message: 'A new SaaS business listing matches your interests and budget range.',
          type: 'new_listing',
          priority: 'high',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false,
          actionable: {
            text: 'View Listing',
            url: '/listing/123'
          },
          metadata: {
            listing_id: '123',
            industry: 'Technology'
          }
        },
        {
          id: '2',
          title: 'Price reduced on saved listing',
          message: 'E-commerce Business - Online Retail Store price reduced by $50,000',
          type: 'price_change',
          priority: 'medium',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionable: {
            text: 'View Changes',
            url: '/listing/456'
          },
          metadata: {
            listing_id: '456',
            old_price: 800000,
            new_price: 750000
          }
        },
        {
          id: '3',
          title: 'Saved listing no longer available',
          message: 'Restaurant - Italian Cuisine has been marked as sold.',
          type: 'status_change',
          priority: 'medium',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: true,
          metadata: {
            listing_id: '789'
          }
        },
        {
          id: '4',
          title: 'Weekly Market Report',
          message: 'Technology sector showing 15% increase in listings this week.',
          type: 'market_update',
          priority: 'low',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionable: {
            text: 'Read Report',
            url: '/reports/weekly'
          }
        },
        {
          id: '5',
          title: 'System maintenance scheduled',
          message: 'Platform will be temporarily unavailable on Sunday, 2-4 AM PST.',
          type: 'system',
          priority: 'low',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: true
        }
        ];

        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    // Mock settings - in real app, fetch from API
    // Settings already initialized with defaults
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/notifications/${notificationId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            read: true
          })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    toast.success('All notifications marked as read');
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://biz-hunter-dashboard-production.up.railway.app/api/notifications/${notificationId}?userId=${user?.id}`,
        {
          method: 'DELETE'
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.filter(notif => notif.id !== notificationId)
        );
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Mock API call
    toast.success('Notification settings updated');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_listing':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'price_change':
        return <Heart className="h-4 w-4 text-green-500" />;
      case 'status_change':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'market_update':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-300';
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
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
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

  const filteredNotifications = notifications.filter(notif => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'read' && notif.read) || 
      (filter === 'unread' && !notif.read);
    
    const matchesTypeFilter = typeFilter === 'all' || notif.type === typeFilter;
    
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <h1 className="text-2xl font-light text-gray-900 flex items-center space-x-2">
            <Bell className="h-6 w-6" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600">Stay updated on your business opportunities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex space-x-1">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All ({notifications.length})
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                  >
                    Unread ({unreadCount})
                  </Button>
                  <Button
                    variant={filter === 'read' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('read')}
                  >
                    Read ({notifications.length - unreadCount})
                  </Button>
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="new_listing">New Listings</option>
                  <option value="price_change">Price Changes</option>
                  <option value="status_change">Status Updates</option>
                  <option value="market_update">Market Reports</option>
                  <option value="system">System</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>

                              {/* Metadata */}
                              {notification.metadata && (
                                <div className="flex items-center space-x-3 mt-2">
                                  {notification.metadata.old_price && notification.metadata.new_price && (
                                    <div className="text-xs">
                                      <span className="line-through text-red-500">
                                        {formatCurrency(notification.metadata.old_price)}
                                      </span>
                                      <span className="ml-2 text-green-600 font-medium">
                                        {formatCurrency(notification.metadata.new_price)}
                                      </span>
                                    </div>
                                  )}
                                  {notification.metadata.industry && (
                                    <Badge variant="secondary" className="text-xs">
                                      {notification.metadata.industry}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {notification.actionable && (
                                    <Button variant="outline" size="sm">
                                      {notification.actionable.text}
                                    </Button>
                                  )}
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Methods */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Email Notifications</span>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSettings('email_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Push Notifications</span>
                    </div>
                    <Switch
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => updateSettings('push_notifications', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Listings</span>
                    <Switch
                      checked={settings.new_listings}
                      onCheckedChange={(checked) => updateSettings('new_listings', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Price Changes</span>
                    <Switch
                      checked={settings.price_changes}
                      onCheckedChange={(checked) => updateSettings('price_changes', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Saved Listing Updates</span>
                    <Switch
                      checked={settings.saved_listing_updates}
                      onCheckedChange={(checked) => updateSettings('saved_listing_updates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Reports</span>
                    <Switch
                      checked={settings.market_reports}
                      onCheckedChange={(checked) => updateSettings('market_reports', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Updates</span>
                    <Switch
                      checked={settings.system_updates}
                      onCheckedChange={(checked) => updateSettings('system_updates', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New notifications</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price changes</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New listings</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notifications;