
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, PlusCircle, User, LogIn } from 'lucide-react';

const Navigation = () => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">BizHunter</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Browse Listings
            </a>
            <a href="/sell" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Sell Your Business
            </a>
            <a href="/resources" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Resources
            </a>
            <a href="/about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              About
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center space-x-2">
              <PlusCircle className="h-4 w-4" />
              <span>List Business</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
            <Button size="sm" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
