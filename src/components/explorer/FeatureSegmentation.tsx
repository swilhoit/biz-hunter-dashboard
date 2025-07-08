import React, { useState, useCallback, useEffect } from 'react';
import { Brain, Layers, TrendingUp, Package, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
    } catch (err) {
      setError('Failed to segment products. Please check your AI provider settings.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [products, aiProvider, onSegmentsUpdate]);

  const selectedSegmentData = segments.find(s => s.id === selectedSegment);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Feature Segmentation</CardTitle>
              <CardDescription>
                Use AI to extract product features and group similar products into market segments
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSettings && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Provider
              </label>
              <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="groq">Groq (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleSegmentation}
            disabled={isLoading || products.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate Segments
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Segments Overview */}
      {segments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <Card
              key={segment.id}
              onClick={() => setSelectedSegment(segment.id)}
              className={`cursor-pointer transition-all ${
                selectedSegment === segment.id
                  ? 'ring-2 ring-violet-500'
                  : 'hover:shadow-lg'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    {segment.description && (
                      <CardDescription className="mt-1 text-xs">
                        {segment.description}
                      </CardDescription>
                    )}
                    <CardDescription className="mt-1">
                      {segment.metrics.productCount} products
                      {segment.metrics.marketShare && (
                        <span className="ml-2">• {segment.metrics.marketShare.toFixed(1)}% market share</span>
                      )}
                    </CardDescription>
                  </div>
                  <Layers className="w-8 h-8 text-violet-500 ml-4 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                    <span className="font-medium">
                      ${formatNumberWithCommas(segment.metrics.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Price</span>
                    <span className="font-medium">
                      ${segment.metrics.avgPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Rating</span>
                    <span className="font-medium">
                      ⭐ {segment.metrics.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Key Features</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {segment.features.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{segment.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Segment Details */}
      {selectedSegmentData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedSegmentData.name} - Detailed View</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSegmentData.features.map((feature, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSegmentData.products.map((product) => (
                  <TableRow key={product.asin}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product.imageUrl || 'https://via.placeholder.com/40'} 
                          alt={product.title}
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40';
                          }}
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
                    </TableCell>
                    <TableCell className="text-right">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumberWithCommas(product.sales)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${formatNumberWithCommas(product.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      ⭐ {product.rating.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && segments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Click "Generate Segments" to use AI for feature extraction and market segmentation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}