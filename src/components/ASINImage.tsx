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
    
    // Then, if we have an ASIN, try Amazon image URLs
    if (asin) {
      sources.push(...getAmazonImageUrls(asin));
    }
    
    // Finally, add a placeholder
    const placeholderText = fallbackText || asin?.substring(0, 6) || alt.substring(0, 10) || 'Product';
    sources.push(getPlaceholderImageUrl(placeholderText));
    
    setImageSources(sources);
    setCurrentImageIndex(0);
    setImageError(false);
    setIsLoading(true);
  }, [src, asin, alt, fallbackText]);

  const handleError = () => {
    console.log(`Failed to load image at index ${currentImageIndex}: ${imageSources[currentImageIndex]}`);
    
    // Try the next image source
    if (currentImageIndex < imageSources.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
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
        key={currentImageIndex}
        src={imageSources[currentImageIndex]}
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