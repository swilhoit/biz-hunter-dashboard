import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import DocumentUpload from '../partials/deals/DocumentUpload';
import DocumentLibrary from '../partials/deals/DocumentLibrary';
import DocumentAnalysis from '../partials/deals/DocumentAnalysis';
import DocumentChecklist from '../partials/deals/DocumentChecklist';

function DocumentManager() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState('all');
  const [viewMode, setViewMode] = useState('library');

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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Document Manager</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage due diligence documents and analysis</p>
              </div>
              
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Deal Selector */}
                <select 
                  value={selectedDeal}
                  onChange={(e) => setSelectedDeal(e.target.value)}
                  className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  <option value="all">All Deals</option>
                  <option value="deal-1">Kitchen Gadgets Pro</option>
                  <option value="deal-2">SmartHome Essentials</option>
                  <option value="deal-3">Pet Supplies Direct</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('library')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'library'
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Library
                  </button>
                  <button
                    onClick={() => setViewMode('checklist')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'checklist'
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Checklist
                  </button>
                  <button
                    onClick={() => setViewMode('analysis')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'analysis'
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Document Upload */}
              <DocumentUpload 
                selectedDeal={selectedDeal} 
                dealId={selectedDeal !== 'all' ? selectedDeal : null}
              />
              
              {/* Main Content Area */}
              {viewMode === 'library' && (
                <DocumentLibrary selectedDeal={selectedDeal} />
              )}
              
              {viewMode === 'checklist' && (
                <DocumentChecklist selectedDeal={selectedDeal} />
              )}
              
              {viewMode === 'analysis' && (
                <DocumentAnalysis selectedDeal={selectedDeal} />
              )}
              
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default DocumentManager;