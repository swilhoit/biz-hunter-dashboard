import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, User, LogOut } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { onAuthChange, signOutUser } from '../lib/firebase';

function Header({
  variant = 'default',
}) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-stone-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-stone-700/60 after:-z-10' : 'max-lg:shadow-sm lg:before:bg-stone-50/90 dark:lg:before:bg-stone-900/90'} ${variant === 'v2' ? 'dark:before:bg-stone-800' : ''} ${variant === 'v3' ? 'dark:before:bg-stone-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8 w-full max-w-9xl mx-auto">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-stone-700/60'}`}>

          {/* Header: Left side - Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Crosshair className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                bizhunter.ai
              </h1>
            </Link>
            <p className="ml-4 text-sm text-gray-600 dark:text-stone-400 hidden sm:block">
              AI-powered business acquisition platform
            </p>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center gap-3">
            {/* Navigation Links */}
            <nav className="flex items-center gap-4 mr-4">
              <Link to="/feed" className="text-sm font-medium text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100">
                Browse Listings
              </Link>
              {user && (
                <Link to="/deals" className="text-sm font-medium text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100">
                  Deal Pipeline
                </Link>
              )}
            </nav>

            <ThemeToggle />
            
            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/settings/account"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;