import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import DealOverview from '../partials/deals/DealOverview';
import DealFinancials from '../partials/deals/DealFinancials';
import DealAmazonMetrics from '../partials/deals/DealAmazonMetrics';
import DealAmazonPortfolioAnalysis from '../partials/deals/DealAmazonPortfolioAnalysis';
import DealASINsTable from '../partials/deals/DealASINsTable';
import DealFiles from '../partials/deals/DealFiles';
import DealCommunications from '../partials/deals/DealCommunications';
import DealTasks from '../partials/deals/DealTasks';
import DealNotes from '../partials/deals/DealNotes';

// Mock data - in real app this would come from API
const mockDeal = {
  id: '1',
  business_name: 'Premium Pet Supplies Co',
  status: 'due_diligence',
  asking_price: 2500000,
  annual_revenue: 4800000,
  annual_profit: 960000,
  monthly_revenue: 400000,
  monthly_profit: 80000,
  valuation_multiple: 2.6,
  amazon_category: 'Pet Supplies',
  amazon_subcategory: 'Dog Supplies',
  priority: 5,
  date_listed: '2024-01-15',
  seller_name: 'John Smith',
  seller_email: 'john@petsupplies.com',
  seller_phone: '+1-555-0123',
  broker_name: 'Sarah Johnson',
  broker_email: 'sarah@empireflippers.com',
  broker_company: 'Empire Flippers',
  amazon_store_name: 'Premium Pet Store',
  amazon_store_url: 'https://amazon.com/stores/premium-pet',
  website_url: 'https://premiumpetsupplies.com',
  fba_percentage: 95,
  seller_account_health: 'Excellent',
  business_age: 36,
  first_contact_date: '2024-01-20',
  due_diligence_start_date: '2024-02-01',
  expected_close_date: '2024-03-15',
  asin_list: new Array(45).fill(null).map((_, i) => `ASIN${i+1}`), // Mock array of 45 ASINs
  notes: 'Strong brand with loyal customer base. Owner looking to retire.',
  tags: ['high-priority', 'established-brand', 'pet-supplies'],
};

function DealDetails() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'financials', label: 'Financials', icon: '💰' },
    { id: 'amazon', label: 'Amazon Metrics', icon: '📦' },
    { id: 'portfolio', label: 'Portfolio Analysis', icon: '🎯' },
    { id: 'asins', label: 'ASINs', icon: '🏷️' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'communications', label: 'Communications', icon: '💬' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DealOverview deal={mockDeal} />;
      case 'financials':
        return <DealFinancials deal={mockDeal} />;
      case 'amazon':
        return <DealAmazonMetrics deal={mockDeal} />;
      case 'portfolio':
        return <DealAmazonPortfolioAnalysis deal={mockDeal} />;
      case 'asins':
        return <DealASINsTable dealId={mockDeal.id} />;
      case 'files':
        return <DealFiles dealId={mockDeal.id} />;
      case 'communications':
        return <DealCommunications dealId={mockDeal.id} />;
      case 'tasks':
        return <DealTasks dealId={mockDeal.id} />;
      case 'notes':
        return <DealNotes dealId={mockDeal.id} />;
      default:
        return <DealOverview deal={mockDeal} />;
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Deal Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                    {mockDeal.business_name}
                  </h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                      {mockDeal.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {mockDeal.amazon_category}
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${(mockDeal.asking_price / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                    Edit Deal
                  </button>
                  <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
                    Update Status
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-2 px-1 border-b-2 font-medium text-sm
                        ${activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DealDetails;