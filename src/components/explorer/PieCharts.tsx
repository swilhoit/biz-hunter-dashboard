import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ProcessedProduct } from '../../utils/explorer/dataProcessing';

interface PieChartsProps {
  data: ProcessedProduct[];
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = [
  '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#a855f7',
  '#14b8a6', '#e11d48', '#0ea5e9', '#22c55e', '#fbbf24'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold">{data.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Count: {data.value} ({data.payload.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const PieCharts: React.FC<PieChartsProps> = ({ data }) => {
  const createChartData = (type: 'fulfillment' | 'brand' | 'sellerCountry'): ChartData[] => {
    const threshold = 0.03; // 3% threshold
    const countMap: Record<string, number> = {};
    let otherCount = 0;

    // Count occurrences
    data.forEach(item => {
      let key: string;
      switch (type) {
        case 'fulfillment':
          key = item.fulfillment || 'Unknown';
          break;
        case 'brand':
          key = item.brand || 'Unknown';
          break;
        case 'sellerCountry':
          key = item.sellerCountry || 'Unknown';
          break;
      }
      countMap[key] = (countMap[key] || 0) + 1;
    });

    const total = Object.values(countMap).reduce((sum, count) => sum + count, 0);
    const chartData: ChartData[] = [];

    // Process data with threshold
    Object.entries(countMap).forEach(([key, count]) => {
      const percentage = (count / total) * 100;
      if (count / total >= threshold) {
        chartData.push({
          name: key,
          value: count,
          percentage
        });
      } else {
        otherCount += count;
      }
    });

    // Add "Other" category if needed
    if (otherCount > 0) {
      chartData.push({
        name: 'Other',
        value: otherCount,
        percentage: (otherCount / total) * 100
      });
    }

    // Sort by value descending
    return chartData.sort((a, b) => b.value - a.value);
  };

  const renderPieChart = (type: 'fulfillment' | 'brand' | 'sellerCountry', title: string) => {
    const chartData = createChartData(type);

    if (chartData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center">No data available</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        </header>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.percentage > 5 ? `${entry.percentage.toFixed(1)}%` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderPieChart('fulfillment', 'Fulfillment Type Distribution')}
      {renderPieChart('brand', 'Brand Distribution')}
      {renderPieChart('sellerCountry', 'Seller Country Distribution')}
    </div>
  );
};