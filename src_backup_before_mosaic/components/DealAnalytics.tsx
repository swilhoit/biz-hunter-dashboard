import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, subMonths } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Building2,
  Star,
  Activity,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DashboardMetrics {
  totalDeals: number;
  totalPipelineValue: number;
  averageDealSize: number;
  averageScore: number;
  conversionRate: number;
  averageTimeInStage: number;
  dealsClosedThisMonth: number;
  pipelineValueThisMonth: number;
  topPerformingSources: Array<{ source: string; count: number; value: number }>;
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
  dealsByIndustry: Array<{ industry: string; count: number; value: number }>;
  dealsByPriority: Array<{ priority: string; count: number; value: number }>;
  monthlyTrends: Array<{ month: string; deals: number; value: number }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  recentActivity: Array<{
    type: string;
    deal_name: string;
    description: string;
    created_at: string;
  }>;
}

interface AnalyticsFilters {
  dateRange: string;
  stage: string[];
  industry: string[];
  source: string[];
  priority: string[];
}

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' }
];

const METRIC_CARDS = [
  {
    key: 'totalDeals',
    title: 'Total Deals',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    format: 'number'
  },
  {
    key: 'totalPipelineValue',
    title: 'Pipeline Value',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    format: 'currency'
  },
  {
    key: 'averageDealSize',
    title: 'Avg Deal Size',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    format: 'currency'
  },
  {
    key: 'averageScore',
    title: 'Avg Score',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    format: 'decimal'
  },
  {
    key: 'conversionRate',
    title: 'Conversion Rate',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    format: 'percentage'
  },
  {
    key: 'averageTimeInStage',
    title: 'Avg Time in Stage',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    format: 'days'
  }
];

