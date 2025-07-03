import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import PipelineColumn from '../partials/deals/PipelineColumn';
import DealCard from '../partials/deals/DealCard';
import PipelineStats from '../partials/deals/PipelineStats';
import AddDealModal from '../components/AddDealModal';
import { Deal, DealStatus } from '../types/deal';
import { dbAdapter, mapDealStatus } from '../lib/database-adapter';
import { useAuth } from '@/hooks/useAuth';

const dealStages: { status: DealStatus; title: string; color: string }[] = [
  { status: 'prospecting', title: 'Prospecting', color: 'bg-gray-500' },
  { status: 'initial_contact', title: 'Initial Contact', color: 'bg-blue-500' },
  { status: 'loi_submitted', title: 'LOI Submitted', color: 'bg-yellow-500' },
  { status: 'due_diligence', title: 'Due Diligence', color: 'bg-purple-500' },
  { status: 'negotiation', title: 'Negotiation', color: 'bg-orange-500' },
  { status: 'under_contract', title: 'Under Contract', color: 'bg-indigo-500' },
  { status: 'closing', title: 'Closing', color: 'bg-green-500' },
];

type ViewMode = 'cards' | 'table';

function DealPipelineIntegrated() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [addDealModalOpen, setAddDealModalOpen] = useState(false);
  const navigate = useNavigate();
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
      setDeals(fetchedDeals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) return;

    // If dropped on a column, update the deal's status
    const targetStage = dealStages.find(stage => stage.status === overId);
    if (targetStage && targetStage.status !== activeDeal.status) {
      try {
        // Update in database
        await dbAdapter.deals.updateDeal(activeId, { status: targetStage.status });
        
        // Update local state
        setDeals(prevDeals =>
          prevDeals.map(deal =>
            deal.id === activeId
              ? { ...deal, status: targetStage.status }
              : deal
          )
        );
      } catch (error) {
        console.error('Error updating deal status:', error);
        // Optionally show error toast
      }
    }

    setActiveId(null);
  };

  const handleAddDeal = () => {
    setAddDealModalOpen(true);
  };

  const handleDealCreated = (newDeal: Deal) => {
    setDeals(prevDeals => [newDeal, ...prevDeals]);
    setAddDealModalOpen(false);
  };

  const handleEditDeal = async (dealId: string, updates: Partial<Deal>) => {
    console.log('handleEditDeal called with:', { dealId, updates });
    try {
      console.log('Calling dbAdapter.deals.updateDeal...');
      const result = await dbAdapter.deals.updateDeal(dealId, updates);
      console.log('Database update result:', result);
      
      // Update local state
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === dealId
            ? { ...deal, ...updates }
            : deal
        )
      );
      console.log('Local state updated successfully');
    } catch (error) {
      console.error('Error updating deal:', error);
      alert('Failed to update deal: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await dbAdapter.deals.deleteDeal(dealId);
      
      // Remove from local state
      setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealId));
    } catch (error) {
      console.error('Error deleting deal:', error);
      // Optionally show error toast
    }
  };


  const activeDeal = activeId ? deals.find(deal => deal.id === activeId) : null;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view the deal pipeline.</p>
          <button 
            onClick={() => navigate('/signin')} 
            className="mt-4 btn bg-blue-600 text-white hover:bg-blue-700"
          >
            Sign In
          </button>
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
            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Deal Pipeline</h1>
              </div>

              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* View Toggle */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 18h18M3 6h18" />
                    </svg>
                    Table
                  </button>
                </div>

                <button 
                  onClick={handleAddDeal}
                  className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                >
                  <svg className="fill-current shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span>Add Deal</span>
                </button>
              </div>
            </div>

            {/* Pipeline Stats */}
            <PipelineStats deals={deals} />

            {/* Loading state */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : viewMode === 'cards' ? (
              /* Pipeline Board */
              <DndContext
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  <SortableContext items={dealStages.map(stage => stage.status)} strategy={horizontalListSortingStrategy}>
                    {dealStages.map(stage => (
                      <PipelineColumn
                        key={stage.status}
                        stage={stage}
                        deals={deals.filter(deal => deal.status === stage.status)}
                        onEditDeal={handleEditDeal}
                        onDeleteDeal={handleDeleteDeal}
                      />
                    ))}
                  </SortableContext>
                </div>

                <DragOverlay>
                  {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
                </DragOverlay>
              </DndContext>
            ) : (
              /* Table View */
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Business</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asking Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Seller</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {deals.map((deal) => {
                        const stage = dealStages.find(s => s.status === deal.status);
                        return (
                          <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div>
                                  <button
                                    onClick={() => navigate(`/deal/${deal.id}`)}
                                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors"
                                  >
                                    {deal.business_name || 'Unnamed Business'}
                                  </button>
                                  {deal.amazon_store_name && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {deal.amazon_store_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${stage?.color || 'bg-gray-500'}`}>
                                {stage?.title}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                              {deal.asking_price ? `$${deal.asking_price.toLocaleString()}` : 'N/A'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                              <div>
                                {deal.annual_revenue ? `$${deal.annual_revenue.toLocaleString()}/yr` : 
                                 deal.monthly_revenue ? `$${deal.monthly_revenue.toLocaleString()}/mo` : 'N/A'}
                              </div>
                              {deal.annual_profit && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Profit: ${deal.annual_profit.toLocaleString()}/yr
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {deal.source ? deal.source.replace('_', ' ') : 'N/A'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                              <div>{deal.seller_name || 'N/A'}</div>
                              {deal.seller_email && (
                                <div className="text-xs">{deal.seller_email}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => navigate(`/deal/${deal.id}`)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="View details"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <select
                                  value={deal.status}
                                  onChange={(e) => handleEditDeal(deal.id, { status: e.target.value as DealStatus })}
                                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {dealStages.map(stage => (
                                    <option key={stage.status} value={stage.status}>
                                      {stage.title}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleDeleteDeal(deal.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete deal"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {deals.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center">
                              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <p className="text-lg font-medium">No deals yet</p>
                              <p className="text-sm">Click "Add Deal" to create your first deal.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={addDealModalOpen}
        onClose={() => setAddDealModalOpen(false)}
        onDealCreated={handleDealCreated}
      />
    </div>
  );
}

export default DealPipelineIntegrated;