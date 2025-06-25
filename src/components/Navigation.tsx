
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, PlusCircle, User, Menu } from 'lucide-react';

const Navigation = () => {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BizHunter
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Browse
            </a>
            <a href="/sell" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Sell
            </a>
            <a href="/resources" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              Resources
            </a>
            <a href="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
              About
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              className="hidden sm:flex items-center space-x-2 rounded-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>List Business</span>
            </Button>
            
            <div className="hidden sm:flex items-center space-x-2 border border-gray-300 rounded-full p-1">
              <Button variant="ghost" size="sm" className="rounded-full px-4 py-2 h-auto">
                <span className="text-sm">Sign In</span>
              </Button>
              <Button size="sm" className="rounded-full px-4 py-2 h-auto bg-gray-900 hover:bg-gray-800">
                <span className="text-sm">Sign Up</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden rounded-full p-2">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
