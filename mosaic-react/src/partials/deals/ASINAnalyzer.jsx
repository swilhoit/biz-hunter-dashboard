import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import { tailwindConfig, hexToRGB } from '../../utils/Utils';

function ASINAnalyzer() {
  const [asinInput, setAsinInput] = useState('');
  const [analyzedASIN, setAnalyzedASIN] = useState('B087NWQT2M');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const asinData = {
    asin: 'B087NWQT2M',
    title: 'Smart Kitchen Scale with App Integration',
    category: 'Home & Kitchen',
    bsr: 1250,
    rating: 4.6,
    reviews: 12847,
    monthlyRevenue: '$180,000',
    unitsSold: 2400,
    avgPrice: '$75.00',
    fbaFees: '$12.50',
    profit: '$28.75',
    margin: '38.3%',
    competition: 'Medium',
    trend: 'Growing',
    seasonality: 'Q4 Peak'
  };
  
  const revenueData = {
    labels: [
      '6 months ago', '5 months ago', '4 months ago', '3 months ago', '2 months ago', 'Last month', 'This month'
    ],
    datasets: [
      {
        data: [120000, 135000, 150000, 165000, 172000, 180000, 185000],
        fill: true,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.violet[500])}, 0)` },
            { stop: 1, color: `rgba(${hexToRGB(tailwindConfig().theme.colors.violet[500])}, 0.2)` }
          ]);
        },            
        borderColor: tailwindConfig().theme.colors.violet[500],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: tailwindConfig().theme.colors.violet[500],
        pointHoverBackgroundColor: tailwindConfig().theme.colors.violet[500],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };
  
  const handleAnalyze = () => {
    if (!asinInput.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalyzedASIN(asinInput);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">ASIN Analyzer</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Analysis
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Track ASIN
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* ASIN Input */}
        <div className="flex space-x-2 mt-4">
          <input
            type="text"
            placeholder="Enter ASIN (e.g., B087NWQT2M)"
            value={asinInput}
            onChange={(e) => setAsinInput(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !asinInput.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 disabled:bg-gray-400 rounded-lg transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </header>
      
      <div className="p-5">
        {/* ASIN Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-800 dark:text-gray-100">{asinData.title}</div>
            <span className="px-2 py-1 text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 rounded">
              {asinData.asin}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{asinData.category}</div>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{asinData.bsr.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">BSR</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{asinData.rating} ★</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{asinData.reviews.toLocaleString()} reviews</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{asinData.monthlyRevenue}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{asinData.margin}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Profit Margin</div>
          </div>
        </div>
        
        {/* Revenue Chart */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Revenue Trend</h3>
          <div className="h-32">
            <LineChart data={revenueData} width={300} height={128} />
          </div>
        </div>
        
        {/* Additional Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Units Sold/Month:</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{asinData.unitsSold.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Price:</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{asinData.avgPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">FBA Fees:</span>
            <span className="text-sm font-medium text-red-600">{asinData.fbaFees}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Profit per Unit:</span>
            <span className="text-sm font-medium text-green-600">{asinData.profit}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Competition:</span>
            <span className={`text-sm font-medium ${
              asinData.competition === 'High' ? 'text-red-600' :
              asinData.competition === 'Medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {asinData.competition}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trend:</span>
            <span className="text-sm font-medium text-green-600">{asinData.trend}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Seasonality:</span>
            <span className="text-sm font-medium text-blue-600">{asinData.seasonality}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ASINAnalyzer;