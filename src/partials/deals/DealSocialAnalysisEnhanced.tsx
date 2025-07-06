import React, { useEffect, useRef, useState } from 'react';
import { Deal } from '../../types/deal';
import { SocialCompetitor } from '../../types/market-analysis';
import { MessageCircle, Heart, Share2, Users, TrendingUp, Instagram, Youtube, Facebook, Target, AlertCircle, BarChart3 } from 'lucide-react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { tailwindConfig } from '../../utils/Utils';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement, Filler);

interface DealSocialAnalysisEnhancedProps {
  deal: Deal;
}

// Custom Twitter/X icon component
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function DealSocialAnalysisEnhanced({ deal }: DealSocialAnalysisEnhancedProps) {
  const engagementChartRef = useRef<HTMLCanvasElement>(null);
  const engagementChartInstance = useRef<Chart | null>(null);
  const competitorRadarRef = useRef<HTMLCanvasElement>(null);
  const competitorRadarInstance = useRef<Chart | null>(null);
  
  const [showCompetitors, setShowCompetitors] = useState(true);

  // Mock social competitors data
  const socialCompetitors: SocialCompetitor[] = [
    {
      id: '1',
      deal_id: deal.id,
      competitor_name: 'PetLovers Hub',
      platform_presence: {
        instagram: { followers: 125000, engagement: 6.8 },
        facebook: { followers: 89000, engagement: 4.2 },
        youtube: { subscribers: 45000, views: 2500000 },
        twitter: { followers: 32000, engagement: 2.8 },
        tiktok: { followers: 78000, engagement: 12.5 },
      },
      total_reach: 369000,
      engagement_rate_avg: 6.5,
      post_frequency_weekly: 28,
      content_strategy: 'User-generated content focus with daily posts',
      strengths: ['High engagement', 'Diverse content', 'Strong community'],
      weaknesses: ['Inconsistent branding', 'Limited educational content'],
      audience_overlap_percentage: 35,
      share_of_voice: 22,
    },
    {
      id: '2',
      deal_id: deal.id,
      competitor_name: 'Natural Pet Co',
      platform_presence: {
        instagram: { followers: 67000, engagement: 8.2 },
        facebook: { followers: 45000, engagement: 3.8 },
        youtube: { subscribers: 12000, views: 450000 },
        twitter: { followers: 8900, engagement: 1.9 },
      },
      total_reach: 132900,
      engagement_rate_avg: 5.5,
      post_frequency_weekly: 21,
      content_strategy: 'Educational content with product highlights',
      strengths: ['High quality content', 'Expert positioning', 'Loyal audience'],
      weaknesses: ['Limited reach', 'Slow growth'],
      audience_overlap_percentage: 28,
      share_of_voice: 15,
    },
    {
      id: '3',
      deal_id: deal.id,
      competitor_name: 'Pet Paradise Store',
      platform_presence: {
        instagram: { followers: 234000, engagement: 4.5 },
        facebook: { followers: 156000, engagement: 2.9 },
        tiktok: { followers: 189000, engagement: 15.2 },
      },
      total_reach: 579000,
      engagement_rate_avg: 7.5,
      post_frequency_weekly: 42,
      content_strategy: 'Entertainment-focused with viral potential',
      strengths: ['Large reach', 'Viral content', 'Young audience'],
      weaknesses: ['Low conversion', 'Superficial engagement'],
      audience_overlap_percentage: 42,
      share_of_voice: 31,
    },
  ];

  // Mock social media data
  const socialMetrics = [
    {
      platform: 'Instagram',
      followers: 45600,
      growth: '+12%',
      engagement: '4.8%',
      shareOfVoice: 18,
      icon: Instagram,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      platform: 'Facebook',
      followers: 32400,
      growth: '+5%',
      engagement: '3.2%',
      shareOfVoice: 12,
      icon: Facebook,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-600',
    },
    {
      platform: 'YouTube',
      followers: 28900,
      growth: '+18%',
      engagement: '6.5%',
      shareOfVoice: 8,
      icon: Youtube,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-600',
    },
    {
      platform: 'Twitter/X',
      followers: 12300,
      growth: '+8%',
      engagement: '2.1%',
      shareOfVoice: 5,
      icon: TwitterIcon,
      color: 'text-gray-900 dark:text-gray-100',
      bgColor: 'bg-gray-900 dark:bg-gray-100',
    },
  ];

  const competitiveMetrics = [
    {
      title: 'Share of Voice',
      value: '14%',
      subtext: '#4 in market',
      icon: MessageCircle,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      subtext: 'vs 3.1% avg',
      icon: Heart,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Audience Quality',
      value: '82/100',
      subtext: 'High intent',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Content Score',
      value: '75/100',
      subtext: 'Above average',
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  // Initialize engagement comparison chart
  useEffect(() => {
    if (!engagementChartRef.current) return;

    if (engagementChartInstance.current) {
      engagementChartInstance.current.destroy();
    }

    const ctx = engagementChartRef.current.getContext('2d');
    if (!ctx) return;

    const platforms = ['Instagram', 'Facebook', 'YouTube', 'Twitter/X', 'TikTok'];
    const yourData = [4.8, 3.2, 6.5, 2.1, 0]; // 0 for TikTok as not present
    const competitorAvg = [6.5, 3.6, 8.2, 2.5, 13.8];

    engagementChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: platforms,
        datasets: [
          {
            label: 'Your Engagement',
            data: yourData,
            backgroundColor: tailwindConfig().theme.colors.blue[500],
            borderRadius: 4,
          },
          {
            label: 'Competitor Average',
            data: competitorAvg,
            backgroundColor: tailwindConfig().theme.colors.gray[400],
            borderRadius: 4,
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
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
            },
          },
        },
      },
    });

    return () => {
      if (engagementChartInstance.current) {
        engagementChartInstance.current.destroy();
      }
    };
  }, []);

  // Initialize competitor radar chart
  useEffect(() => {
    if (!competitorRadarRef.current || !showCompetitors) return;

    if (competitorRadarInstance.current) {
      competitorRadarInstance.current.destroy();
    }

    const ctx = competitorRadarRef.current.getContext('2d');
    if (!ctx) return;

    competitorRadarInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Reach', 'Engagement', 'Content Quality', 'Growth', 'Community', 'Conversion'],
        datasets: [
          {
            label: deal.business_name || 'Your Brand',
            data: [65, 85, 75, 70, 80, 60],
            borderColor: tailwindConfig().theme.colors.blue[500],
            backgroundColor: tailwindConfig().theme.colors.blue[500] + '20',
            pointBackgroundColor: tailwindConfig().theme.colors.blue[500],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: tailwindConfig().theme.colors.blue[500],
          },
          {
            label: 'Top Competitor',
            data: [90, 70, 85, 85, 90, 55],
            borderColor: tailwindConfig().theme.colors.red[500],
            backgroundColor: tailwindConfig().theme.colors.red[500] + '20',
            pointBackgroundColor: tailwindConfig().theme.colors.red[500],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: tailwindConfig().theme.colors.red[500],
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
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
            },
          },
        },
      },
    });

    return () => {
      if (competitorRadarInstance.current) {
        competitorRadarInstance.current.destroy();
      }
    };
  }, [showCompetitors, deal]);

  return (
    <div className="space-y-6">
      {/* Competitive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {competitiveMetrics.map((metric, index) => {
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.subtext}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Performance with Share of Voice */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Platform Performance & Market Share</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialMetrics.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${platform.bgColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${platform.growth.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {platform.growth}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {platform.followers.toLocaleString()}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Followers</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Engagement</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{platform.engagement}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Share of Voice</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{platform.shareOfVoice}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Rate Comparison</h3>
        <div className="relative h-64">
          <canvas ref={engagementChartRef} className="w-full h-full"></canvas>
        </div>
      </div>

      {/* Social Media Competitor Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Social Media Competitor Analysis</h3>
          <button 
            onClick={() => setShowCompetitors(!showCompetitors)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showCompetitors ? 'Hide' : 'Show'} Competitors
          </button>
        </div>
        
        {showCompetitors && (
          <>
            {/* Competitive Positioning Radar */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Competitive Positioning</h4>
              <div className="relative h-64">
                <canvas ref={competitorRadarRef} className="w-full h-full"></canvas>
              </div>
            </div>

            {/* Competitor Details */}
            <div className="space-y-4">
              {socialCompetitors.map((competitor) => (
                <div key={competitor.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{competitor.competitor_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(competitor.total_reach || 0).toLocaleString()} total reach • {competitor.share_of_voice}% share of voice
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {competitor.engagement_rate_avg}% avg engagement
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {competitor.post_frequency_weekly} posts/week
                      </p>
                    </div>
                  </div>

                  {/* Platform Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                    {Object.entries(competitor.platform_presence || {}).map(([platform, data]) => (
                      <div key={platform} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{platform}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {((data as any).followers / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {(data as any).engagement}%
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Content Strategy</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{competitor.content_strategy}</p>
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

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Audience Overlap:</span> {competitor.audience_overlap_percentage}% • 
                      <span className="font-medium ml-2">Strategy:</span> {competitor.audience_overlap_percentage! > 30 ? 'Direct competitor' : 'Adjacent market'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Social Media Opportunities & Threats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Social Media Opportunities & Threats</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">Growth Opportunities</h4>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• TikTok market untapped (150K potential)</li>
              <li>• Instagram Reels underutilized</li>
              <li>• Influencer partnerships available</li>
              <li>• User-generated content campaigns</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Content Gaps</h4>
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Educational video content</li>
              <li>• Behind-the-scenes content</li>
              <li>• Live streaming opportunities</li>
              <li>• Community challenges</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-red-900 dark:text-red-100">Competitive Threats</h4>
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• Competitor viral campaign ongoing</li>
              <li>• Declining organic reach on FB</li>
              <li>• New competitor with 50K/mo growth</li>
              <li>• Platform algorithm changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealSocialAnalysisEnhanced;