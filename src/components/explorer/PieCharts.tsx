import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';
import { ProcessedProduct } from '../../utils/explorer/dataProcessing';
import { useThemeProvider } from '../../utils/ThemeContext';
import { chartColors } from '../../charts/ChartjsConfig';

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
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium text-gray-800 dark:text-gray-100">{data.name}</div>
        <div className="grid gap-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Count:</span>
            <span className="font-mono font-medium">{data.value}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Percentage:</span>
            <span className="font-mono font-medium">{data.payload.percentage.toFixed(1)}%</span>
          </div>
        </div>
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
        <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          </header>
          <div className="p-5 text-center">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        </div>
      );
    }

    const chartConfig = chartData.reduce((acc, item, index) => {
      acc[item.name.toLowerCase().replace(/\s+/g, '')] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    }, {} as any);

    return (
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Distribution analysis of {type.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
        </header>
        <div className="p-5">
          <ChartContainer config={chartConfig} className="h-[350px]">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.percentage > 5 ? `${entry.percentage.toFixed(1)}%` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend 
                content={<ChartLegendContent />}
                className="flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {renderPieChart('fulfillment', 'Fulfillment Distribution')}
      {renderPieChart('brand', 'Brand Distribution')}
      {renderPieChart('sellerCountry', 'Seller Geography')}
    </div>
  );
};