import React, { useState, useEffect } from 'react';
import { getAmazonImageUrls, getPlaceholderImageUrl, transformAmazonImageSize } from '../utils/amazonImageUrl';

interface ASINImageProps {
  src?: string;
  asin?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  loading?: 'lazy' | 'eager';
}

const ASINImage: React.FC<ASINImageProps> = ({ 
  src, 
  asin,
  alt, 
  className = '', 
  fallbackText,
  loading = 'lazy' 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSources, setImageSources] = useState<string[]>([]);

  useEffect(() => {
    // Build array of image sources to try
    const sources: string[] = [];
    
    // First, try the provided src if available
    if (src && src !== 'null' && src !== 'undefined' && !src.includes('placeholder')) {
      // Transform small Amazon thumbnails to larger sizes
      const transformedSrc = transformAmazonImageSize(src, 'large');
      sources.push(transformedSrc);
      
      // Also add medium size as fallback
      if (src.includes('amazon')) {
        sources.push(transformAmazonImageSize(src, 'medium'));
      }
    }
    
    // Only use actual image URLs from the database
    // Don't add fallback URLs that cause errors
    
    setImageSources(sources);
    setCurrentImageIndex(0);
    setImageError(false);
    setIsLoading(true);
  }, [src, asin, alt, fallbackText]);

  const handleError = () => {
    // Try the next image source
    if (currentImageIndex < imageSources.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setIsLoading(true); // Reset loading state for new image
    } else {
      // All sources failed, show the fallback UI
      setImageError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Extract ASIN from alt text or use first 6 chars
  const displayText = fallbackText || asin?.substring(0, 6) || alt.substring(0, 10) || 'Product';

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

  // If no image sources available, show fallback immediately
  if (!imageSources.length || imageSources.length === 0) {
    return (
      <div 
        className={`${className} bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-medium text-xs rounded-lg`}
      >
        {displayText}
      </div>
    );
  }

  const currentSrc = imageSources[currentImageIndex];
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}
      <img
        key={currentImageIndex}
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default ASINImage;