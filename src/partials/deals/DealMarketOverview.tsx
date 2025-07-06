import React from 'react';
import { Deal } from '../../types/deal';
import { TrendingUp, Globe, Package, MessageCircle, Search, DollarSign, Users, BarChart3 } from 'lucide-react';
import { tailwindConfig } from '../../utils/Utils';
import DoughnutChart from '../../charts/DoughnutChart';

interface DealMarketOverviewProps {
  deal: Deal;
}

function DealMarketOverview({ deal }: DealMarketOverviewProps) {
  // Market metrics data
  const marketMetrics = [
    {
      channel: 'Amazon',
      revenue: deal.annual_revenue ? deal.annual_revenue * 0.75 : 0, // Assuming 75% from Amazon
      percentage: 75,
      growth: '+15%',
      color: 'bg-orange-500',
      icon: Package,
    },
    {
      channel: 'Website/SEO',
      revenue: deal.annual_revenue ? deal.annual_revenue * 0.15 : 0,
      percentage: 15,
      growth: '+22%',
      color: 'bg-blue-500',
      icon: Search,
    },
    {
      channel: 'Social Media',
      revenue: deal.annual_revenue ? deal.annual_revenue * 0.10 : 0,
      percentage: 10,
      growth: '+35%',
      color: 'bg-purple-500',
      icon: MessageCircle,
    },
  ];

  const totalRevenue = deal.annual_revenue || 0;

  return (
    <div className="space-y-6">
      {/* Key Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Market Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${totalRevenue ? (totalRevenue / 1000000).toFixed(1) : '0'}M
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">+18% YoY</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">125K</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">+12% growth</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Share</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">2.3%</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Top 10 in category</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Channels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Multi-channel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Distribution by Channel</h3>
          <div className="relative">
            <DoughnutChart 
              data={{
                labels: marketMetrics.map(m => m.channel),
                datasets: [{
                  label: 'Revenue Share',
                  data: marketMetrics.map(m => m.percentage),
                  backgroundColor: [
                    tailwindConfig().theme.colors.orange[500],
                    tailwindConfig().theme.colors.blue[500],
                    tailwindConfig().theme.colors.purple[500],
                  ],
                  hoverBackgroundColor: [
                    tailwindConfig().theme.colors.orange[600],
                    tailwindConfig().theme.colors.blue[600],
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Channel Performance</h3>
          <div className="space-y-4">
            {marketMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${metric.color} bg-opacity-20`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{metric.channel}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${metric.revenue ? (metric.revenue / 1000000).toFixed(1) : '0'}M annual
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{metric.growth}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">YoY growth</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Market Position Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Market Position Analysis</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Update Analysis
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Market Opportunity</h4>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">TAM (Total Addressable Market)</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">$250M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">SAM (Serviceable Market)</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">$50M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">SOM (Obtainable Market)</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">$12M</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100">Competitive Analysis</h4>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-300">Direct Competitors</span>
                <span className="font-medium text-green-900 dark:text-green-100">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-300">Market Position</span>
                <span className="font-medium text-green-900 dark:text-green-100">#8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-300">Competitive Advantage</span>
                <span className="font-medium text-green-900 dark:text-green-100">Strong</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 dark:text-purple-100">Growth Potential</h4>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700 dark:text-purple-300">Market Growth Rate</span>
                <span className="font-medium text-purple-900 dark:text-purple-100">8.6%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700 dark:text-purple-300">Revenue CAGR</span>
                <span className="font-medium text-purple-900 dark:text-purple-100">18%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700 dark:text-purple-300">Expansion Potential</span>
                <span className="font-medium text-purple-900 dark:text-purple-100">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Market Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Strengths</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Strong brand recognition in Amazon marketplace
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  High customer satisfaction ratings (4.7/5 average)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Efficient multi-channel distribution system
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Growing organic search presence
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Opportunities</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Expand social media presence for 35% growth potential
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Launch subscription model for recurring revenue
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  International expansion into EU markets
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Product line extension in adjacent categories
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealMarketOverview;