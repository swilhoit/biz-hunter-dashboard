import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ASINTable({ category, timeframe }) {
  const [sortField, setSortField] = useState('revenue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedASINs, setSelectedASINs] = useState([]);
  
  const asinData = [
    {
      asin: 'B087NWQT2M',
      title: 'Smart Kitchen Scale with App Integration',
      category: 'Home & Kitchen',
      bsr: 1250,
      rating: 4.6,
      reviews: 12847,
      price: 74.99,
      revenue: 180000,
      units: 2400,
      profit: 69000,
      margin: 38.3,
      trend: 'up',
      change: 12.5,
      deal: 'Kitchen Gadgets Pro'
    },
    {
      asin: 'B089QX4B9N',
      title: 'Premium Silicone Cooking Utensil Set',
      category: 'Home & Kitchen',
      bsr: 890,
      rating: 4.4,
      reviews: 8921,
      price: 49.99,
      revenue: 140000,
      units: 2800,
      profit: 42000,
      margin: 30.0,
      trend: 'up',
      change: 8.3,
      deal: 'Kitchen Gadgets Pro'
    },
    {
      asin: 'B092LP8XYZ',
      title: 'Air Fryer Accessories Kit',
      category: 'Home & Kitchen',
      bsr: 2100,
      rating: 4.5,
      reviews: 6543,
      price: 39.99,
      revenue: 120000,
      units: 3000,
      profit: 36000,
      margin: 30.0,
      trend: 'down',
      change: -5.2,
      deal: 'Kitchen Gadgets Pro'
    },
    {
      asin: 'B094ABC123',
      title: 'Wireless Phone Charger Stand',
      category: 'Electronics',
      bsr: 445,
      rating: 4.3,
      reviews: 15200,
      price: 29.99,
      revenue: 220000,
      units: 7333,
      profit: 88000,
      margin: 40.0,
      trend: 'up',
      change: 15.8,
      deal: 'SmartHome Essentials'
    },
    {
      asin: 'B096DEF456',
      title: 'Gaming Mouse Pad RGB',
      category: 'Electronics',
      bsr: 1680,
      rating: 4.7,
      reviews: 9876,
      price: 24.99,
      revenue: 160000,
      units: 6402,
      profit: 64000,
      margin: 40.0,
      trend: 'up',
      change: 22.1,
      deal: 'SmartHome Essentials'
    },
    {
      asin: 'B098GHI789',
      title: 'Portable Phone Stand Adjustable',
      category: 'Electronics',
      bsr: 3200,
      rating: 4.2,
      reviews: 4321,
      price: 19.99,
      revenue: 95000,
      units: 4751,
      profit: 28500,
      margin: 30.0,
      trend: 'stable',
      change: 1.2,
      deal: 'SmartHome Essentials'
    }
  ];
  
  const getTrendIcon = (trend, change) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">+{change}%</span>
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">{change}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">{change}%</span>
        </div>
      );
    }
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleSelectASIN = (asin) => {
    setSelectedASINs(prev => 
      prev.includes(asin) 
        ? prev.filter(a => a !== asin)
        : [...prev, asin]
    );
  };
  
  const handleSelectAll = () => {
    setSelectedASINs(
      selectedASINs.length === asinData.length ? [] : asinData.map(a => a.asin)
    );
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            ASIN Performance 
            <span className="text-gray-400 dark:text-gray-500 font-medium ml-2">
              ({asinData.length} ASINs)
            </span>
          </h2>
          
          {selectedASINs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedASINs.length} selected
              </span>
              <button className="btn bg-violet-500 hover:bg-violet-600 text-white text-sm">
                Bulk Actions
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className="overflow-x-auto">
        <table className="table-auto w-full dark:text-gray-300">
          <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-b border-gray-100 dark:border-gray-700/60">
            <tr>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                <div className="flex items-center">
                  <label className="inline-flex">
                    <span className="sr-only">Select all</span>
                    <input 
                      className="form-checkbox" 
                      type="checkbox" 
                      checked={selectedASINs.length === asinData.length}
                      onChange={handleSelectAll}
                    />
                  </label>
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-left cursor-pointer" onClick={() => handleSort('title')}>
                  Product
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-left cursor-pointer" onClick={() => handleSort('deal')}>
                  Deal
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-center cursor-pointer" onClick={() => handleSort('bsr')}>
                  BSR
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-center cursor-pointer" onClick={() => handleSort('rating')}>
                  Rating
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right cursor-pointer" onClick={() => handleSort('revenue')}>
                  Revenue
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right cursor-pointer" onClick={() => handleSort('units')}>
                  Units
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-right cursor-pointer" onClick={() => handleSort('margin')}>
                  Margin
                </div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-center">Trend</div>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <span className="sr-only">Menu</span>
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
            {asinData.map((asin) => (
              <tr key={asin.asin} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select</span>
                      <input 
                        className="form-checkbox" 
                        type="checkbox" 
                        checked={selectedASINs.includes(asin.asin)}
                        onChange={() => handleSelectASIN(asin.asin)}
                      />
                    </label>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {asin.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {asin.asin} • {asin.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <Link 
                    to={`/deals/1`}
                    className="text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium"
                  >
                    {asin.deal}
                  </Link>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-center font-medium text-gray-800 dark:text-gray-100">
                    #{asin.bsr.toLocaleString()}
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-center">
                    <div className="font-medium text-yellow-600">{asin.rating} ★</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {asin.reviews.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right">
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      ${asin.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${asin.price}/unit
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right font-medium text-gray-800 dark:text-gray-100">
                    {asin.units.toLocaleString()}
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-right">
                    <div className="font-medium text-green-600">{asin.margin}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${asin.profit.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex justify-center">
                    {getTrendIcon(asin.trend, asin.change)}
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="space-x-1">
                    <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                      <span className="sr-only">View</span>
                      <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32">
                        <path d="M16 12.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM16 18a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                        <path d="M16 4C9.4 4 3.8 8.1 2.2 13.6c-.2.7-.2 1.4 0 2.1C3.8 21.2 9.4 25.3 16 25.3s12.2-4.1 13.8-9.6c.2-.7.2-1.4 0-2.1C28.2 8.1 22.6 4 16 4zm0 19.3c-5.4 0-10.1-3.2-12-7.3.2-.7.5-1.4 1-2 1.9-4.1 6.6-7.3 12-7.3s10.1 3.2 12 7.3c-.2.7-.5 1.4-1 2-1.9 4.1-6.6 7.3-12 7.3z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ASINTable;