import React, { useEffect, useRef } from 'react';
import { Deal } from '../../types/deal';
import { Search, Globe, TrendingUp, Target, Link, FileText, Users, BarChart3 } from 'lucide-react';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';
import { tailwindConfig } from '../../utils/Utils';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface DealSEOAnalysisProps {
  deal: Deal;
}

function DealSEOAnalysis({ deal }: DealSEOAnalysisProps) {
  const trafficChartRef = useRef<HTMLCanvasElement>(null);
  const trafficChartInstance = useRef<Chart | null>(null);

  // Mock SEO data
  const seoMetrics = [
    {
      title: 'Domain Authority',
      value: '42/100',
      change: '+3',
      icon: Globe,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Organic Traffic',
      value: '45.2K',
      change: '+12%',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Keywords Ranking',
      value: '1,234',
      change: '+89',
      icon: Search,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Backlinks',
      value: '3,456',
      change: '+245',
      icon: Link,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const topKeywords = [
    { keyword: 'premium pet supplies', position: 3, volume: 12100, difficulty: 45, trend: 'up' },
    { keyword: 'eco friendly pet products', position: 5, volume: 8900, difficulty: 38, trend: 'up' },
    { keyword: 'organic dog food', position: 8, volume: 22300, difficulty: 62, trend: 'stable' },
    { keyword: 'sustainable pet toys', position: 12, volume: 5600, difficulty: 35, trend: 'up' },
    { keyword: 'natural cat treats', position: 15, volume: 7800, difficulty: 41, trend: 'down' },
  ];

  const topPages = [
    { page: '/products/eco-pet-bowls', traffic: 8500, bounce: 32, time: '3:45' },
    { page: '/blog/pet-care-tips', traffic: 6200, bounce: 28, time: '4:12' },
    { page: '/products/organic-treats', traffic: 5800, bounce: 35, time: '2:56' },
    { page: '/about-us', traffic: 4500, bounce: 45, time: '2:15' },
    { page: '/reviews', traffic: 3200, bounce: 25, time: '5:23' },
  ];

  // Initialize traffic chart
  useEffect(() => {
    if (!trafficChartRef.current) return;

    // Destroy existing chart
    if (trafficChartInstance.current) {
      trafficChartInstance.current.destroy();
    }

    const ctx = trafficChartRef.current.getContext('2d');
    if (!ctx) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const organicData = [32000, 35000, 38000, 42000, 45000, 45200];
    const paidData = [8000, 8500, 9000, 9500, 10000, 10500];

    trafficChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Organic Traffic',
            data: organicData,
            borderColor: tailwindConfig().theme.colors.blue[500],
            backgroundColor: tailwindConfig().theme.colors.blue[500] + '20',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Paid Traffic',
            data: paidData,
            borderColor: tailwindConfig().theme.colors.purple[500],
            backgroundColor: tailwindConfig().theme.colors.purple[500] + '20',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return (value as number / 1000).toFixed(0) + 'K';
              },
            },
          },
        },
      },
    });

    return () => {
      if (trafficChartInstance.current) {
        trafficChartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* SEO Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {seoMetrics.map((metric, index) => {
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
                  <p className={`text-xs ${metric.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metric.change} this month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Traffic Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Traffic Overview</h3>
        <div className="relative h-64">
          <canvas ref={trafficChartRef} className="w-full h-full"></canvas>
        </div>
      </div>

      {/* Top Keywords & Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Keywords</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Keyword</th>
                  <th className="pb-3">Position</th>
                  <th className="pb-3">Volume</th>
                  <th className="pb-3">KD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topKeywords.map((kw, index) => (
                  <tr key={index}>
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{kw.keyword}</span>
                        {kw.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500 ml-2" />}
                        {kw.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 ml-2 transform rotate-180" />}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${kw.position <= 10 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        #{kw.position}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                      {kw.volume.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        kw.difficulty < 40 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        kw.difficulty < 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {kw.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Pages</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Page</th>
                  <th className="pb-3">Traffic</th>
                  <th className="pb-3">Bounce</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topPages.map((page, index) => (
                  <tr key={index}>
                    <td className="py-3">
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate block max-w-xs">
                        {page.page}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                      {page.traffic.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`text-sm ${page.bounce < 35 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {page.bounce}%
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                      {page.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SEO Opportunities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEO Opportunities</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Run Full Audit
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Content Opportunities</h4>
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 45 keywords with no dedicated content</li>
              <li>• 12 pages need content optimization</li>
              <li>• 8 competitor content gaps identified</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">Technical SEO</h4>
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Page speed: 3.2s (needs improvement)</li>
              <li>• Mobile score: 85/100 (good)</li>
              <li>• 23 broken links to fix</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Quick Wins</h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• Optimize meta descriptions for top 20 pages (est. +15% CTR)</li>
            <li>• Add schema markup to product pages (est. +8% visibility)</li>
            <li>• Internal linking optimization (est. +20% page authority)</li>
            <li>• Image optimization can reduce load time by 1.5s</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DealSEOAnalysis;