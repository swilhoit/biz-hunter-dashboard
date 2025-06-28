
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Heart, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/UserMenu';

const Navigation = () => {
  const { user } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">
              BizHunter
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Browse Listings
            </Link>
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/saved" 
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                >
                  <Heart className="h-4 w-4" />
                  <span>Saved</span>
                </Link>
              </>
            )}
            <a 
              href="#" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sell Business
            </a>
            <a 
              href="#" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Resources
            </a>
          </div>

          {/* User Menu / Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
