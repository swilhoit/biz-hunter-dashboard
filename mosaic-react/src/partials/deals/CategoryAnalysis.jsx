import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function CategoryAnalysis() {
  const categoryData = [
    { name: 'Pet Supplies', value: 28, deals: 12, color: '#3B82F6' },
    { name: 'Home & Kitchen', value: 24, deals: 8, color: '#10B981' },
    { name: 'Sports & Outdoors', value: 18, deals: 6, color: '#8B5CF6' },
    { name: 'Baby', value: 15, deals: 4, color: '#F59E0B' },
    { name: 'Beauty', value: 9, deals: 3, color: '#EF4444' },
    { name: 'Electronics', value: 6, deals: 2, color: '#6B7280' },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Category Distribution</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          By pipeline value
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`$${value}M`, 'Pipeline Value']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Legend with Details */}
      <div className="mt-4 space-y-2">
        {categoryData.map((category, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-gray-900 dark:text-gray-100">{category.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">
                {category.deals} deals
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${category.value}M
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryAnalysis;