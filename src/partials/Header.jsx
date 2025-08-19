import React from 'react';
import { Link } from 'react-router-dom';
import { Crosshair } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

function Header({
  variant = 'default',
}) {

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
            <p className="ml-4 text-sm text-gray-600 dark:text-stone-400">
              AI-powered business acquisition platform
            </p>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;