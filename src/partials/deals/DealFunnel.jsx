import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function DealFunnel() {
  const funnelData = [
    { stage: 'Prospecting', count: 45, value: 18.2 },
    { stage: 'Initial Contact', count: 28, value: 11.8 },
    { stage: 'LOI Submitted', count: 18, value: 9.5 },
    { stage: 'Due Diligence', count: 12, value: 7.2 },
    { stage: 'Negotiation', count: 8, value: 4.8 },
    { stage: 'Under Contract', count: 5, value: 3.2 },
    { stage: 'Closing', count: 3, value: 2.1 },
  ];

  const colors = [
    '#6B7280', '#3B82F6', '#EAB308', '#8B5CF6', 
    '#F97316', '#6366F1', '#10B981'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Deal Funnel</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Conversion: 6.7%
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="stage" 
              className="text-sm"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-sm" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'count' ? `${value} deals` : `$${value}M`,
                name === 'count' ? 'Deal Count' : 'Total Value'
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Rates */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">62%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Prospect → Contact</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">44%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">DD → Negotiation</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">60%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Contract → Close</div>
        </div>
      </div>
    </div>
  );
}

export default DealFunnel;