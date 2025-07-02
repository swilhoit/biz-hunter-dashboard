import React, { useEffect, useRef } from 'react';
import { Deal } from '../../types/deal';
import { Package, Star, TrendingUp, BarChart3, ShoppingCart, Award } from 'lucide-react';
import DoughnutChart from '../../charts/DoughnutChart';
import { tailwindConfig } from '../../utils/Utils';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DealAmazonMetricsProps {
  deal: Deal;
}

function DealAmazonMetrics({ deal }: DealAmazonMetricsProps) {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInstance = useRef<Chart | null>(null);
  // Mock ASIN data - in real app this would come from API
  const topASINs = [
    {
      asin: 'B08N5WRWNW',
      product_name: 'Premium Dog Food Bowl Set',
      monthly_revenue: 45000,
      monthly_units: 1500,
      rank: 1250,
      reviews: 2847,
      rating: 4.7,
      profit_margin: 35,
    },
    {
      asin: 'B07QXZL5PM',
      product_name: 'Interactive Pet Toy Bundle',
      monthly_revenue: 32000,
      monthly_units: 800,
      rank: 892,
      reviews: 1923,
      rating: 4.8,
      profit_margin: 42,
    },
    {
      asin: 'B09MKJH6T2',
      product_name: 'Organic Pet Treats Variety Pack',
      monthly_revenue: 28000,
      monthly_units: 2100,
      rank: 2341,
      reviews: 3156,
      rating: 4.6,
      profit_margin: 38,
    },
  ];

  const amazonMetrics = [
    {
      title: 'Total ASINs',
      value: Array.isArray(deal.asin_list) ? deal.asin_list.length.toString() : 'N/A',
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'FBA Percentage',
      value: deal.fba_percentage ? `${deal.fba_percentage}%` : 'N/A',
      icon: Award,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Account Health',
      value: deal.seller_account_health || 'N/A',
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Avg. Rating',
      value: '4.7/5',
      icon: Star,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
  ];

  // Initialize bar chart
  useEffect(() => {
    if (!barChartRef.current) return;

    // Destroy existing chart
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    const ctx = barChartRef.current.getContext('2d');
    if (!ctx) return;

    barChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topASINs.map(asin => asin.product_name.split(' ').slice(0, 2).join(' ')),
        datasets: [{
          label: 'Monthly Revenue',
          data: topASINs.map(asin => asin.monthly_revenue),
          backgroundColor: tailwindConfig().theme.colors.blue[500],
          hoverBackgroundColor: tailwindConfig().theme.colors.blue[600],
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `$${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `$${(value as number).toLocaleString()}`;
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
            }
          }
        }
      }
    });

    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Amazon Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {amazonMetrics.map((metric, index) => {
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

      {/* Store Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Amazon Store Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Store Name</label>
              <p className="text-gray-900 dark:text-gray-100">{deal.amazon_store_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Category</label>
              <p className="text-gray-900 dark:text-gray-100">{deal.amazon_category || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Subcategory</label>
              <p className="text-gray-900 dark:text-gray-100">{deal.amazon_subcategory || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Store URL</label>
              {deal.amazon_store_url ? (
                <a 
                  href={deal.amazon_store_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Amazon Store
                </a>
              ) : (
                <p className="text-gray-900 dark:text-gray-100">N/A</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Health</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                deal.seller_account_health === 'Excellent' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {deal.seller_account_health || 'Unknown'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">FBA vs FBM</label>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${deal.fba_percentage || 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {deal.fba_percentage || 0}% FBA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASIN Revenue Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">ASIN Revenue Comparison</h3>
          <div className="relative h-64">
            <canvas ref={barChartRef} className="w-full h-full"></canvas>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Distribution</h3>
          <div className="relative">
            <DoughnutChart 
              data={{
                labels: topASINs.map(asin => asin.product_name.split(' ').slice(0, 2).join(' ')),
                datasets: [{
                  label: 'Revenue Share',
                  data: topASINs.map(asin => asin.monthly_revenue),
                  backgroundColor: [
                    tailwindConfig().theme.colors.blue[500],
                    tailwindConfig().theme.colors.emerald[500],
                    tailwindConfig().theme.colors.purple[500],
                  ],
                  hoverBackgroundColor: [
                    tailwindConfig().theme.colors.blue[600],
                    tailwindConfig().theme.colors.emerald[600],
                    tailwindConfig().theme.colors.purple[600],
                  ],
                  borderWidth: 0,
                }]
              }}
              width={400}
              height={280}
            />
          </div>
        </div>
      </div>

      {/* Top Performing ASINs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Performing ASINs</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
            View All ASINs
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monthly Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  BSR Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profit Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {topASINs.map((asin, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {asin.product_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ASIN: {asin.asin}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${asin.monthly_revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {asin.monthly_units.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    #{asin.rank.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {asin.rating} ({asin.reviews.toLocaleString()})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      {asin.profit_margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Market Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Market Analysis</h3>
          <button className="btn bg-purple-600 text-white hover:bg-purple-700 text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Run Analysis
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Market Opportunity</h4>
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">High</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Pet supplies market growing 8.6% YoY
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">Competition Level</h4>
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">Medium</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Moderate competition in niche
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Risk Assessment</h4>
              <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">Low</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Stable demand, strong reviews
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Key Insights</h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• Strong seasonal trends in Q4 with 35% revenue increase</li>
            <li>• Premium positioning allows for higher margins</li>
            <li>• Brand loyalty evidenced by repeat purchase rate of 42%</li>
            <li>• Opportunity to expand into related categories</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DealAmazonMetrics;