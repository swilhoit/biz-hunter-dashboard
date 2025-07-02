import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EditMenu from '../../components/DropdownEditMenu';

function ASINAlerts() {
  const [filter, setFilter] = useState('all');
  
  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'BSR Drop Alert',
      message: 'Kitchen Scale BSR dropped to #2,100 (was #1,250)',
      asin: 'B087NWQT2M',
      deal: 'Kitchen Gadgets Pro',
      time: '2 hours ago',
      severity: 'medium',
      action: 'Review pricing strategy'
    },
    {
      id: 2,
      type: 'critical',
      title: 'Competitor Price Drop',
      message: 'Competitor reduced price to $44.99 (20% below ours)',
      asin: 'B089QX4B9N',
      deal: 'Kitchen Gadgets Pro',
      time: '4 hours ago',
      severity: 'high',
      action: 'Immediate price review needed'
    },
    {
      id: 3,
      type: 'success',
      title: 'Sales Surge',
      message: 'Wireless Charger sales up 45% this week',
      asin: 'B094ABC123',
      deal: 'SmartHome Essentials',
      time: '6 hours ago',
      severity: 'low',
      action: 'Consider inventory increase'
    },
    {
      id: 4,
      type: 'warning',
      title: 'Review Velocity Down',
      message: 'Gaming Mouse Pad receiving fewer reviews (3/week vs 8/week)',
      asin: 'B096DEF456',
      deal: 'SmartHome Essentials',
      time: '1 day ago',
      severity: 'medium',
      action: 'Check product listing quality'
    },
    {
      id: 5,
      type: 'info',
      title: 'Seasonal Trend',
      message: 'Pet supplies showing typical Q4 uptick',
      asin: 'B098GHI789',
      deal: 'Pet Supplies Direct',
      time: '2 days ago',
      severity: 'low',
      action: 'Monitor inventory levels'
    }
  ];
  
  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };
  
  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.type === filter);

  return (
    <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">ASIN Alerts</h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Mark All Read
              </Link>
            </li>
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Alert Settings
              </Link>
            </li>
          </EditMenu>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2 mt-4">
          {['all', 'critical', 'warning', 'success', 'info'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === filterType
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </header>
      
      <div className="p-3">
        {/* Alert Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
            <div className="text-lg font-bold text-red-600">1</div>
            <div className="text-xs text-red-600/80">Critical</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">2</div>
            <div className="text-xs text-yellow-600/80">Warning</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
            <div className="text-lg font-bold text-green-600">1</div>
            <div className="text-xs text-green-600/80">Good News</div>
          </div>
        </div>
        
        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {alert.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <Link 
                        to={`/deals/1`}
                        className="text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium"
                      >
                        {alert.deal}
                      </Link>
                      <span className="mx-1">•</span>
                      <span>{alert.asin}</span>
                    </div>
                    <span>{alert.time}</span>
                  </div>
                  <div className="mt-2">
                    <button className="text-xs text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium">
                      {alert.action}
                    </button>
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

export default ASINAlerts;