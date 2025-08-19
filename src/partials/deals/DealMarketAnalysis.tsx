import React, { useState } from 'react';
import { Deal } from '../../types/deal';
import DealAmazonMetrics from './DealAmazonMetrics';
import DealSEOAnalysis from './DealSEOAnalysis';
import DealSocialAnalysis from './DealSocialAnalysis';
import DealMarketOverview from './DealMarketOverview';

interface DealMarketAnalysisProps {
  deal: Deal;
  onEdit?: (updates: Partial<Deal>) => void;
}

function DealMarketAnalysis({ deal, onEdit }: DealMarketAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'amazon', label: 'Amazon', icon: '📦' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'social', label: 'Social', icon: '💬' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DealMarketOverview deal={deal} />;
      case 'amazon':
        return <DealAmazonMetrics deal={deal} />;
      case 'seo':
        return <DealSEOAnalysis deal={deal} />;
      case 'social':
        return <DealSocialAnalysis deal={deal} />;
      default:
        return <DealMarketOverview deal={deal} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-150 
                ${activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent'
                }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-200">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default DealMarketAnalysis;