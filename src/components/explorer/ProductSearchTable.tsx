import React from 'react';
import { Download, Package, Trash2, ExternalLink } from 'lucide-react';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';

interface ProductSearchTableProps {
  products: any[];
  selectedProducts: string[];
  onProductSelect: (asin: string) => void;
  onDeleteProduct: (asin: string) => void;
  onExport: () => void;
  isLoading: boolean;
}

export function ProductSearchTable({
  products,
  selectedProducts,
  onProductSelect,
  onDeleteProduct,
  onExport,
  isLoading
}: ProductSearchTableProps) {
  if (isLoading) {
    return (
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Enter keywords above to search for Amazon products
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            Search Results 
            <span className="text-gray-400 dark:text-gray-500 font-medium ml-2">
              ({products.length} products)
            </span>
          </h2>
          <button 
            onClick={onExport}
            className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </header>
      
      <div className="overflow-x-auto">
        <table className="table-auto w-full dark:text-gray-300">
          <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-b border-gray-100 dark:border-gray-700/60">
            <tr>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                <div className="flex items-center">
                  <label className="inline-flex">
                    <span className="sr-only">Select all</span>
                    <input 
                      className="form-checkbox" 
                      type="checkbox" 
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={() => {
                        if (selectedProducts.length === products.length) {
                          selectedProducts.forEach(asin => onProductSelect(asin));
                        } else {
                          products.forEach(p => {
                            if (!selectedProducts.includes(p.asin)) {
                              onProductSelect(p.asin);
                            }
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-left">Product</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right">Price</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right">Sales</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right">Revenue</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right">Reviews</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-center">Rating</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-left">Category</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
            {products.map((product, index) => (
              <tr key={`${product.asin}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select</span>
                      <input 
                        className="form-checkbox" 
                        type="checkbox" 
                        checked={selectedProducts.includes(product.asin)}
                        onChange={() => onProductSelect(product.asin)}
                      />
                    </label>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="relative inline-flex mr-3">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/50'} 
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                        <div className="truncate max-w-xs" title={product.title}>
                          {product.title}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        ASIN: {product.asin}
                        <a 
                          href={product.amazonUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-violet-500 hover:text-violet-600 ml-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right font-medium">${product.price.toFixed(2)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right">{formatNumberWithCommas(product.sales)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right font-medium text-green-600 dark:text-green-400">
                    ${formatNumberWithCommas(product.revenue)}
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right">{formatNumberWithCommas(product.reviews)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-xs inline-flex font-medium rounded-full text-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {product.category || 'N/A'}
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <button
                    onClick={() => onDeleteProduct(product.asin)}
                    className="text-gray-400 hover:text-red-500 rounded-full"
                  >
                    <span className="sr-only">Delete</span>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}