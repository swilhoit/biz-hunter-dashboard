import React, { useState } from 'react';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import FilterButton from '../components/DropdownFilter';
import Datepicker from '../components/Datepicker';
import BusinessOverviewCard from '../partials/dashboard/BusinessOverviewCard';
import ListingsBySourceCard from '../partials/dashboard/ListingsBySourceCard';
import RecentListingsCard from '../partials/dashboard/RecentListingsCard';
import DashboardCard04 from '../partials/dashboard/DashboardCard04';
import DashboardCard10 from '../partials/dashboard/DashboardCard10';
import AnalyticsOverview from '../partials/deals/AnalyticsOverview';
import DealFunnel from '../partials/deals/DealFunnel';
import PerformanceMetrics from '../partials/deals/PerformanceMetrics';
import CategoryAnalysis from '../partials/deals/CategoryAnalysis';
import TimelineAnalysis from '../partials/deals/TimelineAnalysis';

function Dashboard() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Dashboard actions */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">

              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Business Overview & Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive business overview and deal analytics</p>
              </div>

              {/* Right: Actions */}
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
                {/* Filter button */}
                <FilterButton align="right" />
                {/* Datepicker built with flatpickr */}
                <Datepicker align="right" />
                <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
                  Export Report
                </button>
              </div>

            </div>

            {/* Deal Analytics & Performance Section - Moved to Top */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Deal Analytics & Performance</h2>
              
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

            {/* Business Overview Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Business Overview</h2>
              <div className="grid grid-cols-12 gap-6">

                {/* Business Overview Stats */}
                <BusinessOverviewCard />
                
                {/* Recent Listings */}
                <RecentListingsCard />
                
                {/* Listings by Source */}
                <ListingsBySourceCard />
                
                {/* Bar chart (Direct vs Indirect) */}
                <DashboardCard04 />
                
                {/* Card (Recent Activity) */}
                <DashboardCard10 />
                
              </div>
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}

export default Dashboard;