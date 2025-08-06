import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import PipelineColumn from '../partials/deals/PipelineColumn';
import DealCard from '../partials/deals/DealCard';
import PipelineStats from '../partials/deals/PipelineStats';
import { Deal, DealStatus } from '../types/deal';
import { dbAdapter, mapDealStatus } from '../lib/database-adapter';
import { useAuth } from '@/hooks/useAuth';

const dealStages: { status: DealStatus; title: string; color: string }[] = [
  { status: 'prospecting', title: 'Prospecting', color: 'bg-gray-500' },
  { status: 'analysis', title: 'Analysis', color: 'bg-purple-500' },
  { status: 'initial_contact', title: 'Initial Contact', color: 'bg-blue-500' },
  { status: 'loi_submitted', title: 'LOI Submitted', color: 'bg-yellow-500' },
  { status: 'due_diligence', title: 'Due Diligence', color: 'bg-pink-500' },
  { status: 'negotiation', title: 'Negotiation', color: 'bg-orange-500' },
  { status: 'under_contract', title: 'Under Contract', color: 'bg-indigo-500' },
  { status: 'closing', title: 'Closing', color: 'bg-green-500' },
];

function DealPipelineIntegrated() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    // Navigate to deal creation form or open modal
    navigate('/deals/new');
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
            ) : (
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
                      />
                    ))}
                  </SortableContext>
                </div>

                <DragOverlay>
                  {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DealPipelineIntegrated;