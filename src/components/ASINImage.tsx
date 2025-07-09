import React, { useState } from 'react';

interface ASINImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  loading?: 'lazy' | 'eager';
}

const ASINImage: React.FC<ASINImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText,
  loading = 'lazy' 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setImageError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Extract ASIN from alt text or use first 6 chars
  const displayText = fallbackText || alt.substring(0, 10) || 'Product';

  if (imageError) {
    // Fallback to a styled div when image fails to load
    return (
      <div 
        className={`${className} bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-medium text-xs`}
      >
        {displayText}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </>
  );
};

export default ASINImage;