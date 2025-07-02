import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import WelcomeBanner from '../partials/dashboard/WelcomeBanner';
import DashboardAvatars from '../partials/dashboard/DashboardAvatars';

// Reuse existing dashboard cards but customize for deals
import DealRevenueCard from '../partials/deals/DealRevenueCard';
import DealProfitCard from '../partials/deals/DealProfitCard'; 
import DealVolumeCard from '../partials/deals/DealVolumeCard';
import DealMultipleCard from '../partials/deals/DealMultipleCard';
import RecentDealsCard from '../partials/deals/RecentDealsCard';
import TopCategoriesCard from '../partials/deals/TopCategoriesCard';
import DealActivitiesCard from '../partials/deals/DealActivitiesCard';

// Reuse existing components with deal context
import DealTasksCard from '../partials/deals/DealTasksCard';
import MarketInsightsCard from '../partials/deals/MarketInsightsCard';

function DealsDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Welcome banner */}
            <WelcomeBanner />

            {/* Dashboard actions */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Deals Overview</h1>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Add view button */}
                <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
                  <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="max-xs:sr-only">Add Deal</span>
                </button>                
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-12 gap-6">

              {/* Deal Revenue Chart */}
              <DealRevenueCard />
              
              {/* Deal Profit Chart */}
              <DealProfitCard />
              
              {/* Deal Volume Chart */}
              <DealVolumeCard />
              
              {/* Average Multiple Chart */}
              <DealMultipleCard />

              {/* Recent Deals Table */}
              <RecentDealsCard />

              {/* Top Categories */}
              <TopCategoriesCard />

              {/* Deal Activities */}
              <DealActivitiesCard />

              {/* Deal Tasks */}
              <DealTasksCard />

              {/* Market Insights */}
              <MarketInsightsCard />

              {/* Team avatars */}
              <DashboardAvatars />
              
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}

export default DealsDashboard;