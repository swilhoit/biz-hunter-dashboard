import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { ProcessedProduct } from '../../utils/explorer/dataProcessing';

interface ScatterPlotProps {
  data: ProcessedProduct[];
}

interface ScatterPoint {
  title: string;
  price: number;
  sales: number;
  x: number;
  y: number;
  imageUrl: string;
  revenue: number;
  reviews: number;
  rating: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ScatterPoint;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
        <p className="font-semibold text-sm mb-1 line-clamp-2">{data.title}</p>
        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
          <p>Price: ${data.price.toFixed(2)}</p>
          <p>Sales: {data.sales.toLocaleString()}</p>
          <p>Revenue: ${data.revenue.toLocaleString()}</p>
          <p>Reviews: {data.reviews.toLocaleString()} (⭐ {data.rating.toFixed(1)})</p>
        </div>
        {data.imageUrl && (
          <img 
            src={data.imageUrl} 
            alt={data.title} 
            className="w-16 h-16 object-cover mt-2 rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
      </div>
    );
  }
  return null;
};

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ data }) => {
  const formattedData: ScatterPoint[] = data.map(item => ({
    title: item.title,
    price: item.price,
    sales: item.sales,
    x: item.price,
    y: item.sales,
    imageUrl: item.imageUrl,
    revenue: item.revenue,
    reviews: item.reviews,
    rating: item.rating
  }));

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Price vs Sales Scatter Plot</h2>
      </header>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Price" 
              unit="$"
              tick={{ fontSize: 12 }}
              label={{ value: 'Price ($)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Sales"
              tick={{ fontSize: 12 }}
              label={{ value: 'Sales', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              name="Products" 
              data={formattedData} 
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};