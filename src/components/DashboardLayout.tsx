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
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/UserMenu';

const DashboardLayout = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Saved Listings',
      href: '/dashboard/saved',
      icon: Heart,
      current: location.pathname === '/dashboard/saved'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      current: location.pathname === '/dashboard/profile'
    },
    {
      name: 'Activity',
      href: '/dashboard/activity',
      icon: Activity,
      current: location.pathname === '/dashboard/activity'
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      current: location.pathname === '/dashboard/notifications'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: location.pathname === '/dashboard/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to BizHunter</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Dashboard</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
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
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-50 rounded-lg p-3">
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