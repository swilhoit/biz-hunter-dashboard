import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, Zap } from 'lucide-react';

function AnalyticsOverview({ dateRange }) {
  // Mock data - in real app this would come from API based on dateRange
  const metrics = [
    {
      title: 'Total Pipeline Value',
      value: '$14.0M',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Deals Closed',
      value: '8',
      change: '+33.3%',
      changeType: 'positive',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Avg Deal Size',
      value: '$2.8M',
      change: '-5.2%',
      changeType: 'negative',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Close Rate',
      value: '24%',
      change: '+8.1%',
      changeType: 'positive',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Avg Time to Close',
      value: '67 days',
      change: '-12 days',
      changeType: 'positive',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'ROI Potential',
      value: '28.5%',
      change: '+2.3%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className={`flex items-center text-sm ${
                metric.changeType === 'positive' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {metric.changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {metric.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metric.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AnalyticsOverview;