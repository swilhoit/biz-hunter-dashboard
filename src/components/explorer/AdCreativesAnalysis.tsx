import React, { useState, useCallback } from 'react';
import { Search, Eye, AlertCircle, TrendingUp, Image, Video, X } from 'lucide-react';

interface AdCreative {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  brand: string;
  position: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
}

interface AdCreativesAnalysisProps {
  keywords: string;
  products: any[];
}

const AdCreativeImage: React.FC<{ src: string; alt: string; brand: string; className?: string }> = ({ 
  src, 
  alt, 
  brand, 
  className = '' 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}>
        <div className="text-center">
          <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{brand}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export function AdCreativesAnalysis({ keywords, products }: AdCreativesAnalysisProps) {
  const [searchKeyword, setSearchKeyword] = useState(keywords);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);

  const handleSearchAds = useCallback(async () => {
    if (!searchKeyword.trim()) {
      setError('Please enter a keyword to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mock implementation - would normally use DataForSEO API
      // Generate sample ad creatives based on the keyword
      const mockCreatives: AdCreative[] = [
        {
          id: '1',
          type: 'image',
          url: 'https://via.placeholder.com/300x200/8b5cf6/white?text=Ad+Creative+1',
          title: `${searchKeyword} - Premium Quality Product`,
          brand: 'Brand A',
          position: 1,
          impressions: 15000,
          clicks: 450,
          ctr: 3.0
        },
        {
          id: '2',
          type: 'image',
          url: 'https://via.placeholder.com/300x200/10b981/white?text=Ad+Creative+2',
          title: `Best ${searchKeyword} on Amazon`,
          brand: 'Brand B',
          position: 2,
          impressions: 12000,
          clicks: 360,
          ctr: 3.0
        },
        {
          id: '3',
          type: 'video',
          url: 'https://via.placeholder.com/300x200/f59e0b/white?text=Video+Ad',
          title: `${searchKeyword} Product Demo`,
          brand: 'Brand C',
          position: 3,
          impressions: 8000,
          clicks: 200,
          ctr: 2.5
        },
        {
          id: '4',
          type: 'image',
          url: 'https://via.placeholder.com/300x200/ef4444/white?text=Ad+Creative+4',
          title: `Top Rated ${searchKeyword}`,
          brand: 'Brand D',
          position: 4,
          impressions: 6000,
          clicks: 150,
          ctr: 2.5
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAdCreatives(mockCreatives);
    } catch (err: any) {
      setError('Failed to fetch ad creatives');
      console.error('Ad creatives error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchKeyword]);

  // Extract top brands from ad creatives
  const topBrands = adCreatives.reduce((acc, creative) => {
    acc[creative.brand] = (acc[creative.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedBrands = Object.entries(topBrands)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Amazon Ad Creatives Analysis</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Analyze competitor ad creatives and strategies</p>
        </header>
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter keyword to analyze ad creatives..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchAds()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleSearchAds}
            disabled={isLoading}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {isLoading ? 'Analyzing...' : 'Analyze Ads'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Advertising Brands */}
      {sortedBrands.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Top Brands in Your Search</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Brands with the most advertising presence</p>
          </header>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {sortedBrands.map(([brand, count]) => (
                <div key={brand} className="text-center">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{brand}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ad Creatives Grid */}
      {adCreatives.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                Ad Creatives ({adCreatives.length})
              </h4>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                  <Image className="w-3 h-3 mr-1" />
                  {adCreatives.filter(c => c.type === 'image').length} Images
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                  <Video className="w-3 h-3 mr-1" />
                  {adCreatives.filter(c => c.type === 'video').length} Videos
                </span>
              </div>
            </div>
          </header>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adCreatives.map((creative) => (
                <div
                  key={creative.id}
                  onClick={() => setSelectedCreative(creative)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                    {creative.type === 'image' ? (
                      <AdCreativeImage
                        src={creative.url}
                        alt={creative.title}
                        brand={creative.brand}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      Position #{creative.position}
                    </div>
                  </div>
                  <div className="p-4">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                      {creative.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{creative.brand}</p>
                    {creative.ctr && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">CTR: {creative.ctr.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Creative Detail Modal */}
      {selectedCreative && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCreative(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {selectedCreative.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCreative.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedCreative(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                {selectedCreative.type === 'image' ? (
                  <AdCreativeImage
                    src={selectedCreative.url}
                    alt={selectedCreative.title}
                    brand={selectedCreative.brand}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedCreative.url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    #{selectedCreative.position}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ad Position</div>
                </div>
                {selectedCreative.impressions && (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {selectedCreative.impressions.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Impressions</div>
                  </div>
                )}
                {selectedCreative.ctr && (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {selectedCreative.ctr.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">CTR</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && adCreatives.length === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="p-8 text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              Enter a keyword above to analyze Amazon ad creatives and competitor strategies
            </p>
          </div>
        </div>
      )}
    </div>
  );
}