import React, { useState, useCallback, useEffect } from 'react';
import { Brain, Layers, TrendingUp, Package, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import ASINImage from '../ASINImage';
import { extractFeatures, segmentByFeatures } from '../../utils/explorer/aiSegmentation';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';
import OpenAIService from '../../services/OpenAIService';

interface Segment {
  id: string;
  name: string;
  description?: string;
  features: string[];
  products: any[];
  metrics: {
    totalRevenue: number;
    totalSales: number;
    avgPrice: number;
    avgRating: number;
    productCount: number;
    marketShare?: number;
  };
}

interface FeatureSegmentationProps {
  products: any[];
  onSegmentsUpdate: (segments: Segment[]) => void;
  segments: Segment[];
}

export function FeatureSegmentation({ products, onSegmentsUpdate, segments }: FeatureSegmentationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'groq'>('openai');
  const [showSettings, setShowSettings] = useState(false);

  const handleSegmentation = useCallback(async () => {
    if (products.length === 0) {
      setError('Please search for products first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let segmentsWithMetrics = [];
      
      if (aiProvider === 'openai') {
        // Use server-side OpenAI segmentation for better results
        const openAIService = new OpenAIService();
        const response = await openAIService.segmentProductPortfolio(products);
        
        // Convert server response to component format
        segmentsWithMetrics = response.segments.map((segment, index) => ({
          id: `segment-${index}`,
          name: segment.name,
          description: segment.description || '',
          features: segment.features || [],
          products: segment.products,
          metrics: {
            totalRevenue: segment.totalRevenue,
            totalSales: segment.products.reduce((sum, p) => sum + p.sales, 0),
            avgPrice: segment.averagePrice,
            avgRating: segment.averageRating || segment.products.reduce((sum, p) => sum + p.rating, 0) / segment.products.length,
            productCount: segment.products.length,
            marketShare: segment.marketShare
          }
        }));
      } else {
        // Use client-side segmentation for other providers
        const features = await extractFeatures(products, aiProvider);
        const newSegments = await segmentByFeatures(products, features, aiProvider);
        
        // Calculate metrics for each segment
        segmentsWithMetrics = newSegments.map((segment, index) => ({
          id: `segment-${index}`,
          name: segment.name,
          features: segment.features,
          products: segment.products,
          metrics: {
            totalRevenue: segment.products.reduce((sum, p) => sum + p.revenue, 0),
            totalSales: segment.products.reduce((sum, p) => sum + p.sales, 0),
            avgPrice: segment.products.reduce((sum, p) => sum + p.price, 0) / segment.products.length,
            avgRating: segment.products.reduce((sum, p) => sum + p.rating, 0) / segment.products.length,
            productCount: segment.products.length
          }
        }));
      }

      onSegmentsUpdate(segmentsWithMetrics);
    } catch (err: any) {
      let errorMessage = 'Failed to segment products.';
      
      if (err.message?.includes('OpenAI API key not configured')) {
        errorMessage = 'OpenAI API key is not configured. The system will use intelligent category-based segmentation instead.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again with fewer products or check your internet connection.';
      } else if (aiProvider === 'openai') {
        errorMessage = 'OpenAI service is unavailable. Using fallback segmentation based on product categories and price ranges.';
      } else {
        errorMessage = 'Failed to segment products. Please check your AI provider settings.';
      }
      
      setError(errorMessage);
      console.error('Segmentation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [products, aiProvider, onSegmentsUpdate]);

  const selectedSegmentData = segments.find(s => s.id === selectedSegment);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">AI Feature Segmentation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use AI to extract product features and group similar products into market segments
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="p-5 space-y-4">
          {showSettings && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="groq">Groq (Fast)</option>
              </select>
            </div>
          )}

          <button
            onClick={handleSegmentation}
            disabled={isLoading || products.length === 0}
            className="w-full px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Generate Segments
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Segments Overview */}
      {segments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <div
              key={segment.id}
              onClick={() => setSelectedSegment(segment.id)}
              className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl cursor-pointer transition-all ${
                selectedSegment === segment.id
                  ? 'ring-2 ring-violet-500'
                  : 'hover:shadow-lg'
              }`}
            >
              <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{segment.name}</h4>
                    {segment.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {segment.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {segment.metrics.productCount} products
                      {segment.metrics.marketShare && (
                        <span className="ml-2">• {segment.metrics.marketShare.toFixed(1)}% market share</span>
                      )}
                    </p>
                  </div>
                  <Layers className="w-8 h-8 text-violet-500 ml-4 flex-shrink-0" />
                </div>
              </header>
              <div className="p-5">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      ${formatNumberWithCommas(segment.metrics.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Price</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      ${segment.metrics.avgPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Rating</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      ⭐ {segment.metrics.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Key Features</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      >
                        {feature}
                      </span>
                    ))}
                    {segment.features.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{segment.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Segment Details */}
      {selectedSegmentData && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">{selectedSegmentData.name} - Detailed View</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSegmentData.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                >
                  {feature}
                </span>
              ))}
            </div>
          </header>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedSegmentData.products.map((product) => (
                    <tr key={product.asin} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <ASINImage 
                            src={product.imageUrl} 
                            asin={product.asin}
                            alt={product.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {product.asin}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        {formatNumberWithCommas(product.sales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        ${formatNumberWithCommas(product.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        ⭐ {product.rating.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && segments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="p-8 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Click "Generate Segments" to use AI for feature extraction and market segmentation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}