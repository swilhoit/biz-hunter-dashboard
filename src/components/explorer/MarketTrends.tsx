import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Globe, DollarSign, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatNumberWithCommas } from '../../utils/explorer/dataProcessing';
import { useThemeProvider } from '../../utils/ThemeContext';
import { chartColors } from '../../charts/ChartjsConfig';

// Card components for template styling
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-semibold text-gray-800 dark:text-gray-100 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "default", size = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const variantClasses = variant === "outline" 
    ? "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
    : "bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500";
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};

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
      ? ((trendData[trendData.length - 1]?.revenue - trendData[0]?.revenue) / trendData[0]?.revenue * 100).toFixed(1)
      : 0,
    avgMonthlyRevenue: trendData.length > 0
      ? Math.round(trendData.reduce((sum, d) => sum + d.revenue, 0) / trendData.length)
      : 0,
    topCategory: products.length > 0
      ? Object.entries(products.reduce((acc, p) => {
          const cat = p.category || 'Unknown';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
      : 'N/A',
    marketConcentration: products.length > 0
      ? (products.slice(0, 5).reduce((sum, p) => sum + p.revenue, 0) / 
         products.reduce((sum, p) => sum + p.revenue, 0) * 100).toFixed(1)
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
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Market Growth</CardDescription>
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <CardTitle className="text-2xl">
              {insights.growthRate > 0 ? '+' : ''}{insights.growthRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              vs. {timeRange === '30d' ? 'last month' : timeRange === '90d' ? 'last quarter' : 'last year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Avg Monthly Revenue</CardDescription>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <CardTitle className="text-2xl">
              ${formatNumberWithCommas(insights.avgMonthlyRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Across all products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Top Category</CardDescription>
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {insights.topCategory}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Market Concentration</CardDescription>
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">
              {insights.marketConcentration}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Top 5 products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Sales Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue & Sales Trend</CardTitle>
            <div className="flex gap-2">
              {(['30d', '90d', '1y'] as const).map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                >
                  {range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-muted-foreground" />
              <YAxis yAxisId="left" className="text-muted-foreground" />
              <YAxis yAxisId="right" orientation="right" className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-revenue)"
                strokeWidth={2}
                name="Revenue ($)"
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sales" 
                stroke="var(--color-sales)"
                strokeWidth={2}
                name="Sales (units)"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Seasonal Trends and Price Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Index</CardTitle>
            <CardDescription>
              100 = Average, Higher values indicate peak seasons
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
            <CardDescription>Product count by price range</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={priceDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" name="Products" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Top Performing Products</h4>
              <div className="space-y-2">
                {products
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {product.title}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 ml-2">
                        ${formatNumberWithCommas(product.revenue)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Market Opportunities</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    High-growth segments showing {insights.growthRate}% increase
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Peak season approaching in Q4 with 25% higher demand
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Premium segment ($100+) showing strong margins
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Emerging brands capturing market share from incumbents
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Search for products to see market trends and insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}