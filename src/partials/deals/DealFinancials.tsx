import React from 'react';
import { Deal } from '../../types/deal';
import { DollarSign, TrendingUp, TrendingDown, Calculator, PieChart } from 'lucide-react';
import LineChart01 from '../../charts/LineChart01';
import BarChart01 from '../../charts/BarChart01';
import DoughnutChart from '../../charts/DoughnutChart';
import { chartColors } from '../../charts/ChartjsConfig';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';

interface DealFinancialsProps {
  deal: Deal;
}

function DealFinancials({ deal }: DealFinancialsProps) {
  const formatCurrency = (amount?: number) => {
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

  // Prepare data for Chart.js LineChart
  const lineChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.map(d => d.revenue),
        borderColor: tailwindConfig().theme.colors.emerald[500],
        backgroundColor: `rgba(${hexToRGB(tailwindConfig().theme.colors.emerald[500])}, 0.08)`,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: tailwindConfig().theme.colors.emerald[500],
        fill: true,
      },
      {
        label: 'Profit',
        data: monthlyData.map(d => d.profit),
        borderColor: tailwindConfig().theme.colors.blue[500],
        backgroundColor: `rgba(${hexToRGB(tailwindConfig().theme.colors.blue[500])}, 0.08)`,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: tailwindConfig().theme.colors.blue[500],
        fill: true,
      },
    ],
  };

  // Prepare data for Chart.js BarChart
  const barChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.map(d => d.revenue),
        backgroundColor: tailwindConfig().theme.colors.emerald[500],
        hoverBackgroundColor: tailwindConfig().theme.colors.emerald[600],
        borderRadius: 4,
        categoryPercentage: 0.66,
      },
      {
        label: 'Profit',
        data: monthlyData.map(d => d.profit),
        backgroundColor: tailwindConfig().theme.colors.blue[500],
        hoverBackgroundColor: tailwindConfig().theme.colors.blue[600],
        borderRadius: 4,
        categoryPercentage: 0.66,
      },
    ],
  };

  // Prepare data for profit breakdown doughnut chart
  const profitBreakdownData = {
    labels: ['Net Profit', 'Operating Costs', 'Marketing', 'Inventory'],
    datasets: [
      {
        label: 'Profit Breakdown',
        data: [
          deal.annual_profit || 0,
          (deal.annual_revenue || 0) * 0.4, // 40% operating costs
          (deal.annual_revenue || 0) * 0.15, // 15% marketing
          (deal.annual_revenue || 0) * 0.25, // 25% inventory
        ],
        backgroundColor: [
          tailwindConfig().theme.colors.emerald[500],
          tailwindConfig().theme.colors.amber[500],
          tailwindConfig().theme.colors.blue[500],
          tailwindConfig().theme.colors.purple[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.emerald[600],
          tailwindConfig().theme.colors.amber[600],
          tailwindConfig().theme.colors.blue[600],
          tailwindConfig().theme.colors.purple[600],
        ],
        borderWidth: 0,
      },
    ],
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
      title: 'EBITDA',
      value: formatCurrency(deal.ebitda),
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'SDE',
      value: formatCurrency(deal.sde),
      icon: Calculator,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            {deal.ebitda && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">EBITDA</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.ebitda)}
                </span>
              </div>
            )}
            {deal.sde && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">SDE</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.sde)}
                </span>
              </div>
            )}
            {deal.employee_count && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">Employees</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {deal.employee_count}
                </span>
              </div>
            )}
            {deal.inventory_value && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">Inventory Value</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(deal.inventory_value)}
                </span>
              </div>
            )}
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
        <div className="relative">
          <LineChart01 data={lineChartData} width={800} height={320} />
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue vs Profit</h3>
          <div className="relative">
            <BarChart01 data={barChartData} width={400} height={320} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Breakdown</h3>
          <div className="relative">
            <DoughnutChart data={profitBreakdownData} width={400} height={320} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealFinancials;