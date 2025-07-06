import React, { useEffect, useRef, useState } from 'react';
import { Deal } from '../../types/deal';
import { SEOCompetitor } from '../../types/market-analysis';
import { Search, Globe, TrendingUp, Target, Link, FileText, Users, BarChart3, AlertCircle, Eye } from 'lucide-react';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';
import { tailwindConfig } from '../../utils/Utils';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface DealSEOAnalysisEnhancedProps {
  deal: Deal;
}

function DealSEOAnalysisEnhanced({ deal }: DealSEOAnalysisEnhancedProps) {
  const trafficChartRef = useRef<HTMLCanvasElement>(null);
  const trafficChartInstance = useRef<Chart | null>(null);
  const visibilityChartRef = useRef<HTMLCanvasElement>(null);
  const visibilityChartInstance = useRef<Chart | null>(null);
  
  const [showCompetitors, setShowCompetitors] = useState(true);

  // Mock SEO competitors data
  const seoCompetitors: SEOCompetitor[] = [
    {
      id: '1',
      deal_id: deal.id,
      competitor_domain: 'petcarepro.com',
      domain_authority: 65,
      organic_traffic: 125000,
      keyword_overlap_count: 234,
      keyword_overlap_percentage: 35,
      competing_pages: 45,
      visibility_score: 78,
      content_gap_opportunities: 89,
      backlink_gap_opportunities: 156,
      strengths: ['Strong content library', 'High domain authority', 'Featured snippets'],
      weaknesses: ['Slow page speed', 'Poor mobile experience'],
    },
    {
      id: '2',
      deal_id: deal.id,
      competitor_domain: 'naturalpetsupplies.org',
      domain_authority: 52,
      organic_traffic: 89000,
      keyword_overlap_count: 189,
      keyword_overlap_percentage: 28,
      competing_pages: 32,
      visibility_score: 65,
      content_gap_opportunities: 67,
      backlink_gap_opportunities: 234,
      strengths: ['Educational content', 'Strong local SEO', 'Good user engagement'],
      weaknesses: ['Limited product pages', 'Few backlinks'],
    },
    {
      id: '3',
      deal_id: deal.id,
      competitor_domain: 'petwellnessguide.com',
      domain_authority: 48,
      organic_traffic: 67000,
      keyword_overlap_count: 156,
      keyword_overlap_percentage: 23,
      competing_pages: 28,
      visibility_score: 55,
      content_gap_opportunities: 45,
      backlink_gap_opportunities: 189,
      strengths: ['Fresh content', 'Good social signals', 'Video content'],
      weaknesses: ['New domain', 'Limited authority'],
    },
  ];

  // Mock SEO metrics
  const seoMetrics = [
    {
      title: 'Visibility Score',
      value: '68/100',
      change: '+5',
      icon: Eye,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Share of Search',
      value: '12.5%',
      change: '+2.3%',
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Content Gap Score',
      value: '156',
      change: 'opportunities',
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Competitive Rank',
      value: '#4',
      change: 'in niche',
      icon: BarChart3,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const topKeywords = [
    { keyword: 'premium pet supplies', position: 3, volume: 12100, difficulty: 45, trend: 'up', competitors: 8 },
    { keyword: 'eco friendly pet products', position: 5, volume: 8900, difficulty: 38, trend: 'up', competitors: 5 },
    { keyword: 'organic dog food', position: 8, volume: 22300, difficulty: 62, trend: 'stable', competitors: 12 },
    { keyword: 'sustainable pet toys', position: 12, volume: 5600, difficulty: 35, trend: 'up', competitors: 4 },
    { keyword: 'natural cat treats', position: 15, volume: 7800, difficulty: 41, trend: 'down', competitors: 7 },
  ];

  const topPages = [
    { page: '/products/eco-pet-bowls', traffic: 8500, bounce: 32, time: '3:45', competitors: 5 },
    { page: '/blog/pet-care-tips', traffic: 6200, bounce: 28, time: '4:12', competitors: 8 },
    { page: '/products/organic-treats', traffic: 5800, bounce: 35, time: '2:56', competitors: 6 },
    { page: '/about-us', traffic: 4500, bounce: 45, time: '2:15', competitors: 2 },
    { page: '/reviews', traffic: 3200, bounce: 25, time: '5:23', competitors: 3 },
  ];

  // Initialize traffic chart
  useEffect(() => {
    if (!trafficChartRef.current) return;

    if (trafficChartInstance.current) {
      trafficChartInstance.current.destroy();
    }

    const ctx = trafficChartRef.current.getContext('2d');
    if (!ctx) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const organicData = [32000, 35000, 38000, 42000, 45000, 45200];
    const competitorAvg = [38000, 39000, 40000, 41000, 42000, 43000];

    trafficChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Your Organic Traffic',
            data: organicData,
            borderColor: tailwindConfig().theme.colors.blue[500],
            backgroundColor: tailwindConfig().theme.colors.blue[500] + '20',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Competitor Average',
            data: competitorAvg,
            borderColor: tailwindConfig().theme.colors.red[500],
            backgroundColor: tailwindConfig().theme.colors.red[500] + '20',
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

  // Initialize visibility chart
  useEffect(() => {
    if (!visibilityChartRef.current || !showCompetitors) return;

    if (visibilityChartInstance.current) {
      visibilityChartInstance.current.destroy();
    }

    const ctx = visibilityChartRef.current.getContext('2d');
    if (!ctx) return;

    const competitors = [
      { name: deal.business_name || 'Your Site', score: 68 },
      ...seoCompetitors.map(comp => ({
        name: comp.competitor_domain.split('.')[0],
        score: comp.visibility_score || 0
      }))
    ];

    visibilityChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: competitors.map(c => c.name),
        datasets: [{
          label: 'Visibility Score',
          data: competitors.map(c => c.score),
          backgroundColor: [
            tailwindConfig().theme.colors.green[500],
            tailwindConfig().theme.colors.red[500],
            tailwindConfig().theme.colors.orange[500],
            tailwindConfig().theme.colors.yellow[500],
          ],
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });

    return () => {
      if (visibilityChartInstance.current) {
        visibilityChartInstance.current.destroy();
      }
    };
  }, [showCompetitors, deal]);

  return (
    <div className="space-y-6">
      {/* SEO Competitive Metrics */}
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
                  <p className={`text-xs ${metric.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {metric.change}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Traffic Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Traffic Comparison</h3>
        <div className="relative h-64">
          <canvas ref={trafficChartRef} className="w-full h-full"></canvas>
        </div>
      </div>

      {/* SEO Competitor Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEO Competitor Analysis</h3>
          <button 
            onClick={() => setShowCompetitors(!showCompetitors)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showCompetitors ? 'Hide' : 'Show'} Competitors
          </button>
        </div>
        
        {showCompetitors && (
          <>
            {/* Visibility Score Comparison */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Visibility Score Comparison</h4>
              <div className="relative h-48">
                <canvas ref={visibilityChartRef} className="w-full h-full"></canvas>
              </div>
            </div>

            {/* Competitor Details */}
            <div className="space-y-4">
              {seoCompetitors.map((competitor) => (
                <div key={competitor.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{competitor.competitor_domain}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        DA: {competitor.domain_authority} • {competitor.keyword_overlap_percentage}% keyword overlap
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {(competitor.organic_traffic || 0).toLocaleString()} visits/mo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Organic traffic</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Visibility</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {competitor.visibility_score}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Keywords</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {competitor.keyword_overlap_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Content Gaps</p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {competitor.content_gap_opportunities}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Link Gaps</p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {competitor.backlink_gap_opportunities}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Strengths</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400">
                        {competitor.strengths?.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-1">+</span> {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Weaknesses</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400">
                        {competitor.weaknesses?.map((weakness, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-1">-</span> {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Keyword & Page Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords with Competition */}
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
                  <th className="pb-3">Pos.</th>
                  <th className="pb-3">Vol.</th>
                  <th className="pb-3">Comp.</th>
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
                      {(kw.volume / 1000).toFixed(1)}K
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{kw.competitors}</span>
                        <Users className="w-3 h-3 text-gray-400 ml-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Pages with Competition */}
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
                  <th className="pb-3">Comp.</th>
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
                      {(page.traffic / 1000).toFixed(1)}K
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{page.competitors}</span>
                        <Users className="w-3 h-3 text-gray-400 ml-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SEO Opportunities & Threats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEO Opportunities & Threats</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Run Full Audit
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">Quick Wins</h4>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• 45 keywords in positions 11-20</li>
              <li>• 23 pages missing meta descriptions</li>
              <li>• 67 internal linking opportunities</li>
              <li>• 12 featured snippet opportunities</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Content Gaps</h4>
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Pet training guides (8.5K searches)</li>
              <li>• Breed-specific content (12K searches)</li>
              <li>• Seasonal pet care (5.2K searches)</li>
              <li>• Video content opportunities</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-red-900 dark:text-red-100">Threats</h4>
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• Competitor gaining 15% traffic/mo</li>
              <li>• 34 keywords losing positions</li>
              <li>• New competitor entered market</li>
              <li>• Mobile performance issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealSEOAnalysisEnhanced;