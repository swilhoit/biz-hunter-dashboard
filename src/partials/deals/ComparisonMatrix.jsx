import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import { getFallbackImage } from '../../utils/imageUtils';
import { dbAdapter } from '../../lib/database-adapter';
import { useAuth } from '@/hooks/useAuth';

function ComparisonMatrix({ selectedDeals, setSelectedDeals, filters }) {
  const [selectedMetrics, setSelectedMetrics] = useState([
    'revenue', 'profit', 'multiple', 'growth', 'margin', 'bsr', 'competition'
  ]);
  const [allDeals, setAllDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const fetchedDeals = await dbAdapter.deals.fetchDeals();
      const transformedDeals = fetchedDeals.map(deal => ({
        id: deal.id,
        name: deal.business_name || 'Unnamed Business',
        category: deal.category || 'Uncategorized',
        stage: deal.status,
        revenue: deal.annual_revenue || (deal.monthly_revenue ? deal.monthly_revenue * 12 : 0),
        profit: deal.annual_profit || (deal.monthly_profit ? deal.monthly_profit * 12 : 0),
        multiple: deal.asking_price && deal.annual_profit ? 
                  (deal.asking_price / deal.annual_profit) : 0,
        growth: deal.growth_rate || 0,
        margin: deal.annual_revenue && deal.annual_profit ? 
                ((deal.annual_profit / deal.annual_revenue) * 100) : 0,
        avgBSR: deal.avg_bsr || 0,
        competition: deal.competition_level || 'Unknown',
        riskScore: deal.risk_score || 0,
        teamSize: deal.team_size || 0,
        age: deal.business_age || 0,
        mainASINs: deal.asin_count || 0,
        marketTrend: deal.market_trend || 'Unknown',
        image_url: deal.image_url
      }));
      setAllDeals(transformedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = {
    revenue: { label: 'Annual Revenue', format: (v) => `$${(v / 1000000).toFixed(1)}M`, type: 'currency' },
    profit: { label: 'Annual Profit', format: (v) => `$${(v / 1000000).toFixed(1)}M`, type: 'currency' },
    multiple: { label: 'Multiple', format: (v) => `${v.toFixed(1)}x`, type: 'number' },
    growth: { label: 'Growth %', format: (v) => `${v}%`, type: 'percentage' },
    margin: { label: 'Margin %', format: (v) => `${v.toFixed(0)}%`, type: 'percentage' },
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
        : [...prev, dealId].slice(-4) // Max 4 deals
    );
  };
  
  const toggleMetric = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading deals...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Deal Selection */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Select Deals to Compare
        </h3>
        <div className="flex flex-wrap gap-2">
          {filteredDeals.map(deal => (
            <button
              key={deal.id}
              onClick={() => toggleDeal(deal.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedDeals.includes(deal.id)
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {deal.name}
            </button>
          ))}
        </div>
        {filteredDeals.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            No deals match your current filters
          </p>
        )}
      </div>

      {/* Metric Selection */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Metrics to Display
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(metrics).map(([key, metric]) => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetrics.includes(key)
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {displayDeals.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deal
                </th>
                {displayDeals.map(deal => (
                  <th key={deal.id} className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">
                    <div className="flex items-center space-x-2">
                      {deal.image_url ? (
                        <img
                          src={deal.image_url}
                          alt={deal.name}
                          className="w-8 h-8 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = getFallbackImage();
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <Link
                        to={`/deals/${deal.id}`}
                        className="hover:text-violet-500 dark:hover:text-violet-400"
                      >
                        {deal.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedMetrics.map(metricKey => {
                const metric = metrics[metricKey];
                return (
                  <tr key={metricKey}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {metric.label}
                    </td>
                    {displayDeals.map(deal => (
                      <td key={deal.id} className="px-6 py-4 text-sm">
                        <span className={getMetricColor(metric, deal[metricKey], displayDeals)}>
                          {metric.format(deal[metricKey])}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Select deals above to compare their metrics
          </p>
        </div>
      )}
    </div>
  );
}

export default ComparisonMatrix;