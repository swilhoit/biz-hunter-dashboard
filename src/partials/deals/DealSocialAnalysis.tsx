import React, { useEffect, useRef, useState } from 'react';
import { Deal } from '../../types/deal';
import { SocialCompetitor } from '../../types/market-analysis';
import { MessageCircle, Heart, Share2, Users, TrendingUp, Instagram, Youtube, Facebook, Target, AlertCircle } from 'lucide-react';
import BarChart04 from '../../charts/BarChart04';
import PolarChart from '../../charts/PolarChart';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { tailwindConfig } from '../../utils/Utils';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DealSocialAnalysisProps {
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

function DealSocialAnalysis({ deal }: DealSocialAnalysisProps) {
  const engagementChartRef = useRef<HTMLCanvasElement>(null);
  const engagementChartInstance = useRef<Chart | null>(null);
  const [showCompetitors, setShowCompetitors] = useState(false);
  
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
      },
      total_reach: 291000,
      engagement_rate_avg: 5.1,
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
      },
      total_reach: 124000,
      engagement_rate_avg: 6.0,
      post_frequency_weekly: 21,
      content_strategy: 'Educational content with product highlights',
      strengths: ['High quality content', 'Expert positioning', 'Loyal audience'],
      weaknesses: ['Limited reach', 'Slow growth'],
      audience_overlap_percentage: 28,
      share_of_voice: 15,
    },
  ];

  // Mock social media data
  const socialMetrics = [
    {
      platform: 'Instagram',
      followers: 45600,
      growth: '+12%',
      engagement: '4.8%',
      icon: Instagram,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      platform: 'Facebook',
      followers: 32400,
      growth: '+5%',
      engagement: '3.2%',
      icon: Facebook,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-600',
    },
    {
      platform: 'YouTube',
      followers: 28900,
      growth: '+18%',
      engagement: '6.5%',
      icon: Youtube,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-600',
    },
    {
      platform: 'Twitter/X',
      followers: 12300,
      growth: '+8%',
      engagement: '2.1%',
      icon: TwitterIcon,
      color: 'text-gray-900 dark:text-gray-100',
      bgColor: 'bg-gray-900 dark:bg-gray-100',
    },
  ];

  const topPosts = [
    {
      platform: 'Instagram',
      content: 'New eco-friendly pet bowl launch! 🌱',
      likes: 3245,
      comments: 234,
      shares: 567,
      date: '2 days ago',
    },
    {
      platform: 'Facebook',
      content: 'Customer success story: Meet Luna! 🐕',
      likes: 1892,
      comments: 156,
      shares: 423,
      date: '5 days ago',
    },
    {
      platform: 'YouTube',
      content: 'Pet Care Tips: Summer Edition',
      likes: 5623,
      comments: 789,
      shares: 234,
      date: '1 week ago',
    },
  ];

  const audienceInsights = {
    demographics: {
      age: [
        { range: '18-24', percentage: 15 },
        { range: '25-34', percentage: 35 },
        { range: '35-44', percentage: 30 },
        { range: '45-54', percentage: 15 },
        { range: '55+', percentage: 5 },
      ],
      gender: {
        female: 68,
        male: 30,
        other: 2,
      },
    },
    interests: ['Pet Care', 'Sustainability', 'Organic Products', 'DIY', 'Outdoor Activities'],
    topLocations: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
  };

  // Initialize engagement chart
  useEffect(() => {
    if (!engagementChartRef.current) return;

    // Destroy existing chart
    if (engagementChartInstance.current) {
      engagementChartInstance.current.destroy();
    }

    const ctx = engagementChartRef.current.getContext('2d');
    if (!ctx) return;

    engagementChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Posts',
            data: [3, 2, 4, 3, 5, 7, 6],
            backgroundColor: tailwindConfig().theme.colors.blue[500],
            yAxisID: 'y',
          },
          {
            label: 'Engagement Rate (%)',
            data: [4.2, 3.8, 5.1, 4.5, 6.2, 8.3, 7.1],
            backgroundColor: tailwindConfig().theme.colors.purple[500],
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Number of Posts',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Engagement Rate (%)',
            },
            grid: {
              drawOnChartArea: false,
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

  return (
    <div className="space-y-6">
      {/* Social Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {socialMetrics.map((platform, index) => {
          const Icon = platform.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${platform.bgColor}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium ${platform.growth.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {platform.growth}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {platform.followers.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
              <div className="mt-2 flex items-center">
                <Heart className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {platform.engagement} engagement
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weekly Engagement Analytics</h3>
        <div className="relative h-64">
          <canvas ref={engagementChartRef} className="w-full h-full"></canvas>
        </div>
      </div>

      {/* Audience Insights & Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audience Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Audience Insights</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age Distribution</h4>
              <div className="space-y-2">
                {audienceInsights.demographics.age.map((age, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{age.range}</span>
                    <div className="flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${age.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
                      {age.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender Split</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Female {audienceInsights.demographics.gender.female}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Male {audienceInsights.demographics.gender.male}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Other {audienceInsights.demographics.gender.other}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Interests</h4>
              <div className="flex flex-wrap gap-2">
                {audienceInsights.interests.map((interest, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Performing Posts</h3>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {post.platform}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {post.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <Heart className="w-3 h-3 mr-1" />
                        {post.likes.toLocaleString()}
                      </div>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {post.comments}
                      </div>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <Share2 className="w-3 h-3 mr-1" />
                        {post.shares}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Media Opportunities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Social Media Opportunities</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Content Strategy</h4>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
              <li>• User-generated content campaigns</li>
              <li>• Behind-the-scenes content</li>
              <li>• Educational pet care series</li>
              <li>• Influencer collaborations</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Platform Growth</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Launch TikTok presence</li>
              <li>• Pinterest for product discovery</li>
              <li>• LinkedIn for B2B opportunities</li>
              <li>• Reddit community engagement</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Monetization</h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Social commerce integration</li>
              <li>• Affiliate marketing program</li>
              <li>• Sponsored content opportunities</li>
              <li>• Live shopping events</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Key Recommendations</h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• Increase posting frequency on Instagram to 2x daily (est. +25% engagement)</li>
            <li>• Launch YouTube Shorts for quick tips (est. +40% reach)</li>
            <li>• Implement social listening for customer insights</li>
            <li>• Create brand hashtag campaign for UGC collection</li>
          </ul>
        </div>
      </div>

      {/* Social Media Competitive Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Social Media Competitive Analysis</h3>
          <button 
            onClick={() => setShowCompetitors(!showCompetitors)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showCompetitors ? 'Hide' : 'Show'} Competitors
          </button>
        </div>
        
        {showCompetitors && (
          <div className="space-y-4">
            {/* Competitive Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">14%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Share of Voice</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Heart className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">4.2%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Engagement</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#4</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Market Position</p>
              </div>
            </div>

            {/* Engagement Comparison Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Engagement Rate Comparison</h4>
              <BarChart04
                data={{
                  labels: ['Instagram', 'Facebook', 'YouTube', 'Twitter/X'],
                  datasets: [
                    {
                      label: 'Your Brand',
                      data: [4.8, 3.2, 6.5, 2.1],
                      backgroundColor: tailwindConfig().theme.colors.blue[500],
                      borderRadius: 4,
                    },
                    {
                      label: 'Competitor Average',
                      data: [6.5, 3.6, 8.2, 2.5],
                      backgroundColor: tailwindConfig().theme.colors.gray[400],
                      borderRadius: 4,
                    },
                  ],
                }}
                width={595}
                height={248}
              />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
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
                </div>
              ))}
            </div>

            {/* Social Opportunities */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Competitive Opportunities
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• TikTok market untapped - competitors absent</li>
                <li>• Instagram Reels underutilized by competition</li>
                <li>• Community building opportunity on Facebook</li>
                <li>• Influencer partnerships gap in market</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DealSocialAnalysis;