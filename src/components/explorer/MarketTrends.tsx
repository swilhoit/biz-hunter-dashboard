import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Globe, DollarSign, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';
import { useThemeProvider } from '../../utils/ThemeContext';
import { chartColors } from '../../charts/ChartjsConfig';

interface MarketTrendsProps {
  products: any[];
  keywords: string;
  keywordData: any;
}

export function MarketTrends({ products, keywords, keywordData }: MarketTrendsProps) {
  const { currentTheme } = useThemeProvider();
  const darkMode = currentTheme === 'dark';
  const { gridColor, textColor } = chartColors;
  
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Generate trend data based on products
    if (products.length > 0) {
      const months = timeRange === '30d' ? 1 : timeRange === '90d' ? 3 : 12;
      const data = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const randomVariation = 0.8 + Math.random() * 0.4; // 80% to 120% variation
        const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0) * randomVariation;
        const totalSales = products.reduce((sum, p) => sum + p.sales, 0) * randomVariation;
        const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: Math.round(totalRevenue),
          sales: Math.round(totalSales),
          avgPrice: Math.round(avgPrice * 100) / 100,
          products: Math.round(products.length * (0.9 + Math.random() * 0.2))
        });
      }
      
      setTrendData(data);
    }
  }, [products, timeRange]);

  // Market insights calculations
  const insights = {
    growthRate: trendData.length > 1 
      ? Number(((trendData[trendData.length - 1]?.revenue - trendData[0]?.revenue) / trendData[0]?.revenue * 100).toFixed(1))
      : 0,
    avgMonthlyRevenue: trendData.length > 0
      ? Math.round(trendData.reduce((sum, d) => sum + d.revenue, 0) / trendData.length)
      : 0,
    topCategory: products.length > 0
      ? Object.entries(products.reduce((acc, p) => {
          const cat = p.category || 'Unknown';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'
      : 'N/A',
    marketConcentration: products.length > 0
      ? Number((products.slice(0, 5).reduce((sum, p) => sum + p.revenue, 0) / 
         products.reduce((sum, p) => sum + p.revenue, 0) * 100).toFixed(1))
      : 0
  };

  const seasonalData = [
    { month: 'Jan', index: 95 },
    { month: 'Feb', index: 92 },
    { month: 'Mar', index: 98 },
    { month: 'Apr', index: 102 },
    { month: 'May', index: 105 },
    { month: 'Jun', index: 108 },
    { month: 'Jul', index: 110 },
    { month: 'Aug', index: 107 },
    { month: 'Sep', index: 103 },
    { month: 'Oct', index: 106 },
    { month: 'Nov', index: 118 },
    { month: 'Dec', index: 125 }
  ];

  const priceDistribution = [
    { range: '$0-25', count: products.filter(p => p.price < 25).length },
    { range: '$25-50', count: products.filter(p => p.price >= 25 && p.price < 50).length },
    { range: '$50-100', count: products.filter(p => p.price >= 50 && p.price < 100).length },
    { range: '$100-200', count: products.filter(p => p.price >= 100 && p.price < 200).length },
    { range: '$200+', count: products.filter(p => p.price >= 200).length },
  ];

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#8b5cf6",
    },
    sales: {
      label: "Sales",
      color: "#10b981",
    },
    index: {
      label: "Index",
      color: "#8b5cf6",
    },
    count: {
      label: "Products",
      color: "#8b5cf6",
    },
  };

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Market Growth</p>
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {insights.growthRate > 0 ? '+' : ''}{insights.growthRate}%
            </h3>
          </header>
          <div className="p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              vs. {timeRange === '30d' ? 'last month' : timeRange === '90d' ? 'last quarter' : 'last year'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Monthly Revenue</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              ${formatNumberWithCommas(insights.avgMonthlyRevenue)}
            </h3>
          </header>
          <div className="p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Based on {timeRange === '30d' ? '1 month' : timeRange === '90d' ? '3 months' : '12 months'} avg
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {insights.topCategory}
            </h3>
          </header>
          <div className="p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Most products in this category
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Market Concentration</p>
              <Globe className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {insights.marketConcentration}%
            </h3>
          </header>
          <div className="p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Top 5 products' share
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Market Trends</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  timeRange === '30d'
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  timeRange === '90d'
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                90D
              </button>
              <button
                onClick={() => setTimeRange('1y')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  timeRange === '1y'
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                1Y
              </button>
            </div>
          </div>
        </header>
        <div className="p-5">
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-revenue)" 
                strokeWidth={2}
                name="Revenue ($)"
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--color-sales)" 
                strokeWidth={2}
                name="Sales"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      {/* Seasonal Analysis & Price Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Seasonal Index</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              100 = Average, Higher values indicate peak seasons
            </p>
          </header>
          <div className="p-5">
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="index" 
                  stroke="var(--color-index)"
                  fill="var(--color-index)"
                  fillOpacity={0.3}
                  name="Seasonal Index"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Price Distribution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Product count by price range</p>
          </header>
          <div className="p-5">
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={priceDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" name="Products" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Market Insights</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Key metrics and trends for "{keywords}"</p>
        </header>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Growth Trajectory</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {insights.growthRate > 0 ? 'Positive' : 'Negative'} growth trend
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Best Season</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">November - December</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Market Structure</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {insights.marketConcentration > 70 ? 'Concentrated' : 'Fragmented'} market
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenue Potential</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    ${formatNumberWithCommas(insights.avgMonthlyRevenue * 12)}/year
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}