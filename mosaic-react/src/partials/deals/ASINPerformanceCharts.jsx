import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import BarChart from '../../charts/BarChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';

function ASINPerformanceCharts({ timeframe }) {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  const revenueData = {
    labels: [
      'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'
    ],
    datasets: [
      {
        label: 'Total Revenue',
        data: [345000, 378000, 392000, 401000, 415000, 428000, 445000, 467000],
        fill: true,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.green[500])}, 0)` },
            { stop: 1, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.green[500])}, 0.2)` }
          ]);
        },            
        borderColor: tailwindConfig().theme.colors.green[500],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: tailwindConfig().theme.colors.green[500],
        pointHoverBackgroundColor: tailwindConfig().theme.colors.green[500],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };
  
  const unitsData = {
    labels: [
      'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'
    ],
    datasets: [
      {
        label: 'Units Sold',
        data: [4600, 5040, 5230, 5350, 5540, 5710, 5940, 6230],
        fill: true,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.blue[500])}, 0)` },
            { stop: 1, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.blue[500])}, 0.2)` }
          ]);
        },            
        borderColor: tailwindConfig().theme.colors.blue[500],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: tailwindConfig().theme.colors.blue[500],
        pointHoverBackgroundColor: tailwindConfig().theme.colors.blue[500],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };
  
  const categoryData = {
    labels: ['Home & Kitchen', 'Electronics', 'Pet Supplies', 'Beauty', 'Sports'],
    datasets: [
      {
        label: 'Revenue by Category',
        data: [180000, 160000, 75000, 35000, 17000],
        backgroundColor: [
          tailwindConfig().theme.colors.violet[500],
          tailwindConfig().theme.colors.blue[500],
          tailwindConfig().theme.colors.green[500],
          tailwindConfig().theme.colors.yellow[500],
          tailwindConfig().theme.colors.red[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.violet[600],
          tailwindConfig().theme.colors.blue[600],
          tailwindConfig().theme.colors.green[600],
          tailwindConfig().theme.colors.yellow[600],
          tailwindConfig().theme.colors.red[600],
        ],
        borderRadius: 4,
      },
    ],
  };
  
  const getCurrentData = () => {
    switch (selectedMetric) {
      case 'revenue': return revenueData;
      case 'units': return unitsData;
      case 'category': return categoryData;
      default: return revenueData;
    }
  };
  
  const getChartComponent = () => {
    if (selectedMetric === 'category') {
      return <BarChart data={getCurrentData()} width={600} height={240} />;
    }
    return <LineChart data={getCurrentData()} width={600} height={240} />;
  };

  return (
    <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">ASIN Performance Overview</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Data
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals/analytics">
                Detailed Analytics
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* Metric Selector */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setSelectedMetric('revenue')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedMetric === 'revenue'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Revenue Trend
          </button>
          <button
            onClick={() => setSelectedMetric('units')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedMetric === 'units'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Units Sold
          </button>
          <button
            onClick={() => setSelectedMetric('category')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedMetric === 'category'
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            By Category
          </button>
        </div>
      </header>
      
      <div className="p-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">$467K</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">6,230</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Units Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-600">$75</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">35.2%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Margin</div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-60">
          {getChartComponent()}
        </div>
      </div>
    </div>
  );
}

export default ASINPerformanceCharts;