import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';

function AIMarketInsights() {
  const [selectedCategory, setSelectedCategory] = useState('Home & Kitchen');
  
  const marketData = {
    'Home & Kitchen': {
      growth: '+18%',
      avgRevenue: '$2.4M',
      avgMultiple: '3.2x',
      competition: 'Medium',
      keyTrends: ['Smart home integration', 'Sustainable materials', 'Multi-functional products'],
      topASINs: [
        { asin: 'B087NWQT2M', title: 'Smart Kitchen Scale', revenue: '$180K/mo', rank: '#1' },
        { asin: 'B089QX4B9N', title: 'Silicone Cooking Set', revenue: '$140K/mo', rank: '#3' },
        { asin: 'B092LP8XYZ', title: 'Air Fryer Accessories', revenue: '$120K/mo', rank: '#5' }
      ],
      riskFactors: ['Seasonal demand fluctuation', 'Supply chain disruptions', 'Patent concerns']
    },
    'Electronics': {
      growth: '+12%',
      avgRevenue: '$3.1M',
      avgMultiple: '4.1x',
      competition: 'High',
      keyTrends: ['Wireless charging', 'USB-C adoption', 'Gaming accessories'],
      topASINs: [
        { asin: 'B091ABC123', title: 'Wireless Charger', revenue: '$220K/mo', rank: '#2' },
        { asin: 'B093DEF456', title: 'Gaming Mouse Pad', revenue: '$160K/mo', rank: '#4' },
        { asin: 'B095GHI789', title: 'Phone Stand', revenue: '$95K/mo', rank: '#8' }
      ],
      riskFactors: ['Rapid tech obsolescence', 'High competition', 'Return rates']
    }
  };

  const categories = Object.keys(marketData);
  const currentData = marketData[selectedCategory];

  return (
    <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">AI Market Insights</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Export Report
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Schedule Analysis
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* Category Selector */}
        <div className="flex space-x-2 mt-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>
      
      <div className="p-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{currentData.growth}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">YoY Growth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentData.avgRevenue}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{currentData.avgMultiple}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Multiple</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              currentData.competition === 'High' ? 'text-red-600' :
              currentData.competition === 'Medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {currentData.competition}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Competition</div>
          </div>
        </div>
        
        {/* Key Trends */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Key Trends</h3>
          <div className="space-y-2">
            {currentData.keyTrends.map((trend, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{trend}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top ASINs */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Top Performing ASINs</h3>
          <div className="space-y-3">
            {currentData.topASINs.map((asin, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    asin.rank === '#1' ? 'bg-yellow-100 text-yellow-800' :
                    asin.rank === '#2' ? 'bg-gray-100 text-gray-800' :
                    asin.rank === '#3' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {asin.rank}
                  </span>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">{asin.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{asin.asin}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-gray-100">{asin.revenue}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Risk Factors */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Risk Factors</h3>
          <div className="space-y-2">
            {currentData.riskFactors.map((risk, index) => (
              <div key={index} className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIMarketInsights;