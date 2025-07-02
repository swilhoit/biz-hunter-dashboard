import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BarChart from '../../charts/BarChart01';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';

function ComparisonChart({ selectedDeals }) {
  const [chartType, setChartType] = useState('revenue');
  const [timeframe, setTimeframe] = useState('monthly');
  
  const dealsData = {
    'deal-1': {
      name: 'Kitchen Gadgets Pro',
      revenue: [180, 195, 210, 225, 240, 235, 250, 265, 280, 295, 310, 325],
      profit: [58, 62, 67, 72, 77, 75, 80, 85, 90, 95, 99, 104],
      units: [2400, 2600, 2800, 3000, 3200, 3100, 3300, 3500, 3700, 3900, 4100, 4300],
      color: tailwindConfig().theme.colors.violet[500]
    },
    'deal-2': {
      name: 'SmartHome Essentials',
      revenue: [220, 240, 260, 285, 310, 295, 315, 340, 365, 380, 400, 425],
      profit: [88, 96, 104, 114, 124, 118, 126, 136, 146, 152, 160, 170],
      units: [2900, 3200, 3500, 3800, 4100, 3900, 4200, 4500, 4800, 5000, 5300, 5600],
      color: tailwindConfig().theme.colors.blue[500]
    },
    'deal-3': {
      name: 'Pet Supplies Direct',
      revenue: [120, 135, 145, 160, 175, 165, 180, 195, 210, 225, 240, 255],
      profit: [30, 34, 36, 40, 44, 41, 45, 49, 53, 56, 60, 64],
      units: [1800, 2000, 2200, 2400, 2600, 2500, 2700, 2900, 3100, 3300, 3500, 3700],
      color: tailwindConfig().theme.colors.green[500]
    },
    'deal-4': {
      name: 'Beauty Essentials',
      revenue: [75, 82, 88, 95, 102, 98, 105, 112, 118, 125, 132, 140],
      profit: [19, 21, 22, 24, 26, 25, 26, 28, 30, 31, 33, 35],
      units: [1200, 1300, 1400, 1500, 1600, 1550, 1650, 1750, 1850, 1950, 2050, 2150],
      color: tailwindConfig().theme.colors.yellow[500]
    },
    'deal-5': {
      name: 'Outdoor Adventure Co',
      revenue: [280, 305, 330, 360, 390, 375, 405, 435, 465, 495, 525, 560],
      profit: [84, 92, 99, 108, 117, 113, 122, 131, 140, 149, 158, 168],
      units: [3200, 3500, 3800, 4100, 4400, 4200, 4500, 4800, 5100, 5400, 5700, 6000],
      color: tailwindConfig().theme.colors.red[500]
    }
  };
  
  const labels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const getChartData = () => {
    const datasets = selectedDeals.map(dealId => {
      const deal = dealsData[dealId];
      if (!deal) return null;
      
      const data = deal[chartType] || [];
      
      if (chartType === 'revenue' || chartType === 'profit') {
        return {
          label: deal.name,
          data: data,
          fill: chartType === 'revenue',
          backgroundColor: chartType === 'revenue' ? function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            return chartAreaGradient(ctx, chartArea, [
              { stop: 0, color: `rgba(${hexToRGB(deal.color)}, 0)` },
              { stop: 1, color: `rgba(${hexToRGB(deal.color)}, 0.2)` }
            ]);
          } : deal.color,
          borderColor: deal.color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: deal.color,
          pointHoverBackgroundColor: deal.color,
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          clip: 20,
          tension: 0.2,
        };
      } else {
        // For units (bar chart)
        return {
          label: deal.name,
          data: data,
          backgroundColor: deal.color,
          hoverBackgroundColor: deal.color,
          borderRadius: 4,
        };
      }
    }).filter(Boolean);
    
    return {
      labels,
      datasets
    };
  };
  
  const getChartComponent = () => {
    const data = getChartData();
    
    if (chartType === 'units') {
      return <BarChart data={data} width={600} height={300} />;
    } else {
      return <LineChart data={data} width={600} height={300} />;
    }
  };
  
  const getCurrentTotal = () => {
    return selectedDeals.reduce((total, dealId) => {
      const deal = dealsData[dealId];
      if (!deal) return total;
      
      const data = deal[chartType];
      const lastValue = data[data.length - 1];
      return total + lastValue;
    }, 0);
  };
  
  const getGrowthRate = () => {
    const totalGrowth = selectedDeals.reduce((total, dealId) => {
      const deal = dealsData[dealId];
      if (!deal) return total;
      
      const data = deal[chartType];
      const firstValue = data[0];
      const lastValue = data[data.length - 1];
      const growth = ((lastValue - firstValue) / firstValue) * 100;
      return total + growth;
    }, 0);
    
    return selectedDeals.length > 0 ? (totalGrowth / selectedDeals.length).toFixed(1) : 0;
  };
  
  const formatValue = (value) => {
    if (chartType === 'revenue' || chartType === 'profit') {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return value.toLocaleString();
    }
  };
  
  const getMetricLabel = () => {
    switch (chartType) {
      case 'revenue': return 'Revenue';
      case 'profit': return 'Profit';
      case 'units': return 'Units Sold';
      default: return 'Metric';
    }
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Deal Performance Comparison</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Chart
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals/analytics">
                Detailed Analytics
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* Chart Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('revenue')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                chartType === 'revenue'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setChartType('profit')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                chartType === 'profit'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Profit
            </button>
            <button
              onClick={() => setChartType('units')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                chartType === 'units'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Units
            </button>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </header>
      
      <div className="p-5">
        {selectedDeals.length > 0 ? (
          <div>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {formatValue(getCurrentTotal())}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total {getMetricLabel()}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  +{getGrowthRate()}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Growth Rate
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedDeals.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Deals Selected
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-80">
              {getChartComponent()}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {selectedDeals.map(dealId => {
                const deal = dealsData[dealId];
                if (!deal) return null;
                
                return (
                  <div key={dealId} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: deal.color }}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {deal.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-gray-500 dark:text-gray-400">
              Select deals to view performance comparison
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComparisonChart;