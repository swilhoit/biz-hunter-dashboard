import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import PipelineColumn from '../partials/deals/PipelineColumn';
import DealCard from '../partials/deals/DealCard';
import PipelineStats from '../partials/deals/PipelineStats';
import { Deal, DealStatus } from '../types/deal';
import { dealsAdapter } from '../lib/database-adapter';

// Mock data for development
const mockDeals: Deal[] = [
  {
    id: '1',
    business_name: 'Premium Pet Supplies Co',
    status: 'prospecting',
    asking_price: 2500000,
    annual_revenue: 4800000,
    annual_profit: 960000,
    valuation_multiple: 2.6,
    amazon_category: 'Pet Supplies',
    priority: 5,
    date_listed: '2024-01-15',
    seller_name: 'John Smith',
    asin_list: new Array(45).fill(null).map((_, i) => `ASIN${i+1}`), // Mock array of 45 ASINs
    fba_percentage: 95,
  },
  {
    id: '2',
    business_name: 'Eco Kitchen Gadgets',
    status: 'initial_contact',
    asking_price: 1800000,
    annual_revenue: 3200000,
    annual_profit: 640000,
    valuation_multiple: 2.8,
    amazon_category: 'Home & Kitchen',
    priority: 4,
    date_listed: '2024-01-20',
    broker_name: 'Sarah Johnson',
    broker_company: 'Empire Flippers',
    asin_list: new Array(28).fill(null).map((_, i) => `ASIN${i+1}`), // Mock array of 28 ASINs
    fba_percentage: 100,
  },
  {
    id: '3',
    business_name: 'Smart Fitness Brand',
    status: 'due_diligence',
    asking_price: 3500000,
    annual_revenue: 5600000,
    annual_profit: 1400000,
    valuation_multiple: 2.5,
    amazon_category: 'Sports & Outdoors',
    priority: 5,
    date_listed: '2023-12-10',
    seller_name: 'Mike Chen',
    asin_list: new Array(62).fill(null).map((_, i) => `ASIN${i+1}`), // Mock array of 62 ASINs
    fba_percentage: 85,
  },
  {
    id: '4',
    business_name: 'Baby Essentials Direct',
    status: 'loi_submitted',
    asking_price: 4200000,
    annual_revenue: 7200000,
    annual_profit: 1800000,
    valuation_multiple: 2.3,
    amazon_category: 'Baby',
    priority: 5,
    date_listed: '2023-11-28',
    broker_name: 'Tom Wilson',
    broker_company: 'FE International',
    asin_list: new Array(38).fill(null).map((_, i) => `ASIN${i+1}`), // Mock array of 38 ASINs
    fba_percentage: 90,
  },
];

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

function DealPipeline() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const dealsData = await dealsAdapter.fetchDeals();
      setDeals(dealsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals');
      // Fallback to mock data on error
      setDeals(mockDeals);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (dealId: string, updates: Partial<Deal>) => {
    try {
      await dealsAdapter.updateDeal(dealId, updates);
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === dealId ? { ...deal, ...updates } : deal
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deal');
    }
  };

  const handleDelete = async (dealId: string) => {
    try {
      await dealsAdapter.deleteDeal(dealId);
      setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deal');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) return;

    // If dropped on a column, update the deal's status
    const targetStage = dealStages.find(stage => stage.status === overId);
    if (targetStage) {
      handleEdit(activeId, { status: targetStage.status });
    }

    setActiveId(null);
  };

  const activeDeal = activeId ? deals.find(deal => deal.id === activeId) : null;

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
                <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
                  <svg className="fill-current shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span>Add Deal</span>
                </button>
              </div>
            </div>

            {/* Pipeline Stats */}
            <PipelineStats deals={deals} />

            {/* Pipeline Board */}
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
                      onEditDeal={handleEdit}
                      onDeleteDeal={handleDelete}
                    />
                  ))}
                </SortableContext>
              </div>

              <DragOverlay>
                {activeDeal ? <DealCard deal={activeDeal} isDragging onEdit={handleEdit} onDelete={handleDelete} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DealPipeline;