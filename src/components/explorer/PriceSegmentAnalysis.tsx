import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { ProcessedProduct, PriceSegment, getPriceSegments, SummaryData, formatNumberWithCommas } from '../../utils/explorer/dataProcessing';

interface PriceSegmentAnalysisProps {
  data: ProcessedProduct[];
  summaryData: SummaryData | null;
  onDeleteProduct: (asin: string) => void;
  onProductSelect: (asin: string) => void;
  selectedProducts: string[];
}

export const PriceSegmentAnalysis: React.FC<PriceSegmentAnalysisProps> = ({
  data,
  summaryData,
  onDeleteProduct,
  onProductSelect,
  selectedProducts
}) => {
  const [priceIncrement, setPriceIncrement] = useState(10);
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});

  const priceSegments = useMemo(() => {
    if (!data || data.length === 0 || !summaryData) return [];
    return getPriceSegments(data, priceIncrement, summaryData);
  }, [data, priceIncrement, summaryData]);

  const toggleSegment = (segmentTitle: string) => {
    setExpandedSegments(prev => ({
      ...prev,
      [segmentTitle]: !prev[segmentTitle]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Price Segment Analysis</h2>
      </header>
      
      <div className="p-4">
        {/* Price Increment Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Segment Increment: ${priceIncrement}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={priceIncrement}
            onChange={(e) => setPriceIncrement(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>$5</span>
            <span>$25</span>
            <span>$50</span>
          </div>
        </div>

        {/* Segments Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % Sales
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {priceSegments.map((segment) => (
                <React.Fragment key={segment.title}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {segment.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ${formatNumberWithCommas(segment.averagePrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {segment.productCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatNumberWithCommas(segment.reviews)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatNumberWithCommas(segment.sales)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ${formatNumberWithCommas(segment.revenue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {segment.percentOfTotalSales.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {segment.percentOfTotalRevenue.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleSegment(segment.title)}
                        className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
                      >
                        {expandedSegments[segment.title] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Segment Details */}
                  {expandedSegments[segment.title] && (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 bg-gray-50 dark:bg-gray-700/30">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Select
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Product
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Price
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Sales
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Revenue
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Reviews
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                              {segment.items.map((item) => (
                                <tr key={item.asin} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts.includes(item.asin)}
                                      onChange={() => onProductSelect(item.asin)}
                                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center">
                                      <img
                                        src={item.imageUrl || 'https://via.placeholder.com/40'}
                                        alt={item.title}
                                        className="w-10 h-10 rounded object-cover mr-2"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'https://via.placeholder.com/40';
                                        }}
                                      />
                                      <div className="max-w-xs">
                                        <a
                                          href={item.amazonUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 line-clamp-1"
                                        >
                                          {item.title}
                                        </a>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    ${item.price.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {formatNumberWithCommas(item.sales)}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    ${formatNumberWithCommas(item.revenue)}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {formatNumberWithCommas(item.reviews)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => onDeleteProduct(item.asin)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};