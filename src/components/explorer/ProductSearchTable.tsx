import React from 'react';
import { Download, Package, Trash2, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
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
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Enter keywords above to search for Amazon products
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Search Results ({products.length})</CardTitle>
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === products.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        products.forEach(p => onProductSelect(p.asin));
                      } else {
                        selectedProducts.forEach(asin => onProductSelect(asin));
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Reviews</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.asin}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.asin)}
                      onCheckedChange={() => onProductSelect(product.asin)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/50'} 
                        alt={product.title}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          ASIN: {product.asin}
                          <a 
                            href={product.amazonUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-violet-600 hover:text-violet-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
                    {formatNumberWithCommas(product.reviews)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-yellow-500">⭐</span>
                      {product.rating.toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {product.category || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => onDeleteProduct(product.asin)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}