import React, { useState } from 'react';
import { Layers, Check, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';
import ASINImage from '../ASINImage';

interface ProductComparisonProps {
  products: any[];
  selectedProducts: string[];
  onProductSelect: (asin: string) => void;
}

export function ProductComparison({ products, selectedProducts, onProductSelect }: ProductComparisonProps) {
  const [comparisonView, setComparisonView] = useState<'features' | 'metrics'>('metrics');
  
  const comparisonProducts = products.filter(p => selectedProducts.includes(p.asin));
  
  if (comparisonProducts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Product Comparison</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Select products from the search results to compare them side by side
        </p>
        <p className="text-sm text-gray-400">
          {selectedProducts.length} products selected
        </p>
      </div>
    );
  }

  const metrics = [
    { key: 'price', label: 'Price', format: (v: number) => `$${v.toFixed(2)}` },
    { key: 'sales', label: 'Monthly Sales', format: (v: number) => formatNumberWithCommas(v) },
    { key: 'revenue', label: 'Monthly Revenue', format: (v: number) => `$${formatNumberWithCommas(v)}` },
    { key: 'reviews', label: 'Reviews', format: (v: number) => formatNumberWithCommas(v) },
    { key: 'rating', label: 'Rating', format: (v: number) => `⭐ ${v.toFixed(1)}` },
  ];

  const getMetricComparison = (product: any, metric: string) => {
    const values = comparisonProducts.map(p => p[metric]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const productValue = product[metric];
    
    if (productValue > avg * 1.1) return { icon: TrendingUp, color: 'text-green-500' };
    if (productValue < avg * 0.9) return { icon: TrendingDown, color: 'text-red-500' };
    return { icon: Minus, color: 'text-gray-400' };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Comparing {comparisonProducts.length} Products
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setComparisonView('metrics')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                comparisonView === 'metrics'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setComparisonView('features')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                comparisonView === 'features'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Features
            </button>
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {comparisonProducts.map((product, index) => (
            <div key={`${product.asin}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="relative mb-3">
                <ASINImage
                  src={product.imageUrl}
                  asin={product.asin}
                  alt={product.title}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  onClick={() => onProductSelect(product.asin)}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                {product.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                ASIN: {product.asin}
              </p>
              {product.brand && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Brand: {product.brand}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {comparisonView === 'metrics' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Metric
                  </th>
                  {comparisonProducts.map((product, index) => (
                    <th key={`${product.asin}-header-${index}`} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      <div className="line-clamp-2">{product.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.map((metric) => (
                  <tr key={metric.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {metric.label}
                    </td>
                    {comparisonProducts.map((product, index) => {
                      const comparison = getMetricComparison(product, metric.key);
                      const Icon = comparison.icon;
                      return (
                        <td key={`${product.asin}-${metric.key}-${index}`} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <span>{metric.format(product[metric.key])}</span>
                            <Icon className={`w-4 h-4 ${comparison.color}`} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Fulfillment
                  </td>
                  {comparisonProducts.map((product, index) => (
                    <td key={`${product.asin}-fulfillment-${index}`} className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.fulfillment === 'FBA' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {product.fulfillment || 'Unknown'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Features Comparison */}
      {comparisonView === 'features' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">Feature Comparison</h4>
            <div className="space-y-4">
              {comparisonProducts[0]?.featureBullets && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Feature
                        </th>
                        {comparisonProducts.map((product, index) => (
                          <th key={`${product.asin}-feature-header-${index}`} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                            <div className="line-clamp-1">{product.title}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Extract unique features */}
                      {(() => {
                        const allFeatures = new Set();
                        comparisonProducts.forEach(p => {
                          p.featureBullets?.forEach(f => allFeatures.add(f));
                        });
                        return Array.from(allFeatures);
                      })().map((feature: string, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </td>
                          {comparisonProducts.map((product, productIndex) => (
                            <td key={`${product.asin}-feature-${index}-${productIndex}`} className="px-4 py-3 text-center">
                              {product.featureBullets?.includes(feature) ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!comparisonProducts[0]?.featureBullets && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Feature data not available for these products
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add more products prompt */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select more products from the search results to add them to this comparison
        </p>
      </div>
    </div>
  );
}