import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import DealOverview from '../partials/deals/DealOverview';
import DealFinancials from '../partials/deals/DealFinancials';
import DealMarketAnalysis from '../partials/deals/DealMarketAnalysis';
import DealAnalysis from '../partials/deals/DealAnalysis';
import DealFiles from '../partials/deals/DealFiles';
import DealASINsTable from '../partials/deals/DealASINsTable';
import DealCommunications from '../partials/deals/DealCommunications';
import DealTasks from '../partials/deals/DealTasks';
import DealNotes from '../partials/deals/DealNotes';
import DealEditModal from '../components/DealEditModal';
// import { Deal } from '../types/deal'; // Removed TypeScript import
import { dealsAdapter } from '../lib/database-adapter';


function DealDetails() {
  const { id } = useParams();
  
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadDeal(id);
    }
  }, [id]);

  useEffect(() => {
    // Listen for the custom event from DealFiles to navigate to Analysis tab
    const handleNavigateToAnalysis = (event) => {
      if (event.detail && event.detail.dealId === id) {
        setActiveTab('analysis');
      }
    };

    window.addEventListener('navigate-to-analysis', handleNavigateToAnalysis);
    
    return () => {
      window.removeEventListener('navigate-to-analysis', handleNavigateToAnalysis);
    };
  }, [id]);

  const loadDeal = async (dealId) => {
    try {
      setLoading(true);
      const foundDeal = await dealsAdapter.fetchDealById(dealId);
      if (foundDeal) {
        setDeal(foundDeal);
      } else {
        setError('Deal not found');
        navigate('/deals');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (updates) => {
    if (!deal) return;
    try {
      await dealsAdapter.updateDeal(deal.id, updates);
      setDeal({ ...deal, ...updates });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deal');
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      try {
        await dealsAdapter.deleteDeal(deal.id);
        navigate('/deal-pipeline');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete deal');
      }
    }
  };

  if (!deal) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Deal not found</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const currentDeal = deal;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'financials', label: 'Financials', icon: '💰' },
    { id: 'market', label: 'Market Analysis', icon: '📊' },
    { id: 'analysis', label: 'Analysis', icon: '🧠' },
    { id: 'asins', label: 'ASINs', icon: '🔖' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'communications', label: 'Communications', icon: '💬' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DealOverview deal={currentDeal} onEdit={handleEdit} />;
      case 'financials':
        return <DealFinancials deal={currentDeal} onEdit={handleEdit} />;
      case 'market':
        return <DealMarketAnalysis deal={currentDeal} onEdit={handleEdit} />;
      case 'analysis':
        return <DealAnalysis deal={currentDeal} />;
      case 'asins':
        return <DealASINsTable dealId={currentDeal.id} />;
      case 'files':
        return <DealFiles dealId={currentDeal.id} />;
      case 'communications':
        return <DealCommunications dealId={currentDeal.id} />;
      case 'tasks':
        return <DealTasks dealId={currentDeal.id} />;
      case 'notes':
        return <DealNotes deal={currentDeal} onEdit={handleEdit} />;
      default:
        return <DealOverview deal={currentDeal} onEdit={handleEdit} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deal...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Deal Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                    {currentDeal.business_name}
                  </h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                      {currentDeal.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {currentDeal.amazon_category}
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${(currentDeal.asking_price / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Edit Deal
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="btn bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete Deal
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
      
      {/* Edit Modal */}
      <DealEditModal
        deal={currentDeal}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleEdit}
      />
    </div>
  );
}

export default DealDetails;