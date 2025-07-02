import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Heart, 
  User, 
  Activity, 
  Bell, 
  Settings, 
  Building2,
  ArrowLeft,
  Search,
  Brain,
  Target,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/UserMenu';
import { Badge } from '@/components/ui/badge';

const DashboardLayout = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      name: 'Browse Listings',
      href: '/',
      icon: Search,
      current: location.pathname === '/'
    },
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Deal Pipeline',
      href: '/dashboard/crm',
      icon: Target,
      current: location.pathname.startsWith('/dashboard/crm')
    },
    {
      name: 'Saved Listings',
      href: '/dashboard/saved',
      icon: Heart,
      current: location.pathname === '/dashboard/saved'
    },
    {
      name: 'Analytics',
      href: '/dashboard/crm/analytics',
      icon: BarChart3,
      current: location.pathname === '/dashboard/crm/analytics'
    },
    {
      name: 'AI Analysis',
      href: '/dashboard/ai-analysis',
      icon: Brain,
      current: location.pathname === '/dashboard/ai-analysis'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">FBA Hunter</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link 
              to="/dashboard/notifications" 
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge - you can add state management for unread count */}
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
          <div className="p-4 flex-1">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info in Sidebar */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">Free Account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;