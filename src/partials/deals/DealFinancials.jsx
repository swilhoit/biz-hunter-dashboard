import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calculator, PieChart } from 'lucide-react';
import LineChart05 from '../../charts/LineChart05';
import BarChart05 from '../../charts/BarChart05';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';

function DealFinancials({ deal }) {
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
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

  // Mock historical data - in real app this would come from API
  const monthlyData = [
    { month: 'Jan', revenue: 380000, profit: 76000 },
    { month: 'Feb', revenue: 395000, profit: 79000 },
    { month: 'Mar', revenue: 410000, profit: 82000 },
    { month: 'Apr', revenue: 385000, profit: 77000 },
    { month: 'May', revenue: 420000, profit: 84000 },
    { month: 'Jun', revenue: 405000, profit: 81000 },
  ];

  // Convert month names to dates for the charts
  const getMonthDate = (monthName) => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
    const currentYear = new Date().getFullYear();
    return `${String(monthIndex + 1).padStart(2, '0')}-01-${currentYear}`;
  };

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

      {/* Historical Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">6-Month Performance Trend</h3>
        <LineChart05 
          data={{
            labels: monthlyData.map(item => getMonthDate(item.month)),
            datasets: [
              {
                label: 'Revenue',
                data: monthlyData.map(item => ({ x: getMonthDate(item.month), y: (item.revenue / deal.annual_revenue * 100) })),
                borderColor: tailwindConfig().theme.colors.green[500],
                backgroundColor: `rgba(${hexToRGB(tailwindConfig().theme.colors.green[500])}, 0.08)`,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
              },
              {
                label: 'Profit',
                data: monthlyData.map(item => ({ x: getMonthDate(item.month), y: (item.profit / deal.annual_profit * 100) })),
                borderColor: tailwindConfig().theme.colors.blue[500],
                backgroundColor: `rgba(${hexToRGB(tailwindConfig().theme.colors.blue[500])}, 0.08)`,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          width={595}
          height={248}
        />
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue vs Profit</h3>
        <BarChart05
          data={{
            labels: monthlyData.map(item => getMonthDate(item.month)),
            datasets: [
              {
                label: 'Revenue',
                data: monthlyData.map(item => ({ x: getMonthDate(item.month), y: item.revenue })),
                backgroundColor: tailwindConfig().theme.colors.green[500],
                hoverBackgroundColor: tailwindConfig().theme.colors.green[600],
                barPercentage: 0.7,
                categoryPercentage: 0.7,
                borderRadius: 4,
              },
              {
                label: 'Profit',
                data: monthlyData.map(item => ({ x: getMonthDate(item.month), y: item.profit })),
                backgroundColor: tailwindConfig().theme.colors.blue[500],
                hoverBackgroundColor: tailwindConfig().theme.colors.blue[600],
                barPercentage: 0.7,
                categoryPercentage: 0.7,
                borderRadius: 4,
              },
            ],
          }}
          width={595}
          height={248}
        />
      </div>
    </div>
  );
}

export default DealFinancials;