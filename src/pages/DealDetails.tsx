import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import DealOverview from '../partials/deals/DealOverview';
import DealFinancials from '../partials/deals/DealFinancials';
import DealAmazonMetrics from '../partials/deals/DealAmazonMetrics';
import DealFiles from '../partials/deals/DealFiles';
import DealCommunications from '../partials/deals/DealCommunications';
import DealTasks from '../partials/deals/DealTasks';
import DealNotes from '../partials/deals/DealNotes';
// import SimpleDealEditModal from '../components/SimpleDealEditModal';
import { Deal } from '../types/deal';
import { dealsAdapter } from '../lib/database-adapter';


function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadDeal(id);
    }
  }, [id]);

  const loadDeal = async (dealId: string) => {
    try {
      setLoading(true);
      const deals = await dealsAdapter.fetchDeals();
      const foundDeal = deals?.find(d => d.id === dealId);
      if (foundDeal) {
        setDeal(foundDeal);
      } else {
        setError('Deal not found');
        navigate('/deal-pipeline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (updates: Partial<Deal>) => {
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
    { id: 'amazon', label: 'Amazon Metrics', icon: '📦' },
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
      case 'amazon':
        return <DealAmazonMetrics deal={currentDeal} onEdit={handleEdit} />;
      case 'files':
        return <DealFiles dealId={currentDeal.id} />;
      case 'communications':
        return <DealCommunications dealId={currentDeal.id} />;
      case 'tasks':
        return <DealTasks dealId={currentDeal.id} />;
      case 'notes':
        return <DealNotes dealId={currentDeal.id} onEdit={handleEdit} />;
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
              {/* Debug info */}
              <div className="mb-2 p-2 bg-yellow-100 text-black rounded">
                Debug: isEditing = {isEditing ? 'true' : 'false'}
              </div>
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
                      ${(currentDeal.asking_price! / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      console.log('Edit button clicked, current isEditing:', isEditing);
                      console.log('Setting isEditing to:', !isEditing);
                      flushSync(() => {
                        setIsEditing(!isEditing);
                      });
                      console.log('After flushSync, isEditing is now:', isEditing);
                    }}
                    className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Deal'}
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

            {/* Test Button */}
            <div className="mb-4 p-4 bg-blue-100 rounded">
              <p>Test area - Current isEditing: {isEditing ? 'TRUE' : 'FALSE'}</p>
              <button
                onClick={() => {
                  alert('Test button clicked! Current isEditing: ' + isEditing);
                  setIsEditing(!isEditing);
                }}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Edit Toggle
              </button>
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

      {/* Always show a test div to verify rendering */}
      <div 
        className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg"
        style={{ zIndex: 9999 }}
      >
        isEditing: {isEditing ? 'TRUE' : 'FALSE'}
      </div>

      {/* Edit Modal - Inline for debugging */}
      {isEditing && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Edit Deal - TEST</h2>
            <p className="mb-4 text-gray-700">If you see this, the modal is working!</p>
            <p className="mb-4 text-gray-700">Current deal: {currentDeal.business_name}</p>
            <button
              onClick={() => {
                console.log('Close button clicked');
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealDetails;