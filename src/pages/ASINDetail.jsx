import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { getProductDetailImage, getProductGalleryImages } from '../utils/asinImageUtils';
import ASINImage from '../components/ASINImage';

// Chart components
import LineChart01 from '../charts/LineChart01';
import BarChart01 from '../charts/BarChart01';
import DoughnutChart from '../charts/DoughnutChart';

function ASINDetail() {
  const { asinId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Mock data - in production, this would come from your API/database
  const asinData = {
    asin: asinId,
    title: 'Smart Kitchen Scale with App Integration',
    category: 'Home & Kitchen',
    subcategory: 'Kitchen Gadgets',
    brand: 'SmartCook Pro',
    currentPrice: 74.99,
    averagePrice: 72.50,
    bsr: 1250,
    rating: 4.6,
    reviews: 12847,
    monthlyRevenue: 180000,
    monthlyUnits: 2400,
    monthlyProfit: 69000,
    margin: 38.3,
    inventory: 850,
    fbaFees: 8.75,
    referralFee: 11.25,
    description: 'High-precision digital kitchen scale with Bluetooth connectivity and mobile app integration. Features nutritional tracking, recipe scaling, and multiple unit conversions.',
    features: [
      'Bluetooth 5.0 connectivity',
      'Companion mobile app for iOS/Android',
      'Nutritional database with 500,000+ foods',
      'Accurate to 0.1g',
      'Tare function',
      'Auto-off feature',
      'Rechargeable battery',
      'Stainless steel platform'
    ],
    competitors: [
      { asin: 'B087NWQT2N', name: 'Digital Kitchen Scale Basic', price: 24.99, rating: 4.2 },
      { asin: 'B087NWQT2O', name: 'Pro Chef Scale', price: 89.99, rating: 4.8 },
      { asin: 'B087NWQT2P', name: 'Smart Scale Plus', price: 69.99, rating: 4.5 }
    ]
  };

  // Generate gallery images
  const galleryImages = getProductGalleryImages(asinData.category, asinData.asin, 4);

  // Chart data
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [165000, 172000, 168000, 175000, 178000, 180000],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const rankChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'BSR',
        data: [1450, 1380, 1320, 1290, 1260, 1250],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const profitBreakdownData = {
    labels: ['Product Cost', 'FBA Fees', 'Referral Fees', 'Other Costs', 'Profit'],
    datasets: [
      {
        label: 'Cost Breakdown',
        data: [35, 12, 15, 8, 30],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(147, 197, 253, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            
            {/* Breadcrumb */}
            <div className="mb-4">
              <Link to="/deals" className="text-violet-500 hover:text-violet-600">&larr; Back to Deals</Link>
            </div>

            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">ASIN Details</h1>
            </div>

            {/* Product Header Section */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl mb-8">
              <div className="p-6">
                <div className="md:flex md:justify-between md:items-start">
                  <div className="md:flex md:space-x-6">
                    {/* Product Images */}
                    <div className="mb-4 md:mb-0">
                      <div className="space-y-4">
                        <div className="relative">
                          <ASINImage
                            src={galleryImages[selectedImage]}
                            alt={asinData.title}
                            className="w-full md:w-96 h-64 md:h-96 object-cover rounded-lg"
                            fallbackText={asinData.asin}
                          />
                        </div>
                        <div className="flex space-x-2">
                          {galleryImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImage(index)}
                              className={`relative rounded-lg overflow-hidden ${
                                selectedImage === index ? 'ring-2 ring-violet-500' : ''
                              }`}
                            >
                              <ASINImage
                                src={img}
                                alt={`${asinData.title} ${index + 1}`}
                                className="w-20 h-20 object-cover"
                                fallbackText={`${index + 1}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-violet-500 uppercase">{asinData.asin}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{asinData.title}</h2>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {asinData.category} › {asinData.subcategory} • {asinData.brand}
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Current Price</div>
                          <div className="text-xl font-bold text-gray-800 dark:text-gray-100">${asinData.currentPrice}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">BSR</div>
                          <div className="text-xl font-bold text-gray-800 dark:text-gray-100">#{asinData.bsr.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                          <div className="text-xl font-bold text-yellow-600">{asinData.rating} ★</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{asinData.reviews.toLocaleString()} reviews</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</div>
                          <div className="text-xl font-bold text-green-600">${asinData.monthlyRevenue.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Description</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{asinData.description}</p>
                      </div>

                      {/* Features */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Key Features</h3>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {asinData.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 md:mt-0 md:ml-6">
                    <div className="space-y-2">
                      <a
                        href={`https://www.amazon.com/dp/${asinData.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        View on Amazon
                      </a>
                      <button className="btn w-full border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                        Add to Watchlist
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tab.Group>
              <Tab.List className="flex flex-wrap -m-1 mb-8">
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Performance
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Analytics
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  Competition
                </Tab>
                <Tab className={({ selected }) =>
                  `btn ${selected 
                    ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                  } m-1`
                }>
                  History
                </Tab>
              </Tab.List>

              <Tab.Panels>
                {/* Performance Tab */}
                <Tab.Panel>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Revenue Chart */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Revenue Trend</h2>
                        </header>
                        <div className="px-5 py-3">
                          <LineChart01 data={revenueChartData} width={389} height={200} />
                        </div>
                      </div>
                    </div>

                    {/* BSR Chart */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">BSR Trend</h2>
                        </header>
                        <div className="px-5 py-3">
                          <LineChart01 data={rankChartData} width={389} height={200} />
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="col-span-full">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Performance Metrics</h2>
                        </header>
                        <div className="p-5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">${asinData.monthlyRevenue.toLocaleString()}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{asinData.monthlyUnits.toLocaleString()}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Units Sold</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">${asinData.monthlyProfit.toLocaleString()}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Profit</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{asinData.margin}%</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Profit Margin</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Analytics Tab */}
                <Tab.Panel>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Profit Breakdown */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Profit Breakdown</h2>
                        </header>
                        <div className="px-5 py-3">
                          <DoughnutChart data={profitBreakdownData} width={389} height={260} />
                        </div>
                      </div>
                    </div>

                    {/* Fee Analysis */}
                    <div className="col-span-full xl:col-span-6">
                      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Fee Analysis</h2>
                        </header>
                        <div className="p-5">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">FBA Fees</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">${asinData.fbaFees}/unit</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Referral Fees</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">${asinData.referralFee}/unit</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total Fees</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">${(asinData.fbaFees + asinData.referralFee).toFixed(2)}/unit</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Net Profit per Unit</span>
                                <span className="text-lg font-bold text-green-600">${(asinData.monthlyProfit / asinData.monthlyUnits).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Competition Tab */}
                <Tab.Panel>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">Competitor Analysis</h2>
                    </header>
                    <div className="p-5">
                      <table className="table-auto w-full">
                        <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
                          <tr>
                            <th className="p-2 whitespace-nowrap">
                              <div className="font-semibold text-left">Competitor</div>
                            </th>
                            <th className="p-2 whitespace-nowrap">
                              <div className="font-semibold text-center">ASIN</div>
                            </th>
                            <th className="p-2 whitespace-nowrap">
                              <div className="font-semibold text-center">Price</div>
                            </th>
                            <th className="p-2 whitespace-nowrap">
                              <div className="font-semibold text-center">Rating</div>
                            </th>
                            <th className="p-2 whitespace-nowrap">
                              <div className="font-semibold text-center">Price Diff</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                          {asinData.competitors.map((competitor) => (
                            <tr key={competitor.asin}>
                              <td className="p-2 whitespace-nowrap">
                                <div className="font-medium text-gray-800 dark:text-gray-100">{competitor.name}</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-center text-gray-600 dark:text-gray-400">{competitor.asin}</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-center font-medium">${competitor.price}</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="text-center text-yellow-600">{competitor.rating} ★</div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className={`text-center font-medium ${
                                  competitor.price > asinData.currentPrice ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {competitor.price > asinData.currentPrice ? '+' : ''}
                                  ${(competitor.price - asinData.currentPrice).toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Tab.Panel>

                {/* History Tab */}
                <Tab.Panel>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">Price & Rank History</h2>
                    </header>
                    <div className="p-5">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Historical data tracking coming soon...
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

          </div>
        </main>
      </div>
    </div>
  );
}

export default ASINDetail;