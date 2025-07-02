import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import AnalyticsOverview from '../partials/deals/AnalyticsOverview';
import DealFunnel from '../partials/deals/DealFunnel';
import PerformanceMetrics from '../partials/deals/PerformanceMetrics';
import CategoryAnalysis from '../partials/deals/CategoryAnalysis';
import TimelineAnalysis from '../partials/deals/TimelineAnalysis';

function DealAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Deal Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive analysis of your acquisition pipeline</p>
              </div>

              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="form-select w-auto"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
                  Export Report
                </button>
              </div>
            </div>

            {/* Analytics Overview */}
            <AnalyticsOverview dateRange={dateRange} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DealFunnel />
              <PerformanceMetrics />
              <CategoryAnalysis />
              <TimelineAnalysis />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DealAnalytics;