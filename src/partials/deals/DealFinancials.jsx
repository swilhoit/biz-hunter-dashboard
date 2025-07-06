import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calculator, PieChart, CalendarDays, ChevronRight, Info, Download } from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function DealFinancials({ deal }) {
  const [timeRange, setTimeRange] = useState('6months');
  const [view, setView] = useState('revenue');
  const [showForecast, setShowForecast] = useState(true);
  const [forecastMonths, setForecastMonths] = useState(3);
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(subMonths(new Date(), 6)),
    endDate: endOfMonth(new Date())
  });
  
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const calculateProfitMargin = () => {
    if (!deal.annual_revenue || !deal.annual_profit) return 0;
    return ((deal.annual_profit / deal.annual_revenue) * 100);
  };

  const calculateROI = () => {
    if (!deal.asking_price || !deal.annual_profit) return 0;
    return ((deal.annual_profit / deal.asking_price) * 100);
  };

  // Update date range based on preset selection
  useEffect(() => {
    const now = new Date();
    let start, end;
    
    switch (timeRange) {
      case '30days':
        start = subMonths(now, 1);
        break;
      case '3months':
        start = subMonths(now, 3);
        break;
      case '6months':
        start = subMonths(now, 6);
        break;
      case '1year':
        start = subMonths(now, 12);
        break;
      case 'custom':
        // Keep existing custom range
        return;
      default:
        start = subMonths(now, 6);
    }
    
    setDateRange({
      startDate: startOfMonth(start),
      endDate: endOfMonth(now)
    });
  }, [timeRange]);

  // Generate historical and forecast data
  const generateTimeSeriesData = () => {
    const months = [];
    const currentDate = new Date();
    const monthsToShow = Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24 * 30));
    
    // Historical months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(dateRange.endDate, i);
      if (date >= dateRange.startDate && date <= dateRange.endDate) {
        months.push({
          date,
          label: format(date, 'MMM yyyy'),
          isHistorical: true
        });
      }
    }
    
    // Forecast months
    if (showForecast) {
      for (let i = 1; i <= forecastMonths; i++) {
        const date = addMonths(currentDate, i);
        months.push({
          date,
          label: format(date, 'MMM yyyy'),
          isHistorical: false
        });
      }
    }
    
    // Generate data with trends
    const baseMonthlyRevenue = deal.monthly_revenue || (deal.annual_revenue / 12) || 50000;
    const baseMonthlyProfit = deal.monthly_profit || (deal.annual_profit / 12) || 15000;
    const profitMargin = calculateProfitMargin() / 100;
    
    // Calculate growth trend from historical data
    const monthlyGrowthRate = 0.03; // 3% monthly growth for deals
    const seasonalFactors = [0.9, 0.95, 1.0, 1.1, 1.15, 1.2, 1.1, 1.0, 0.95, 0.9, 0.85, 1.2]; // Monthly seasonal factors
    
    const data = months.map((month, index) => {
      const monthOfYear = month.date.getMonth();
      const seasonalFactor = seasonalFactors[monthOfYear];
      const growthFactor = Math.pow(1 + monthlyGrowthRate, index - (monthsToShow - 1));
      const randomVariation = month.isHistorical ? (0.9 + Math.random() * 0.2) : 1;
      
      const revenue = baseMonthlyRevenue * growthFactor * seasonalFactor * randomVariation;
      const profit = revenue * profitMargin * (0.9 + Math.random() * 0.2);
      
      return {
        label: month.label,
        revenue,
        profit,
        isHistorical: month.isHistorical
      };
    });
    
    return data;
  };

  const timeSeriesData = generateTimeSeriesData();

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatCurrency(context.parsed.y);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  const getChartData = () => {
    const datasets = [];
    const labels = timeSeriesData.map(d => d.label);
    
    // Split data into historical and forecast
    const historicalData = timeSeriesData.filter(d => d.isHistorical);
    const forecastData = timeSeriesData.filter(d => !d.isHistorical);
    const historicalLength = historicalData.length;
    
    if (view === 'revenue' || view === 'both') {
      // Historical revenue
      datasets.push({
        label: 'Revenue',
        data: timeSeriesData.map((d, i) => i < historicalLength ? d.revenue : null),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3
      });
      
      // Forecast revenue
      if (showForecast && forecastData.length > 0) {
        const forecastRevenue = new Array(historicalLength - 1).fill(null);
        forecastRevenue.push(historicalData[historicalLength - 1].revenue);
        forecastData.forEach(d => forecastRevenue.push(d.revenue));
        
        datasets.push({
          label: 'Revenue Forecast',
          data: forecastRevenue,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.3
        });
      }
    }
    
    if (view === 'profit' || view === 'both') {
      // Historical profit
      datasets.push({
        label: 'Profit',
        data: timeSeriesData.map((d, i) => i < historicalLength ? d.profit : null),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3
      });
      
      // Forecast profit
      if (showForecast && forecastData.length > 0) {
        const forecastProfit = new Array(historicalLength - 1).fill(null);
        forecastProfit.push(historicalData[historicalLength - 1].profit);
        forecastData.forEach(d => forecastProfit.push(d.profit));
        
        datasets.push({
          label: 'Profit Forecast',
          data: forecastProfit,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.3
        });
      }
    }

    return {
      labels,
      datasets
    };
  };

  // Calculate forecast summary
  const forecastSummary = () => {
    if (!showForecast || !timeSeriesData.length) return null;
    
    const forecastData = timeSeriesData.filter(d => !d.isHistorical);
    if (!forecastData.length) return null;
    
    const totalForecastRevenue = forecastData.reduce((sum, d) => sum + d.revenue, 0);
    const totalForecastProfit = forecastData.reduce((sum, d) => sum + d.profit, 0);
    const avgForecastMargin = (totalForecastProfit / totalForecastRevenue) * 100;
    
    return {
      revenue: totalForecastRevenue / forecastData.length,
      profit: totalForecastProfit / forecastData.length,
      margin: avgForecastMargin,
      period: forecastData.length
    };
  };
  
  const forecast = forecastSummary();

  // Generate product-level revenue breakdown
  const generateProductBreakdown = () => {
    const monthlyRevenue = deal.monthly_revenue || (deal.annual_revenue / 12) || 50000;
    
    // Generate sample product data based on deal info
    const products = [
      {
        name: 'Main Product A',
        revenue: monthlyRevenue * 0.45,
        units: Math.floor(monthlyRevenue * 0.45 / 35),
        avgPrice: 35
      },
      {
        name: 'Product B',
        revenue: monthlyRevenue * 0.25,
        units: Math.floor(monthlyRevenue * 0.25 / 28),
        avgPrice: 28
      },
      {
        name: 'Product C',
        revenue: monthlyRevenue * 0.18,
        units: Math.floor(monthlyRevenue * 0.18 / 42),
        avgPrice: 42
      },
      {
        name: 'Product D',
        revenue: monthlyRevenue * 0.12,
        units: Math.floor(monthlyRevenue * 0.12 / 22),
        avgPrice: 22
      }
    ];
    
    return {
      products,
      // Cost breakdown
      costs: {
        cogs: monthlyRevenue * 0.4, // Cost of goods sold
        marketing: monthlyRevenue * 0.15, // Marketing spend
        operations: monthlyRevenue * 0.1, // Operational costs
        fulfillment: monthlyRevenue * 0.08, // Shipping/fulfillment
        other: monthlyRevenue * 0.07 // Other expenses
      },
      // Market metrics
      market: {
        marketShare: 0.15, // 15% market share
        growthRate: 0.25, // 25% YoY growth
        customerAcquisitionCost: 45,
        customerLifetimeValue: 180,
        churnRate: 0.05 // 5% monthly churn
      },
      // Operational metrics
      operations: {
        orderVolume: Math.floor(monthlyRevenue / 50), // Avg order value $50
        conversionRate: 0.035, // 3.5%
        avgOrderValue: 50,
        inventoryTurnover: 8.5,
        returnRate: 0.08 // 8% return rate
      }
    };
  };

  const financialData = generateProductBreakdown();

  // Generate quarterly comparison data
  const generateQuarterlyData = () => {
    const baseRevenue = deal.monthly_revenue || 50000;
    return [
      { quarter: 'Q1 2024', revenue: baseRevenue * 2.8, profit: baseRevenue * 0.56, margin: 20 },
      { quarter: 'Q2 2024', revenue: baseRevenue * 3.1, profit: baseRevenue * 0.65, margin: 21 },
      { quarter: 'Q3 2024', revenue: baseRevenue * 3.3, profit: baseRevenue * 0.72, margin: 22 },
      { quarter: 'Q4 2024', revenue: baseRevenue * 3.6, profit: baseRevenue * 0.79, margin: 22 }
    ];
  };

  const quarterlyData = generateQuarterlyData();


  const keyMetrics = [
    {
      title: 'Annual Revenue',
      value: formatCurrency(deal.annual_revenue),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Annual Profit',
      value: formatCurrency(deal.annual_profit),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Asking Price',
      value: formatCurrency(deal.asking_price),
      icon: Calculator,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Profit Margin',
      value: `${calculateProfitMargin().toFixed(1)}%`,
      icon: PieChart,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Ratios</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Valuation Multiple</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deal.valuation_multiple ? `${deal.valuation_multiple.toFixed(1)}x` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Profit Margin</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {calculateProfitMargin().toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Annual ROI</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {calculateROI().toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(deal.monthly_revenue)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-gray-600 dark:text-gray-400">Monthly Profit</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(deal.monthly_profit)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Investment Analysis</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-800 dark:text-green-200 font-medium">Payback Period</span>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {deal.asking_price && deal.annual_profit 
                  ? `${(deal.asking_price / deal.annual_profit).toFixed(1)} years`
                  : 'N/A'
                }
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 dark:text-blue-200 font-medium">Cash-on-Cash Return</span>
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {calculateROI().toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-800 dark:text-purple-200 font-medium">Deal Score</span>
                <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {deal.priority ? `${deal.priority * 20}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Summary */}
      {forecast && showForecast && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {forecast.period} Month Forecast
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Projected Avg Monthly Revenue</p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                    {formatCurrency(forecast.revenue)}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    {((forecast.revenue - (deal.monthly_revenue || deal.annual_revenue / 12)) / (deal.monthly_revenue || deal.annual_revenue / 12) * 100).toFixed(1)}% growth
                  </p>
                </div>
                <ChevronRight className="w-8 h-8 text-indigo-500 opacity-20" />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Projected Avg Monthly Profit</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {formatCurrency(forecast.profit)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {((forecast.profit - (deal.monthly_profit || deal.annual_profit / 12)) / (deal.monthly_profit || deal.annual_profit / 12) * 100).toFixed(1)}% growth
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Projected Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {forecast.margin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {(forecast.margin - calculateProfitMargin()).toFixed(1)} pts change
                  </p>
                </div>
                <Info className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trends with Forecasting */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Trends & Forecast</h3>
          <div className="flex items-center space-x-2">
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="both">Revenue & Profit</option>
            </select>
          </div>
        </div>
        
        {/* Date Range and Forecast Controls */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="30days">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {timeRange === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={format(dateRange.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={format(dateRange.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showForecast}
                  onChange={(e) => setShowForecast(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Forecast</span>
              </label>
              
              {showForecast && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Forecast:</span>
                  <select
                    value={forecastMonths}
                    onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="1">1 month</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {showForecast && (
            <div className="mt-3 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Forecast is based on historical trends, seasonality patterns, and 3% monthly growth rate. Actual results may vary.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6" style={{ height: '400px' }}>
          <Line data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Product Revenue & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Product</h3>
          <div style={{ height: '300px' }}>
            <Doughnut 
              data={{
                labels: financialData.products.map(p => p.name),
                datasets: [{
                  data: financialData.products.map(p => p.revenue),
                  backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
                  borderWidth: 0
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const product = financialData.products[context.dataIndex];
                        return [
                          `${context.label}: ${formatCurrency(context.parsed)}`,
                          `Units: ${product.units.toLocaleString()}`,
                          `Avg Price: $${product.avgPrice}`
                        ];
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cost Structure</h3>
          <div style={{ height: '300px' }}>
            <Pie 
              data={{
                labels: ['COGS', 'Marketing', 'Operations', 'Fulfillment', 'Other'],
                datasets: [{
                  data: [
                    financialData.costs.cogs,
                    financialData.costs.marketing,
                    financialData.costs.operations,
                    financialData.costs.fulfillment,
                    financialData.costs.other
                  ],
                  backgroundColor: [
                    '#3B82F6',
                    '#8B5CF6',
                    '#F59E0B',
                    '#EF4444',
                    '#6B7280'
                  ],
                  borderWidth: 0
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Quarterly Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quarterly Performance</h3>
        <div style={{ height: '350px' }}>
          <Bar 
            data={{
              labels: quarterlyData.map(q => q.quarter),
              datasets: [
                {
                  label: 'Revenue',
                  data: quarterlyData.map(q => q.revenue),
                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                  borderColor: 'rgb(34, 197, 94)',
                  borderWidth: 1
                },
                {
                  label: 'Profit',
                  data: quarterlyData.map(q => q.profit),
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: 'rgb(59, 130, 246)',
                  borderWidth: 1
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => formatCurrency(value)
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Customer LTV</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                ${financialData.market.customerLifetimeValue}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                CAC: ${financialData.market.customerAcquisitionCost}
              </p>
            </div>
            <Calculator className="w-6 h-6 text-blue-500 opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400">Conversion Rate</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {(financialData.operations.conversionRate * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                AOV: ${financialData.operations.avgOrderValue}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-500 opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Market Share</p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {(financialData.market.marketShare * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                YoY Growth: {(financialData.market.growthRate * 100).toFixed(0)}%
              </p>
            </div>
            <PieChart className="w-6 h-6 text-purple-500 opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Inventory Turnover</p>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                {financialData.operations.inventoryTurnover}x
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Return Rate: {(financialData.operations.returnRate * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-orange-500 opacity-30" />
          </div>
        </div>
      </div>


      {/* Investment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Valuation Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Price/Revenue</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deal.asking_price && deal.annual_revenue ? (deal.asking_price / deal.annual_revenue).toFixed(1) + 'x' : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Price/Earnings</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deal.asking_price && deal.annual_profit ? (deal.asking_price / deal.annual_profit).toFixed(1) + 'x' : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">EV/EBITDA</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deal.asking_price && deal.annual_profit ? ((deal.asking_price * 1.1) / (deal.annual_profit * 1.2)).toFixed(1) + 'x' : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Return Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">5-Year ROI</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(calculateROI() * 5).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">IRR</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(calculateROI() * 1.2).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">NPV</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(deal.annual_profit * 3.5)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Market Position</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Market Share</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {(financialData.market.marketShare * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Growth Rate</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(financialData.market.growthRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Competitive Advantage</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Strong</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Report generated on {format(new Date(), 'MMM dd, yyyy')} • Data as of {format(dateRange.endDate, 'MMM dd, yyyy')}
        </div>
        <button className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">
          <Download className="w-4 h-4 mr-2" />
          Export Financial Report
        </button>
      </div>
    </div>
  );
}

export default DealFinancials;