import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';
import BarChart from '../../charts/BarChart01';
import { tailwindConfig } from '../../utils/Utils';

function CompetitorAnalysis() {
  const [selectedMetric, setSelectedMetric] = useState('market_share');
  
  const competitors = [
    {
      name: 'KitchenPro Solutions',
      marketShare: 22,
      avgRating: 4.5,
      reviewCount: 18500,
      priceRange: '$65-85',
      mainASINs: ['B089QXR4B9', 'B092LP3XYZ'],
      strengths: ['Brand recognition', 'Quality products'],
      weaknesses: ['Higher prices', 'Limited innovation']
    },
    {
      name: 'SmartHome Essentials',
      marketShare: 18,
      avgRating: 4.3,
      reviewCount: 15200,
      priceRange: '$55-75',
      mainASINs: ['B094ABC123', 'B096DEF456'],
      strengths: ['Tech integration', 'Competitive pricing'],
      weaknesses: ['Customer service', 'Product durability']
    },
    {
      name: 'HomeChef Direct',
      marketShare: 15,
      avgRating: 4.2,
      reviewCount: 9800,
      priceRange: '$45-65',
      mainASINs: ['B098GHI789', 'B099JKL012'],
      strengths: ['Low prices', 'Wide variety'],
      weaknesses: ['Quality concerns', 'Poor packaging']
    },
    {
      name: 'Premium Kitchen Co',
      marketShare: 12,
      avgRating: 4.7,
      reviewCount: 7200,
      priceRange: '$85-120',
      mainASINs: ['B101MNO345', 'B103PQR678'],
      strengths: ['Premium quality', 'Excellent support'],
      weaknesses: ['High prices', 'Limited reach']
    }
  ];
  
  const chartData = {
    labels: competitors.map(c => c.name),
    datasets: [
      {
        label: selectedMetric === 'market_share' ? 'Market Share (%)' : 'Avg Rating',
        data: selectedMetric === 'market_share' 
          ? competitors.map(c => c.marketShare)
          : competitors.map(c => c.avgRating),
        backgroundColor: [
          tailwindConfig().theme.colors.violet[500],
          tailwindConfig().theme.colors.blue[500],
          tailwindConfig().theme.colors.green[500],
          tailwindConfig().theme.colors.yellow[500],
        ],
        hoverBackgroundColor: [
          tailwindConfig().theme.colors.violet[600],
          tailwindConfig().theme.colors.blue[600],
          tailwindConfig().theme.colors.green[600],
          tailwindConfig().theme.colors.yellow[600],
        ],
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Competitor Analysis</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Report
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Track Competitors
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* Metric Selector */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setSelectedMetric('market_share')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedMetric === 'market_share'
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Market Share
          </button>
          <button
            onClick={() => setSelectedMetric('rating')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedMetric === 'rating'
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Ratings
          </button>
        </div>
      </header>
      
      <div className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {selectedMetric === 'market_share' ? 'Market Share Distribution' : 'Average Ratings'}
            </h3>
            <div className="h-64">
              <BarChart data={chartData} width={400} height={256} />
            </div>
          </div>
          
          {/* Competitor Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Competitor Overview</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {competitors.map((competitor, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">{competitor.name}</h4>
                    <div className="text-right">
                      <div className="text-sm font-medium text-violet-600">{competitor.marketShare}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Market Share</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Rating: <span className="font-medium text-yellow-600">{competitor.avgRating} ★</span></div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reviews: <span className="font-medium">{competitor.reviewCount.toLocaleString()}</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Price Range:</div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{competitor.priceRange}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-green-600 mb-1">Strengths:</div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {competitor.strengths.map((strength, i) => (
                          <li key={i} className="flex items-center">
                            <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-red-600 mb-1">Weaknesses:</div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {competitor.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-center">
                            <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompetitorAnalysis;