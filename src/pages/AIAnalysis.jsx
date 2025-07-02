import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import AIMarketInsights from '../partials/deals/AIMarketInsights';
import ASINAnalyzer from '../partials/deals/ASINAnalyzer';
import CompetitorAnalysis from '../partials/deals/CompetitorAnalysis';
import ValuationCalculator from '../partials/deals/ValuationCalculator';

function AIAnalysis() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">AI Market Analysis</h1>
                <p className="text-gray-600 dark:text-gray-400">Automated insights and analysis for Amazon FBA acquisitions</p>
              </div>
              
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button className="btn bg-violet-500 hover:bg-violet-600 text-white">
                  <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM8 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
                  </svg>
                  <span className="max-xs:sr-only">Run Analysis</span>
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* AI Market Insights */}
              <AIMarketInsights />
              
              {/* ASIN Analyzer */}
              <ASINAnalyzer />
              
              {/* Competitor Analysis */}
              <CompetitorAnalysis />
              
              {/* Valuation Calculator */}
              <ValuationCalculator />
              
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default AIAnalysis;