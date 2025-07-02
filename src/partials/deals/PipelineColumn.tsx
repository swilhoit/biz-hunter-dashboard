import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DealCard from './DealCard';
import { Deal, DealStatus } from '../../types/deal';

interface PipelineColumnProps {
  stage: {
    status: DealStatus;
    title: string;
    color: string;
  };
  deals: Deal[];
  onEditDeal?: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeal?: (dealId: string) => Promise<void>;
}

function PipelineColumn({ stage, deals, onEditDeal, onDeleteDeal }: PipelineColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.status,
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`}></div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                {stage.title}
              </h3>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {deals.length}
              </span>
            </div>
          </div>
          {totalValue > 0 && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Total: ${(totalValue / 1000000).toFixed(1)}M
            </div>
          )}
        </div>

        <div
          ref={setNodeRef}
          className="p-4 space-y-3 min-h-[200px]"
        >
          <SortableContext items={deals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
            {deals.map(deal => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                onEdit={onEditDeal}
                onDelete={onDeleteDeal}
              />
            ))}
          </SortableContext>
          
          {deals.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm">No deals in this stage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PipelineColumn;