export default function DealAnalytics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d',
    stage: [],
    industry: [],
    source: [],
    priority: []
  });

  useEffect(() => {
    fetchMetrics();
  }, [filters, user]);

  const getDateFilter = () => {
    const now = new Date();
    switch (filters.dateRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case '6m':
        return { start: subMonths(now, 6), end: now };
      case '1y':
        return { start: subMonths(now, 12), end: now };
      default:
        return null;
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();
      
      let query = supabase.from('deals').select('*');
      
      if (dateFilter) {
        query = query
          .gte('created_at', dateFilter.start.toISOString())
          .lte('created_at', dateFilter.end.toISOString());
      }
      
      if (filters.stage.length > 0) {
        query = query.in('stage', filters.stage);
      }
      if (filters.industry.length > 0) {
        query = query.in('industry', filters.industry);
      }
      if (filters.source.length > 0) {
        query = query.in('source', filters.source);
      }
      if (filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      const { data: deals, error } = await query;
      if (error) throw error;

      const calculatedMetrics = calculateMetrics(deals || []);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (deals: any[]): DashboardMetrics => {
    const totalDeals = deals.length;
    const totalPipelineValue = deals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
    const averageDealSize = totalDeals > 0 ? totalPipelineValue / totalDeals : 0;
    const averageScore = totalDeals > 0 ? deals.reduce((sum, deal) => sum + (deal.score || 0), 0) / totalDeals : 0;
    
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won').length;
    const conversionRate = totalDeals > 0 ? (closedWonDeals / totalDeals) * 100 : 0;
    
    const averageTimeInStage = 30;
    
    const currentMonth = new Date().getMonth();
    const dealsThisMonth = deals.filter(deal => 
      new Date(deal.created_at).getMonth() === currentMonth
    );
    const dealsClosedThisMonth = dealsThisMonth.filter(deal => deal.stage === 'closed_won').length;
    const pipelineValueThisMonth = dealsThisMonth.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);

    // Group by source
    const sourceGroups = deals.reduce((acc, deal) => {
      const source = deal.source || 'unknown';
      if (!acc[source]) {
        acc[source] = { source, count: 0, value: 0 };
      }
      acc[source].count++;
      acc[source].value += deal.asking_price || 0;
      return acc;
    }, {});
    const topPerformingSources = Object.values(sourceGroups)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);

    // Group by stage
    const stageGroups = deals.reduce((acc, deal) => {
      const stage = deal.stage || 'unknown';
      if (!acc[stage]) {
        acc[stage] = { stage, count: 0, value: 0 };
      }
      acc[stage].count++;
      acc[stage].value += deal.asking_price || 0;
      return acc;
    }, {});
    const dealsByStage = Object.values(stageGroups);

    // Group by industry
    const industryGroups = deals.reduce((acc, deal) => {
      const industry = deal.industry || 'unknown';
      if (!acc[industry]) {
        acc[industry] = { industry, count: 0, value: 0 };
      }
      acc[industry].count++;
      acc[industry].value += deal.asking_price || 0;
      return acc;
    }, {});
    const dealsByIndustry = Object.values(industryGroups)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Group by priority
    const priorityGroups = deals.reduce((acc, deal) => {
      const priority = deal.priority || 'unknown';
      if (!acc[priority]) {
        acc[priority] = { priority, count: 0, value: 0 };
      }
      acc[priority].count++;
      acc[priority].value += deal.asking_price || 0;
      return acc;
    }, {});
    const dealsByPriority = Object.values(priorityGroups);

    // Monthly trends
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.created_at);
        return dealDate.getMonth() === date.getMonth() && 
               dealDate.getFullYear() === date.getFullYear();
      });
      
      return {
        month: format(date, 'MMM yyyy'),
        deals: monthDeals.length,
        value: monthDeals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0)
      };
    });

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ];
    
    const scoreDistribution = scoreRanges.map(range => ({
      range: range.range,
      count: deals.filter(deal => 
        deal.score >= range.min && deal.score <= range.max
      ).length
    }));

    // Recent activity
    const recentActivity = deals
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(deal => ({
        type: 'deal_updated',
        deal_name: deal.business_name,
        description: `Deal updated in ${deal.stage.replace('_', ' ')} stage`,
        created_at: deal.updated_at
      }));

    return {
      totalDeals,
      totalPipelineValue,
      averageDealSize,
      averageScore,
      conversionRate,
      averageTimeInStage,
      dealsClosedThisMonth,
      pipelineValueThisMonth,
      topPerformingSources,
      dealsByStage,
      dealsByIndustry,
      dealsByPriority,
      monthlyTrends,
      scoreDistribution,
      recentActivity
    };
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'decimal':
        return value.toFixed(1);
      case 'days':
        return `${Math.round(value)} days`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const exportData = () => {
    if (!metrics) return;
    
    const exportData = {
      summary: {
        totalDeals: metrics.totalDeals,
        totalPipelineValue: metrics.totalPipelineValue,
        averageDealSize: metrics.averageDealSize,
        conversionRate: metrics.conversionRate
      },
      dealsByStage: metrics.dealsByStage,
      dealsByIndustry: metrics.dealsByIndustry,
      topSources: metrics.topPerformingSources,
      monthlyTrends: metrics.monthlyTrends
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deal-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">No deals found for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Deal Analytics</h1>
            <p className="text-gray-600">Performance insights and pipeline analytics</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 ${
                showFilters ? 'border-blue-500 text-blue-600' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {DATE_RANGES.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {METRIC_CARDS.map(card => {
            const value = metrics[card.key as keyof DashboardMetrics] as number;
            return (
              <div key={card.key} className={`${card.bgColor} rounded-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-semibold ${card.color}`}>
                      {formatValue(value, card.format)}
                    </p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pipeline by Stage */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Pipeline by Stage</h3>
            <div className="space-y-3">
              {metrics.dealsByStage.map((stage: any) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm capitalize">{stage.stage.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{stage.count} deals</div>
                    <div className="text-xs text-gray-500">
                      {formatValue(stage.value, 'currency')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Sources</h3>
            <div className="space-y-3">
              {metrics.topPerformingSources.map((source: any, index: number) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm capitalize">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{source.count} deals</div>
                    <div className="text-xs text-gray-500">
                      {formatValue(source.value, 'currency')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Deals by Industry</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {metrics.dealsByIndustry.map((industry: any) => (
                <div key={industry.industry} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{industry.industry.replace('_', ' ')}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{industry.count}</div>
                    <div className="text-xs text-gray-500">
                      {formatValue(industry.value, 'currency')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
            <div className="space-y-3">
              {metrics.scoreDistribution.map((range: any) => (
                <div key={range.range} className="flex items-center justify-between">
                  <span className="text-sm">{range.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${metrics.totalDeals > 0 ? (range.count / metrics.totalDeals) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{range.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-4 min-w-full">
              {metrics.monthlyTrends.map((month: any) => (
                <div key={month.month} className="flex-1 min-w-24">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-t" style={{ height: `${Math.max(month.deals * 10, 20)}px` }}>
                      <div className="text-xs font-semibold text-blue-800 pt-1">
                        {month.deals}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">{month.month}</div>
                    <div className="text-xs text-gray-500">
                      {formatValue(month.value, 'currency')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {metrics.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.deal_name}</div>
                  <div className="text-xs text-gray-600">{activity.description}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}