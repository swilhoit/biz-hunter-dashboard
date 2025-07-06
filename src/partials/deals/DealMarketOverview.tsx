import React from 'react';
import { Deal } from '../../types/deal';
import { TrendingUp, Globe, Package, MessageCircle, Search, DollarSign, Users, BarChart3, Mic, ShoppingCart, Store, Monitor } from 'lucide-react';
import { tailwindConfig } from '../../utils/Utils';
import DoughnutChart from '../../charts/DoughnutChart';
import LineChart01 from '../../charts/LineChart01';
import BarChart03 from '../../charts/BarChart03';

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

  // Share of Voice data
  const shareOfVoiceData = {
    labels: ['Your Brand', 'Competitor A', 'Competitor B', 'Competitor C', 'Others'],
    datasets: [{
      label: 'Share of Voice %',
      data: [22, 28, 18, 15, 17],
      backgroundColor: [
        tailwindConfig().theme.colors.green[500],
        tailwindConfig().theme.colors.red[500],
        tailwindConfig().theme.colors.blue[500],
        tailwindConfig().theme.colors.purple[500],
        tailwindConfig().theme.colors.gray[400],
      ],
      borderWidth: 0,
      borderRadius: 4,
    }]
  };

  // Market Size Trend data (monthly)
  const marketSizeTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'TAM',
        data: [240, 242, 245, 248, 250, 253, 255, 258, 260, 263, 265, 268],
        borderColor: tailwindConfig().theme.colors.blue[500],
        backgroundColor: tailwindConfig().theme.colors.blue[500] + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'SAM',
        data: [45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 58],
        borderColor: tailwindConfig().theme.colors.purple[500],
        backgroundColor: tailwindConfig().theme.colors.purple[500] + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'SOM',
        data: [8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14],
        borderColor: tailwindConfig().theme.colors.green[500],
        backgroundColor: tailwindConfig().theme.colors.green[500] + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Demand per Channel breakdown
  const demandChannelData = [
    {
      channel: 'Amazon Marketplace',
      icon: Package,
      color: 'bg-orange-500',
      demand: 185000,
      percentage: 42,
      trend: '+18%',
      avgOrderValue: 45,
    },
    {
      channel: 'Direct Website',
      icon: Monitor,
      color: 'bg-blue-500',
      demand: 125000,
      percentage: 28,
      trend: '+25%',
      avgOrderValue: 65,
    },
    {
      channel: 'Retail Partners',
      icon: Store,
      color: 'bg-green-500',
      demand: 75000,
      percentage: 17,
      trend: '+12%',
      avgOrderValue: 38,
    },
    {
      channel: 'Social Commerce',
      icon: MessageCircle,
      color: 'bg-purple-500',
      demand: 58000,
      percentage: 13,
      trend: '+45%',
      avgOrderValue: 52,
    },
  ];

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
              <Mic className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Share of Voice</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">22%</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">+3% vs last month</p>
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

      {/* Share of Voice Analysis & Market Size Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Share of Voice Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Share of Voice Breakdown</h3>
          <div className="mb-4">
            <BarChart03
              data={shareOfVoiceData}
              width={400}
              height={300}
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">Key Insights:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Currently #2 in market share of voice</li>
              <li>• 6% gap from market leader</li>
              <li>• Strongest presence on social media channels</li>
              <li>• Opportunity to increase paid search presence</li>
            </ul>
          </div>
        </div>

        {/* Market Size Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Market Size Trend (12 Months)</h3>
          <div className="mb-4">
            <LineChart01
              data={marketSizeTrendData}
              width={400}
              height={300}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">TAM Growth</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">+11.7%</p>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">SAM Growth</p>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">+28.9%</p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">SOM Growth</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">+75%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demand per Channel Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Demand Breakdown by Channel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demandChannelData.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${channel.color} bg-opacity-20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${
                    channel.trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {channel.trend}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">{channel.channel}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Demand</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {(channel.demand / 1000).toFixed(0)}K units
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Share</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{channel.percentage}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">AOV</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${channel.avgOrderValue}</p>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`${channel.color} h-2 rounded-full`} 
                      style={{ width: `${channel.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Channel Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Highest Volume
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Amazon drives 42% of total demand with strong Prime member conversion
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Fastest Growing
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Social commerce shows 45% YoY growth, driven by TikTok Shop integration
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Highest Value
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Direct website has highest AOV at $65, indicating premium customer base
            </p>
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