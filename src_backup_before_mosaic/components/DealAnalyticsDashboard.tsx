import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Target, 
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface PipelineMetrics {
  totalDeals: number;
  totalValue: number;
  averageDealSize: number;
  conversionRate: number;
  averageTimeToClose: number;
  closedWonValue: number;
  closedLostValue: number;
  activeDeals: number;
}

interface StageMetrics {
  stage: string;
  count: number;
  value: number;
  averageTime: number;
  conversionRate: number;
}

interface TrendData {
  period: string;
  newDeals: number;
  closedWon: number;
  closedLost: number;
  revenue: number;
}

interface SourceMetrics {
  source: string;
  count: number;
  value: number;
  conversionRate: number;
}

export default function DealAnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics | null>(null);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<SourceMetrics[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Fetch pipeline metrics
      await Promise.all([
        fetchPipelineMetrics(start, end),
        fetchStageMetrics(start, end),
        fetchTrendData(start, end),
        fetchSourceMetrics(start, end)
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineMetrics = async (start: Date, end: Date) => {
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (!deals) return;

    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
    const averageDealSize = totalValue / Math.max(totalDeals, 1);
    
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won');
    const closedLostDeals = deals.filter(deal => deal.stage === 'closed_lost');
    const closedDeals = [...closedWonDeals, ...closedLostDeals];
    
    const conversionRate = closedDeals.length > 0 ? (closedWonDeals.length / closedDeals.length) * 100 : 0;
    const closedWonValue = closedWonDeals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
    const closedLostValue = closedLostDeals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
    
    // Calculate average time to close
    const closedDealsWithDates = closedDeals.filter(deal => deal.created_at && deal.stage_updated_at);
    const averageTimeToClose = closedDealsWithDates.length > 0
      ? closedDealsWithDates.reduce((sum, deal) => {
          const created = new Date(deal.created_at);
          const closed = new Date(deal.stage_updated_at);
          return sum + (closed.getTime() - created.getTime());
        }, 0) / closedDealsWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const activeDeals = deals.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage)).length;

    setPipelineMetrics({
      totalDeals,
      totalValue,
      averageDealSize,
      conversionRate,
      averageTimeToClose,
      closedWonValue,
      closedLostValue,
      activeDeals
    });
  };

  const fetchStageMetrics = async (start: Date, end: Date) => {
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (!deals) return;

    const stages = ['prospecting', 'qualified_leads', 'first_contact', 'due_diligence', 'loi', 'under_contract', 'closed_won', 'closed_lost'];
    
    const stageData: StageMetrics[] = stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage === stage);
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
      
      // Calculate average time in stage
      const dealsWithTime = stageDeals.filter(deal => deal.stage_updated_at);
      const averageTime = dealsWithTime.length > 0
        ? dealsWithTime.reduce((sum, deal) => {
            const stageUpdated = new Date(deal.stage_updated_at);
            const now = new Date();
            return sum + (now.getTime() - stageUpdated.getTime());
          }, 0) / dealsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate conversion rate (deals that moved from this stage to next)
      const conversionRate = 0; // This would require more complex tracking

      return {
        stage,
        count,
        value,
        averageTime,
        conversionRate
      };
    });

    setStageMetrics(stageData);
  };

  const fetchTrendData = async (start: Date, end: Date) => {
    // Generate trend data for the time period
    const periods: TrendData[] = [];
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const periodSize = Math.max(1, Math.floor(daysDiff / 10)); // Divide into ~10 periods

    for (let i = 0; i < daysDiff; i += periodSize) {
      const periodStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(Math.min(start.getTime() + (i + periodSize) * 24 * 60 * 60 * 1000, end.getTime()));

      const { data: periodDeals } = await supabase
        .from('deals')
        .select('*')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (periodDeals) {
        const newDeals = periodDeals.length;
        const closedWon = periodDeals.filter(deal => deal.stage === 'closed_won').length;
        const closedLost = periodDeals.filter(deal => deal.stage === 'closed_lost').length;
        const revenue = periodDeals
          .filter(deal => deal.stage === 'closed_won')
          .reduce((sum, deal) => sum + (deal.asking_price || 0), 0);

        periods.push({
          period: format(periodStart, 'MMM d'),
          newDeals,
          closedWon,
          closedLost,
          revenue
        });
      }
    }

    setTrendData(periods);
  };

  const fetchSourceMetrics = async (start: Date, end: Date) => {
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (!deals) return;

    const sources = [...new Set(deals.map(deal => deal.source).filter(Boolean))];
    
    const sourceData: SourceMetrics[] = sources.map(source => {
      const sourceDeals = deals.filter(deal => deal.source === source);
      const count = sourceDeals.length;
      const value = sourceDeals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
      
      const closedDeals = sourceDeals.filter(deal => ['closed_won', 'closed_lost'].includes(deal.stage));
      const wonDeals = sourceDeals.filter(deal => deal.stage === 'closed_won');
      const conversionRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

      return {
        source,
        count,
        value,
        conversionRate
      };
    });

    setSourceMetrics(sourceData.sort((a, b) => b.value - a.value));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ComponentType<any>;
    format?: 'number' | 'currency' | 'percent' | 'days';
  }) => {
    const formatValue = () => {
      switch (format) {
        case 'currency':
          return formatCurrency(value);
        case 'percent':
          return formatPercent(value);
        case 'days':
          return `${Math.round(value)} days`;
        default:
          return value.toLocaleString();
      }
    };

    const getChangeIcon = () => {
      if (!change) return null;
      if (changeType === 'positive') return <ArrowUp className="w-3 h-3" />;
      if (changeType === 'negative') return <ArrowDown className="w-3 h-3" />;
      return <Minus className="w-3 h-3" />;
    };

    const getChangeColor = () => {
      if (changeType === 'positive') return 'text-green-600';
      if (changeType === 'negative') return 'text-red-600';
      return 'text-gray-600';
    };

    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{formatValue()}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor()}`}>
                {getChangeIcon()}
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Deal Analytics</h1>
            <p className="text-gray-600 mt-1">Track your pipeline performance and metrics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="thisMonth">This month</option>
              <option value="lastMonth">Last month</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Pipeline Value"
            value={pipelineMetrics?.totalValue || 0}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title="Active Deals"
            value={pipelineMetrics?.activeDeals || 0}
            icon={Target}
          />
          <MetricCard
            title="Conversion Rate"
            value={pipelineMetrics?.conversionRate || 0}
            icon={TrendingUp}
            format="percent"
          />
          <MetricCard
            title="Avg Time to Close"
            value={pipelineMetrics?.averageTimeToClose || 0}
            icon={Clock}
            format="days"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline by Stage */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Pipeline by Stage</h3>
            <div className="space-y-4">
              {stageMetrics.map(stage => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium capitalize">
                        {stage.stage.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {stage.count} deals • {formatCurrency(stage.value)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.max(5, (stage.value / (pipelineMetrics?.totalValue || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Top Deal Sources</h3>
            <div className="space-y-4">
              {sourceMetrics.slice(0, 5).map((source, index) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{source.source}</p>
                      <p className="text-sm text-gray-600">
                        {source.count} deals • {formatPercent(source.conversionRate)} conversion
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(source.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Deal Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">New Deals</h4>
              <div className="space-y-2">
                {trendData.slice(-5).map(period => (
                  <div key={period.period} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{period.period}</span>
                    <span className="font-medium">{period.newDeals}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Closed Won</h4>
              <div className="space-y-2">
                {trendData.slice(-5).map(period => (
                  <div key={period.period} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{period.period}</span>
                    <span className="font-medium text-green-600">{period.closedWon}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Revenue</h4>
              <div className="space-y-2">
                {trendData.slice(-5).map(period => (
                  <div key={period.period} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{period.period}</span>
                    <span className="font-medium">{formatCurrency(period.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}