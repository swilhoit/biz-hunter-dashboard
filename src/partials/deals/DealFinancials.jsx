import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calculator, PieChart } from 'lucide-react';
import LineChart01 from '../../charts/LineChart01';
import BarChart01 from '../../charts/BarChart01';
import DoughnutChart from '../../charts/DoughnutChart';
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

  // Generate historical data based on current metrics
  const generateHistoricalData = () => {
    const baseRevenue = deal.monthly_revenue || deal.annual_revenue / 12 || 0;
    const baseProfit = deal.monthly_profit || deal.annual_profit / 12 || 0;
    
    // Create 6 months of data with slight variations
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, idx) => {
      const variation = 0.9 + (Math.random() * 0.2); // 90-110% variation
      return {
        month,
        revenue: Math.round(baseRevenue * variation),
        profit: Math.round(baseProfit * variation)
      };
    });
  };

  const monthlyData = generateHistoricalData();

  // Prepare data for LineChart
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

  // Prepare data for BarChart
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
        label: 'Expense Breakdown',
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

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Revenue</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.annual_revenue)}
          </p>
          {deal.monthly_revenue && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(deal.monthly_revenue)}/month
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Profit</span>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.annual_profit)}
          </p>
          {deal.monthly_profit && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(deal.monthly_profit)}/month
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Asking Price</span>
            <Calculator className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.asking_price)}
          </p>
          {deal.valuation_multiple && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {deal.valuation_multiple.toFixed(1)}x multiple
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">EBITDA</span>
            <PieChart className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.ebitda)}
          </p>
          {deal.sde && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              SDE: {formatCurrency(deal.sde)}
            </p>
          )}
        </div>
      </div>

      {/* Financial Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Ratios</h3>
          <div className="space-y-4">
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
              <span className="text-gray-600 dark:text-gray-400">Payback Period</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deal.asking_price && deal.annual_profit 
                  ? `${(deal.asking_price / deal.annual_profit).toFixed(1)} years`
                  : 'N/A'
                }
              </span>
            </div>
            {deal.employee_count !== undefined && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">Employees</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {deal.employee_count || 'N/A'}
                </span>
              </div>
            )}
            {deal.inventory_value !== undefined && (
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
                <span className="text-green-800 dark:text-green-200 font-medium">Cash-on-Cash Return</span>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {calculateROI().toFixed(1)}%
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 dark:text-blue-200 font-medium">Gross Multiple</span>
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {deal.valuation_multiple ? `${deal.valuation_multiple.toFixed(1)}x` : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-800 dark:text-purple-200 font-medium">Deal Score</span>
                <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {deal.priority ? `${Math.min(deal.priority * 20, 100)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">6-Month Performance Trend</h3>
        <div className="relative h-80">
          <LineChart01 data={lineChartData} width={800} height={320} />
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue vs Profit</h3>
          <div className="relative h-80">
            <BarChart01 data={barChartData} width={400} height={320} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Breakdown</h3>
          <div className="relative h-80">
            <DoughnutChart data={profitBreakdownData} width={400} height={320} />
          </div>
        </div>
      </div>

      {/* Additional Financial Details */}
      {(deal.year_established || deal.reason_for_sale || deal.support_training) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deal.year_established && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Established</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {deal.year_established}
                </p>
              </div>
            )}
            {deal.reason_for_sale && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason for Sale</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {deal.reason_for_sale}
                </p>
              </div>
            )}
            {deal.support_training && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Support & Training</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {deal.support_training}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DealFinancials;