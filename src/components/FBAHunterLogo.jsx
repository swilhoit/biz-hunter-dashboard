import React from 'react';

function FBAHunterLogo({ className = "h-8", showText = true }) {
  if (!showText) {
    // Show only the Amazon smile when sidebar is collapsed
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg 
          viewBox="0 0 24 24" 
          className="w-8 h-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M2 17C2 17 3.5 7 12 7C20.5 7 22 17 22 17" 
            stroke="#ff9900" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />
          <path 
            d="M20 17L22 19L20 21" 
            stroke="#ff9900" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-orange-500">FBA</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-1">Hunter</span>
      </div>
      {/* Amazon smile arrow */}
      <svg 
        viewBox="0 0 24 24" 
        className="w-8 h-8 ml-1 -mt-2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M2 17C2 17 3.5 7 12 7C20.5 7 22 17 22 17" 
          stroke="#ff9900" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <path 
          d="M20 17L22 19L20 21" 
          stroke="#ff9900" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default FBAHunterLogo;