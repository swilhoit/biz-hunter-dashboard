import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

import Header from '../partials/Header';
import PipelineColumn from '../partials/deals/PipelineColumn';
import DealCard from '../partials/deals/DealCard';
import PipelineStats from '../partials/deals/PipelineStats';

// Initialize with empty deals array - no mock data
const initialDeals = [];

const dealStages = [
  { status: 'prospecting', title: 'Prospecting', color: 'bg-gray-500' },
  { status: 'initial_contact', title: 'Initial Contact', color: 'bg-blue-500' },
  { status: 'analysis', title: 'Analysis', color: 'bg-purple-500' },
  { status: 'loi_submitted', title: 'LOI Submitted', color: 'bg-yellow-500' },
  { status: 'due_diligence', title: 'Due Diligence', color: 'bg-pink-500' },
  { status: 'negotiation', title: 'Negotiation', color: 'bg-orange-500' },
  { status: 'under_contract', title: 'Under Contract', color: 'bg-indigo-500' },
  { status: 'closing', title: 'Closing', color: 'bg-green-500' },
];

function DealPipeline() {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState(null);


  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the deal being dragged
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) return;

    // If dropped on a column, update the deal's status
    const targetStage = dealStages.find(stage => stage.status === overId);
    if (targetStage) {
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal.id === activeId
            ? { ...deal, status: targetStage.status }
            : deal
        )
      );
    }

    setActiveId(null);
  };

  const activeDeal = activeId ? deals.find(deal => deal.id === activeId) : null;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header />

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
                    />
                  ))}
                </SortableContext>
              </div>

              <DragOverlay>
                {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DealPipeline;