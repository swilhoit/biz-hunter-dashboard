import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { ProcessedProduct } from '../../utils/explorer/dataProcessing';
import { useThemeProvider } from '../../utils/ThemeContext';
import { chartColors } from '../../charts/ChartjsConfig';

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
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">{data.title}</div>
        <div className="grid gap-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Price:</span>
            <span className="font-mono font-medium">${data.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Sales:</span>
            <span className="font-mono font-medium">{data.sales.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Revenue:</span>
            <span className="font-mono font-medium">${data.revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Rating:</span>
            <span className="font-mono font-medium">⭐ {data.rating.toFixed(1)} ({data.reviews.toLocaleString()})</span>
          </div>
        </div>
        {data.imageUrl && (
          <img 
            src={data.imageUrl} 
            alt={data.title} 
            className="w-16 h-16 object-cover mt-2 rounded border border-gray-200 dark:border-gray-600"
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
  const { currentTheme } = useThemeProvider();
  const darkMode = currentTheme === 'dark';
  const { gridColor, textColor } = chartColors;
  
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

  const chartConfig = {
    products: {
      label: "Products",
      color: "#8b5cf6",
    },
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Price vs Sales Analysis</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Correlation between product pricing and sales volume</p>
      </header>
      <div className="p-5">
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? gridColor.dark : gridColor.light}
              className="stroke-muted"
            />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Price" 
              unit="$"
              tick={{ 
                fontSize: 12, 
                fill: darkMode ? textColor.dark : textColor.light 
              }}
              axisLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              tickLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              label={{ 
                value: 'Price ($)', 
                position: 'insideBottom', 
                offset: -5,
                style: { textAnchor: 'middle', fill: darkMode ? textColor.dark : textColor.light }
              }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Sales"
              tick={{ 
                fontSize: 12, 
                fill: darkMode ? textColor.dark : textColor.light 
              }}
              axisLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              tickLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              label={{ 
                value: 'Sales Volume', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: darkMode ? textColor.dark : textColor.light }
              }}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <Scatter 
              name="Products" 
              data={formattedData} 
              fill="var(--color-products)"
              fillOpacity={0.7}
              r={6}
            />
          </ScatterChart>
        </ChartContainer>
      </div>
    </div>
  );
};