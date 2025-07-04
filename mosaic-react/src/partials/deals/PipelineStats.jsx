import React from 'react';
import { DollarSign, TrendingUp, Building2, Target, Clock, CheckCircle } from 'lucide-react';

function PipelineStats({ deals }) {
  const stats = React.useMemo(() => {
    const totalValue = deals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
    const activeDeals = deals.filter(deal => 
      !['closed_won', 'closed_lost'].includes(deal.status)
    ).length;
    const avgMultiple = deals.reduce((sum, deal, _, arr) => {
      const multiple = deal.valuation_multiple || 0;
      return sum + multiple / arr.length;
    }, 0);
    
    const dueDiligenceDeals = deals.filter(deal => 
      ['due_diligence', 'negotiation', 'under_contract', 'closing'].includes(deal.status)
    ).length;

    const hotDeals = deals.filter(deal => deal.priority && deal.priority >= 4).length;
    
    const recentlyAdded = deals.filter(deal => {
      if (!deal.created_at) return false;
      const created = new Date(deal.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length;

    return {
      totalValue,
      activeDeals,
      avgMultiple,
      dueDiligenceDeals,
      hotDeals,
      recentlyAdded,
    };
  }, [deals]);

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const statCards = [
    {
      title: 'Total Pipeline Value',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Active Deals',
      value: stats.activeDeals.toString(),
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Avg Multiple',
      value: `${stats.avgMultiple.toFixed(1)}x`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'In DD/Negotiation',
      value: stats.dueDiligenceDeals.toString(),
      icon: CheckCircle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'High Priority',
      value: stats.hotDeals.toString(),
      icon: Target,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Added This Week',
      value: stats.recentlyAdded.toString(),
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PipelineStats;