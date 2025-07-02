import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import ComparisonMatrix from '../partials/deals/ComparisonMatrix';
import FilterPanel from '../partials/deals/FilterPanel';
import ComparisonChart from '../partials/deals/ComparisonChart';

function DealComparison() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState(['deal-1', 'deal-2', 'deal-3']);
  const [filters, setFilters] = useState({
    category: 'all',
    revenueRange: [0, 10000000],
    multipleRange: [0, 10],
    stage: 'all'
  });

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Deal Comparison</h1>
                <p className="text-gray-600 dark:text-gray-400">Compare and analyze multiple deals side by side</p>
              </div>
              
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300">
                  Export Comparison
                </button>
                <button className="btn bg-violet-500 hover:bg-violet-600 text-white">
                  Save Matrix
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel filters={filters} setFilters={setFilters} />

            {/* Cards */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Comparison Chart */}
              <ComparisonChart selectedDeals={selectedDeals} />
              
              {/* Comparison Matrix */}
              <ComparisonMatrix 
                selectedDeals={selectedDeals} 
                setSelectedDeals={setSelectedDeals}
                filters={filters}
              />
              
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default DealComparison;