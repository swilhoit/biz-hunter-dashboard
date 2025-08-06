import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function TimelineAnalysis() {
  const timelineData = [
    { stage: 'Prospecting', avgDays: 14, success: 62, volume: 45 },
    { stage: 'Analysis', avgDays: 6, success: 65, volume: 32 },
    { stage: 'Initial Contact', avgDays: 8, success: 64, volume: 28 },
    { stage: 'LOI Submitted', avgDays: 12, success: 67, volume: 18 },
    { stage: 'Due Diligence', avgDays: 21, success: 67, volume: 12 },
    { stage: 'Negotiation', avgDays: 9, success: 63, volume: 8 },
    { stage: 'Under Contract', avgDays: 7, success: 80, volume: 5 },
    { stage: 'Closing', avgDays: 5, success: 100, volume: 3 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stage Timeline & Success Rate</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Avg Days</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-2 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="stage" 
              className="text-sm"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" className="text-sm" />
            <YAxis yAxisId="right" orientation="right" className="text-sm" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'avgDays' ? `${value} days` : 
                name === 'success' ? `${value}%` : `${value} deals`,
                name === 'avgDays' ? 'Average Days' : 
                name === 'success' ? 'Success Rate' : 'Volume'
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="avgDays" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="success" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">76 days</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Deal Cycle</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">67%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overall Success</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">21 days</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Longest Stage</div>
        </div>
      </div>
    </div>
  );
}

export default TimelineAnalysis;