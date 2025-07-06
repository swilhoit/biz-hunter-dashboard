import React, { useEffect, useRef, useState } from 'react';
import { Deal } from '../../types/deal';
import { AmazonCompetitor } from '../../types/market-analysis';
import { Package, Star, TrendingUp, BarChart3, ShoppingCart, Award, Users, AlertCircle, Target } from 'lucide-react';
import DoughnutChart from '../../charts/DoughnutChart';
import { tailwindConfig } from '../../utils/Utils';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DealAmazonMetricsEnhancedProps {
  deal: Deal;
}

function DealAmazonMetricsEnhanced({ deal }: DealAmazonMetricsEnhancedProps) {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const competitorChartRef = useRef<HTMLCanvasElement>(null);
  const competitorChartInstance = useRef<Chart | null>(null);
  
  const [showCompetitors, setShowCompetitors] = useState(true);

  // Mock competitor data - in real app this would come from API
  const amazonCompetitors: AmazonCompetitor[] = [
    {
      id: '1',
      deal_id: deal.id,
      competitor_name: 'PetLife Essentials',
      store_url: 'https://amazon.com/stores/petlife',
      estimated_revenue: 3200000,
      product_count: 87,
      avg_rating: 4.6,
      review_count: 15420,
      price_range_low: 12.99,
      price_range_high: 89.99,
      market_share_percentage: 18,
      strengths: ['Brand recognition', 'Product variety', 'Prime shipping'],
      weaknesses: ['Higher prices', 'Limited customer service'],
      threat_level: 'high',
    },
    {
      id: '2',
      deal_id: deal.id,
      competitor_name: 'NaturePaws',
      store_url: 'https://amazon.com/stores/naturepaws',
      estimated_revenue: 2100000,
      product_count: 54,
      avg_rating: 4.8,
      review_count: 8932,
      price_range_low: 15.99,
      price_range_high: 125.00,
      market_share_percentage: 12,
      strengths: ['Premium quality', 'Organic focus', 'High ratings'],
      weaknesses: ['Limited product range', 'Premium pricing'],
      threat_level: 'medium',
    },
    {
      id: '3',
      deal_id: deal.id,
      competitor_name: 'BudgetPet Supplies',
      store_url: 'https://amazon.com/stores/budgetpet',
      estimated_revenue: 1800000,
      product_count: 124,
      avg_rating: 4.2,
      review_count: 22150,
      price_range_low: 5.99,
      price_range_high: 39.99,
      market_share_percentage: 10,
      strengths: ['Low prices', 'Wide selection', 'Volume sales'],
      weaknesses: ['Quality concerns', 'Lower margins'],
      threat_level: 'low',
    },
  ];

  // Mock ASIN data
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
      title: 'Market Position',
      value: '#8',
      subtext: 'in category',
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Competitive Score',
      value: '72/100',
      subtext: 'vs competitors',
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Price Position',
      value: 'Mid-Premium',
      subtext: '15% above avg',
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Brand Strength',
      value: '85/100',
      subtext: 'Strong',
      icon: Award,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  // Initialize bar chart
  useEffect(() => {
    if (!barChartRef.current) return;

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

  // Initialize competitor comparison chart
  useEffect(() => {
    if (!competitorChartRef.current || !showCompetitors) return;

    if (competitorChartInstance.current) {
      competitorChartInstance.current.destroy();
    }

    const ctx = competitorChartRef.current.getContext('2d');
    if (!ctx) return;

    const currentBusinessRevenue = deal.annual_revenue || 2500000;
    const competitors = [
      { name: deal.business_name || 'Current Business', revenue: currentBusinessRevenue / 12, color: tailwindConfig().theme.colors.green[500] },
      ...amazonCompetitors.map((comp, idx) => ({
        name: comp.competitor_name,
        revenue: (comp.estimated_revenue || 0) / 12,
        color: idx === 0 ? tailwindConfig().theme.colors.red[500] : 
               idx === 1 ? tailwindConfig().theme.colors.orange[500] : 
               tailwindConfig().theme.colors.yellow[500]
      }))
    ];

    competitorChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: competitors.map(c => c.name),
        datasets: [{
          label: 'Monthly Revenue',
          data: competitors.map(c => c.revenue),
          backgroundColor: competitors.map(c => c.color),
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
                return `$${(value as number / 1000).toFixed(0)}K`;
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
      if (competitorChartInstance.current) {
        competitorChartInstance.current.destroy();
      }
    };
  }, [showCompetitors, deal]);

  const getThreatLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Competitive Metrics */}
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
                  {metric.subtext && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{metric.subtext}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Competitive Analysis Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Amazon Competitor Analysis</h3>
          <button 
            onClick={() => setShowCompetitors(!showCompetitors)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showCompetitors ? 'Hide' : 'Show'} Competitors
          </button>
        </div>
        
        {showCompetitors && (
          <>
            {/* Revenue Comparison Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Revenue Comparison</h4>
              <div className="relative h-48">
                <canvas ref={competitorChartRef} className="w-full h-full"></canvas>
              </div>
            </div>

            {/* Competitor Details */}
            <div className="space-y-4">
              {amazonCompetitors.map((competitor) => (
                <div key={competitor.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{competitor.competitor_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {competitor.product_count} products • {competitor.market_share_percentage}% market share
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getThreatLevelColor(competitor.threat_level)}`}>
                      {competitor.threat_level?.toUpperCase()} THREAT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Est. Revenue</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${(competitor.estimated_revenue || 0).toLocaleString()}/yr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {competitor.avg_rating} ({competitor.review_count?.toLocaleString()} reviews)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Price Range</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${competitor.price_range_low} - ${competitor.price_range_high}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {competitor.product_count}
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

      {/* Competitive Opportunities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Amazon Competitive Opportunities</h3>
          <button className="btn bg-purple-600 text-white hover:bg-purple-700 text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Run Analysis
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Market Gaps</h4>
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 23 high-volume keywords with no listings</li>
              <li>• Untapped sub-categories in pet wellness</li>
              <li>• Bundle opportunities identified</li>
              <li>• Premium segment underserved</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">Competitive Advantages</h4>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Superior product reviews (4.7 avg)</li>
              <li>• Faster shipping than 80% of competitors</li>
              <li>• Better pricing on 15 key products</li>
              <li>• Unique product features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealAmazonMetricsEnhanced;