import React, { useState } from 'react';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import FilterButton from '../components/DropdownFilter';
import Datepicker from '../components/Datepicker';
import BusinessOverviewCard from '../partials/dashboard/BusinessOverviewCard';
import ListingsBySourceCard from '../partials/dashboard/ListingsBySourceCard';
import RecentListingsCard from '../partials/dashboard/RecentListingsCard';
import DashboardCard04 from '../partials/dashboard/DashboardCard04';
import DashboardCard05 from '../partials/dashboard/DashboardCard05';
import DashboardCard08 from '../partials/dashboard/DashboardCard08';
import DashboardCard10 from '../partials/dashboard/DashboardCard10';

function Dashboard() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Business Overview</h1>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Filter button */}
                <FilterButton align="right" />
                {/* Datepicker built with flatpickr */}
                <Datepicker align="right" />
              </div>

            </div>

            {/* Cards */}
            <div className="grid grid-cols-12 gap-6">

              {/* Business Overview Stats */}
              <BusinessOverviewCard />
              
              {/* Recent Listings */}
              <RecentListingsCard />
              
              {/* Listings by Source */}
              <ListingsBySourceCard />
              
              {/* Bar chart (Direct vs Indirect) */}
              <DashboardCard04 />
              
              {/* Line chart (Real Time Value) */}
              <DashboardCard05 />
              
              {/* Line chart (Sales Over Time) */}
              <DashboardCard08 />
              
              {/* Card (Recent Activity) */}
              <DashboardCard10 />
              
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}

export default Dashboard;