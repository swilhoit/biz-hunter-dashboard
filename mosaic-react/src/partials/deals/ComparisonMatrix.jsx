import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ComparisonMatrix({ selectedDeals, setSelectedDeals, filters }) {
  const [selectedMetrics, setSelectedMetrics] = useState([
    'revenue', 'profit', 'multiple', 'growth', 'margin', 'bsr', 'competition'
  ]);
  
  const allDeals = [
    {
      id: 'deal-1',
      name: 'Kitchen Gadgets Pro',
      category: 'Home & Kitchen',
      stage: 'due-diligence',
      revenue: 2400000,
      profit: 720000,
      multiple: 3.2,
      growth: 18,
      margin: 30,
      avgBSR: 1250,
      competition: 'Medium',
      riskScore: 6.5,
      teamSize: 8,
      age: 24,
      mainASINs: 3,
      marketTrend: 'Growing'
    },
    {
      id: 'deal-2',
      name: 'SmartHome Essentials',
      category: 'Electronics',
      stage: 'negotiation',
      revenue: 3100000,
      profit: 930000,
      multiple: 4.1,
      growth: 25,
      margin: 30,
      avgBSR: 890,
      competition: 'High',
      riskScore: 7.2,
      teamSize: 12,
      age: 36,
      mainASINs: 5,
      marketTrend: 'Growing'
    },
    {
      id: 'deal-3',
      name: 'Pet Supplies Direct',
      category: 'Pet Supplies',
      stage: 'initial-contact',
      revenue: 1800000,
      profit: 450000,
      multiple: 2.9,
      growth: 12,
      margin: 25,
      avgBSR: 2100,
      competition: 'Low',
      riskScore: 5.8,
      teamSize: 5,
      age: 18,
      mainASINs: 4,
      marketTrend: 'Stable'
    },
    {
      id: 'deal-4',
      name: 'Beauty Essentials',
      category: 'Beauty & Personal Care',
      stage: 'prospecting',
      revenue: 920000,
      profit: 230000,
      multiple: 2.5,
      growth: 8,
      margin: 25,
      avgBSR: 3200,
      competition: 'Medium',
      riskScore: 6.0,
      teamSize: 3,
      age: 12,
      mainASINs: 2,
      marketTrend: 'Declining'
    },
    {
      id: 'deal-5',
      name: 'Outdoor Adventure Co',
      category: 'Sports & Outdoors',
      stage: 'closing',
      revenue: 3800000,
      profit: 1140000,
      multiple: 3.8,
      growth: 22,
      margin: 30,
      avgBSR: 680,
      competition: 'Medium',
      riskScore: 6.8,
      teamSize: 15,
      age: 42,
      mainASINs: 7,
      marketTrend: 'Growing'
    }
  ];
  
  const metrics = {
    revenue: { label: 'Revenue', format: (v) => `$${(v/1000000).toFixed(1)}M`, type: 'currency' },
    profit: { label: 'Profit', format: (v) => `$${(v/1000).toFixed(0)}K`, type: 'currency' },
    multiple: { label: 'Multiple', format: (v) => `${v}x`, type: 'number' },
    growth: { label: 'Growth %', format: (v) => `${v}%`, type: 'percentage' },
    margin: { label: 'Margin %', format: (v) => `${v}%`, type: 'percentage' },
    avgBSR: { label: 'Avg BSR', format: (v) => `#${v.toLocaleString()}`, type: 'rank' },
    competition: { label: 'Competition', format: (v) => v, type: 'text' },
    riskScore: { label: 'Risk Score', format: (v) => `${v}/10`, type: 'score' },
    teamSize: { label: 'Team Size', format: (v) => `${v} people`, type: 'number' },
    age: { label: 'Age (months)', format: (v) => `${v}mo`, type: 'number' },
    mainASINs: { label: 'Main ASINs', format: (v) => v, type: 'number' },
    marketTrend: { label: 'Market Trend', format: (v) => v, type: 'text' }
  };
  
  const getMetricColor = (metric, value, deals) => {
    if (metric.type === 'text') return 'text-gray-800 dark:text-gray-100';
    
    const values = deals.map(d => d[Object.keys(metrics).find(k => metrics[k] === metric)]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const isReverse = ['avgBSR', 'riskScore'].includes(Object.keys(metrics).find(k => metrics[k] === metric));
    
    if (value === max) {
      return isReverse ? 'text-red-600' : 'text-green-600';
    } else if (value === min) {
      return isReverse ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-800 dark:text-gray-100';
  };
  
  const filteredDeals = allDeals.filter(deal => {
    if (filters.category !== 'all' && deal.category !== filters.category) return false;
    if (deal.revenue < filters.revenueRange[0] || deal.revenue > filters.revenueRange[1]) return false;
    if (deal.multiple < filters.multipleRange[0] || deal.multiple > filters.multipleRange[1]) return false;
    if (filters.stage !== 'all' && deal.stage !== filters.stage) return false;
    return true;
  });
  
  const displayDeals = filteredDeals.filter(deal => selectedDeals.includes(deal.id));
  
  const toggleDeal = (dealId) => {
    setSelectedDeals(prev => 
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };
  
  const toggleMetric = (metricKey) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Deal Comparison Matrix</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {displayDeals.length} of {filteredDeals.length} deals selected
          </div>
        </div>
        
        {/* Deal Selector */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Deals:</div>
          <div className="flex flex-wrap gap-2">
            {filteredDeals.map(deal => (
              <button
                key={deal.id}
                onClick={() => toggleDeal(deal.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedDeals.includes(deal.id)
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {deal.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Metric Selector */}
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Metrics:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics).map(([key, metric]) => (
              <button
                key={key}
                onClick={() => toggleMetric(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedMetrics.includes(key)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <div className="overflow-x-auto">
        {displayDeals.length > 0 ? (
          <table className="table-auto w-full">
            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th className="px-4 py-3 text-left sticky left-0 bg-gray-50 dark:bg-gray-900/20 border-r border-gray-200 dark:border-gray-700">
                  Deal
                </th>
                {selectedMetrics.map(metricKey => (
                  <th key={metricKey} className="px-4 py-3 text-center whitespace-nowrap">
                    {metrics[metricKey].label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {displayDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {deal.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {deal.category} • {deal.stage.replace('-', ' ')}
                      </div>
                    </div>
                  </td>
                  {selectedMetrics.map(metricKey => {
                    const metric = metrics[metricKey];
                    const value = deal[metricKey];
                    const color = getMetricColor(metric, value, displayDeals);
                    
                    return (
                      <td key={metricKey} className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`font-medium ${color}`}>
                          {metric.format(value)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <Link 
                        to={`/deals/${deal.id.split('-')[1]}`}
                        className="text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => toggleDeal(deal.id)}
                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Summary Row */}
              <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                <td className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-700/50 border-r border-gray-200 dark:border-gray-700">
                  <div className="text-gray-800 dark:text-gray-100">Average</div>
                </td>
                {selectedMetrics.map(metricKey => {
                  const metric = metrics[metricKey];
                  if (metric.type === 'text') {
                    return (
                      <td key={metricKey} className="px-4 py-3 text-center text-gray-400 dark:text-gray-500">
                        -
                      </td>
                    );
                  }
                  
                  const values = displayDeals.map(d => d[metricKey]);
                  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                  
                  return (
                    <td key={metricKey} className="px-4 py-3 text-center text-gray-800 dark:text-gray-100">
                      {metric.format(avg)}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center text-gray-400 dark:text-gray-500">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-gray-500 dark:text-gray-400">
              Select deals to compare them in the matrix
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComparisonMatrix;