import React from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';

function MarketInsightsCard() {

  const insights = [
    {
      id: 1,
      title: 'Home & Kitchen category growth up 15%',
      description: 'Strong Q4 performance across kitchen gadgets and home organization products.',
      trend: 'up',
      impact: 'high',
      date: '2 days ago'
    },
    {
      id: 2,
      title: 'Amazon advertising costs increasing',
      description: 'Average CPC up 8% month-over-month, affecting profit margins.',
      trend: 'down',
      impact: 'medium',
      date: '3 days ago'
    },
    {
      id: 3,
      title: 'New competitor analysis available',
      description: 'Market share data updated for pet supplies vertical.',
      trend: 'neutral',
      impact: 'low',
      date: '1 week ago'
    }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="fill-current text-green-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0L3 5h3v11h4V5h3L8 0z" />
          </svg>
        );
      case 'down':
        return (
          <svg className="fill-current text-red-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 16l5-5h-3V0H6v11H3l5 5z" />
          </svg>
        );
      default:
        return (
          <svg className="fill-current text-gray-500" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
          </svg>
        );
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-500/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-500/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
    }
  };

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Market Insights</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="/deals/analytics">
                View All Insights
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Generate Report
              </Link>
            </li>
          </EditMenu>
        </div>
      </header>
      <div className="p-3">
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="border-l-4 border-violet-500 pl-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-1">
                    {getTrendIcon(insight.trend)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {insight.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MarketInsightsCard;