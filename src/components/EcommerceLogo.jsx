import React from 'react';

function EcommerceLogo({ className = "h-8" }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-2xl font-sans font-semibold text-gray-900 dark:text-gray-100">
        E-commerce Acquisition Feed
      </span>
    </div>
  );
}

export default EcommerceLogo;