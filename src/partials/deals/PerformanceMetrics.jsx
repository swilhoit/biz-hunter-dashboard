import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

function PerformanceMetrics() {
  const performanceData = [
    { month: 'Jan', deals: 12, value: 4.2, avgMultiple: 2.8 },
    { month: 'Feb', deals: 15, value: 5.1, avgMultiple: 2.9 },
    { month: 'Mar', deals: 18, value: 6.8, avgMultiple: 2.7 },
    { month: 'Apr', deals: 22, value: 7.5, avgMultiple: 2.6 },
    { month: 'May', deals: 19, value: 8.2, avgMultiple: 2.8 },
    { month: 'Jun', deals: 25, value: 9.1, avgMultiple: 2.9 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Performance Trends</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Deal Count</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Total Value ($M)</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" className="text-sm" />
            <YAxis yAxisId="left" className="text-sm" />
            <YAxis yAxisId="right" orientation="right" className="text-sm" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'deals' ? `${value} deals` : `$${value}M`,
                name === 'deals' ? 'Deal Count' : 'Total Value'
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="deals"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorDeals)"
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">+45%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Deal Volume Growth</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">$9.1M</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Peak Month Value</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">2.8x</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Multiple</div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMetrics;