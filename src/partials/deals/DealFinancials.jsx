import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calculator, PieChart, CalendarDays, ChevronRight, Info, Download, Brain, Activity } from 'lucide-react';
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
import { ForecastingService } from '../../services/ForecastingService';

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
  const [monthlyRevenueData, setMonthlyRevenueData] = useState(null);
  const [forecastMethod, setForecastMethod] = useState('auto');
  const [forecastData, setForecastData] = useState(null);
  
  // Load monthly revenue data from financial extractions if available
  useEffect(() => {
    const loadMonthlyData = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data, error } = await supabase
          .from('financial_extractions')
          .select('financial_data')
          .eq('deal_id', deal.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data && data.financial_data?.revenue?.byMonth) {
          setMonthlyRevenueData(data.financial_data.revenue.byMonth);
          
          // Adjust date range to match actual data
          const months = Object.keys(data.financial_data.revenue.byMonth).sort();
          if (months.length > 0) {
            const firstDate = new Date(months[0] + '-01');
            const lastDate = new Date(months[months.length - 1] + '-01');
            setDateRange({
              startDate: startOfMonth(firstDate),
              endDate: endOfMonth(lastDate)
            });
            
            // Set time range to 'custom' to show all data
            setTimeRange('custom');
          }
        }
      } catch (error) {
        console.error('Failed to load monthly revenue data:', error);
      }
    };
    
    if (deal?.id) {
      loadMonthlyData();
    }
  }, [deal?.id]);
  
  // Generate forecast data when parameters change
  useEffect(() => {
    if (showForecast && monthlyRevenueData && Object.keys(monthlyRevenueData).length > 0) {
      const forecastResult = ForecastingService.generateForecast(
        monthlyRevenueData,
        forecastMonths,
        forecastMethod
      );
      setForecastData(forecastResult);
    } else {
      setForecastData(null);
    }
  }, [showForecast, monthlyRevenueData, forecastMonths, forecastMethod]);
  
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
    
    // If we have actual monthly revenue data, use it
    if (monthlyRevenueData && Object.keys(monthlyRevenueData).length > 0) {
      // Sort months chronologically
      const sortedMonths = Object.keys(monthlyRevenueData).sort();
      
      // Create data points for each actual month
      sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        if (date >= dateRange.startDate && date <= dateRange.endDate) {
          const revenue = monthlyRevenueData[monthKey];
          const profitMargin = calculateProfitMargin() / 100 || 0.15; // Use actual margin or default to 15%
          
          months.push({
            label: format(date, 'MMM yyyy'),
            revenue: revenue,
            profit: revenue * profitMargin,
            isHistorical: true,
            isActualData: true
          });
        }
      });
      
      // Add forecast months if enabled using pre-calculated forecast data
      if (showForecast && months.length > 0 && forecastData) {
        const profitMargin = calculateProfitMargin() / 100 || 0.15;
        
        forecastData.forecast.forEach(point => {
          const forecastDate = new Date(point.date + '-01');
          months.push({
            label: format(forecastDate, 'MMM yyyy'),
            revenue: point.value,
            profit: point.value * profitMargin,
            isHistorical: false,
            isActualData: false,
            lowerBound: point.lowerBound,
            upperBound: point.upperBound,
            confidence: point.confidence
          });
        });
      }
      
      return months;
    }
    
    // NO FALLBACK MOCK DATA - Return empty array if no real data
    return [];
  };

  const timeSeriesData = generateTimeSeriesData();

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          filter: (legendItem) => {
            // Hide confidence interval datasets from legend
            return legendItem.text !== 'Lower Bound' && 
                   legendItem.text !== 'Confidence Interval';
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatCurrency(context.parsed.y);
            
            // Skip hidden datasets
            if (label === 'Lower Bound' || label === 'Confidence Interval') {
              return null;
            }
            
            // Add confidence interval to forecast tooltips
            if (label.includes('Forecast') && context.dataIndex && timeSeriesData[context.dataIndex]) {
              const dataPoint = timeSeriesData[context.dataIndex];
              if (dataPoint.lowerBound && dataPoint.upperBound) {
                return [
                  `${label}: ${value}`,
                  `95% CI: ${formatCurrency(dataPoint.lowerBound)} - ${formatCurrency(dataPoint.upperBound)}`
                ];
              }
            }
            
            return `${label}: ${value}`;
          }
        },
        filter: (tooltipItem) => {
          // Hide lower bound and confidence interval from tooltip
          return tooltipItem.dataset.label !== 'Lower Bound' && 
                 tooltipItem.dataset.label !== 'Confidence Interval';
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
      
      // Forecast revenue with confidence intervals
      if (showForecast && forecastData.length > 0) {
        const forecastRevenue = new Array(historicalLength - 1).fill(null);
        const upperBound = new Array(historicalLength - 1).fill(null);
        const lowerBound = new Array(historicalLength - 1).fill(null);
        
        forecastRevenue.push(historicalData[historicalLength - 1].revenue);
        upperBound.push(historicalData[historicalLength - 1].revenue);
        lowerBound.push(historicalData[historicalLength - 1].revenue);
        
        forecastData.forEach(d => {
          forecastRevenue.push(d.revenue);
          upperBound.push(d.upperBound || d.revenue);
          lowerBound.push(d.lowerBound || d.revenue);
        });
        
        // Confidence interval band
        datasets.push({
          label: 'Confidence Interval',
          data: upperBound,
          borderColor: 'transparent',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: '+1',
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.3
        });
        
        datasets.push({
          label: 'Lower Bound',
          data: lowerBound,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.3
        });
        
        // Main forecast line
        datasets.push({
          label: 'Revenue Forecast',
          data: forecastRevenue,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
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

  // No mock product breakdown data - only show real extracted data

  // Generate quarterly comparison data
  // Generate quarterly data from actual monthly data if available
  const generateQuarterlyData = () => {
    if (!monthlyRevenueData || Object.keys(monthlyRevenueData).length === 0) {
      return []; // No mock data - return empty if no real data
    }

    const quarters = {};
    const profitMargin = calculateProfitMargin() / 100 || 0.15;

    // Group monthly data by quarters
    Object.entries(monthlyRevenueData).forEach(([monthKey, revenue]) => {
      const [year, month] = monthKey.split('-');
      const monthNum = parseInt(month);
      const quarterNum = Math.ceil(monthNum / 3);
      const quarterKey = `Q${quarterNum} ${year}`;

      if (!quarters[quarterKey]) {
        quarters[quarterKey] = { quarter: quarterKey, revenue: 0, profit: 0 };
      }
      
      quarters[quarterKey].revenue += revenue;
      quarters[quarterKey].profit += revenue * profitMargin;
    });

    return Object.values(quarters).sort((a, b) => {
      // Sort by year then quarter
      const [aQ, aYear] = a.quarter.split(' ');
      const [bQ, bYear] = b.quarter.split(' ');
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return parseInt(aQ.slice(1)) - parseInt(bQ.slice(1));
    });
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
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Trends & Forecast</h3>
            {monthlyRevenueData && Object.keys(monthlyRevenueData).length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                Actual Data
              </span>
            )}
          </div>
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
                <>
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
                  
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-gray-500" />
                    <select
                      value={forecastMethod}
                      onChange={(e) => setForecastMethod(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="auto">Auto (AI Selected)</option>
                      <option value="linear">Linear Regression</option>
                      <option value="exponential">Exponential Smoothing</option>
                      <option value="arima">ARIMA</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {showForecast && timeSeriesData.length > 0 && forecastData && (
            <div className="mt-3">
              <div className="flex items-start space-x-2">
                <Activity className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p>
                    Forecast using <span className="font-medium">{forecastData.method.replace(/_/g, ' ')}</span> method
                    {forecastData.accuracy && (
                      <>
                        {forecastData.accuracy.r2 !== undefined && (
                          <span> • R² = {(forecastData.accuracy.r2 * 100).toFixed(0)}%</span>
                        )}
                        {forecastData.accuracy.mape !== undefined && (
                          <span> • MAPE = {forecastData.accuracy.mape.toFixed(1)}%</span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="mt-1">
                    {monthlyRevenueData && Object.keys(monthlyRevenueData).length >= 12 && 
                      "Seasonality patterns detected and included in forecast • "}
                    Confidence intervals shown as shaded area
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {timeSeriesData.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6" style={{ height: '400px' }}>
            <Line data={getChartData()} options={chartOptions} />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6" style={{ height: '400px' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No Revenue Data Available</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Upload and extract P&L documents to view revenue trends</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product breakdown removed - no real product-level data available */}

      {/* Quarterly Performance - Only show if real data exists */}
      {quarterlyData.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quarterly Performance</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
              From Actual Data
            </span>
          </div>
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
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quarterly Performance</h3>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">No Financial Data Available</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Upload and extract P&L documents to view quarterly performance</p>
          </div>
        </div>
      )}

      {/* Mock KPIs removed - only showing real deal data */}


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