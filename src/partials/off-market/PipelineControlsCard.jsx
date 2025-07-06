import React, { useState } from 'react';
import OffMarketProgressModal from '../../components/OffMarketProgressModal';

function PipelineControlsCard() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);

  const runProductCrawl = () => setShowProgressModal(true);

  const runSellerLookup = () => setShowProgressModal(true);

  const runStorefrontParsing = () => setShowProgressModal(true);

  const runDomainEnrichment = () => setShowProgressModal(true);

  const runContactEnrichment = () => setShowProgressModal(true);

  const runFullPipeline = () => {
    setShowProgressModal(true);
  };

  const handleProgressComplete = (results) => {
    setLastRun(new Date());
    setIsRunning(false);
    console.log('Pipeline completed:', results);
  };

  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-4">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Pipeline Controls</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Manage the seller discovery and enrichment pipeline
          </p>
        </header>
        
        <div className="p-5">

          {/* Pipeline Steps */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">1. Product Discovery</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Crawl ASINs for keyword</div>
              </div>
              <button
                onClick={runProductCrawl}
                disabled={isRunning}
                className="btn-sm bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Start'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">2. Seller Lookup</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Find sellers for top 20% ASINs</div>
              </div>
              <button
                onClick={runSellerLookup}
                disabled={isRunning}
                className="btn-sm bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Start'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">3. Storefront Parsing</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Extract contact information</div>
              </div>
              <button
                onClick={runStorefrontParsing}
                disabled={isRunning}
                className="btn-sm bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Start'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">4. Domain Enrichment</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">WHOIS data for domains</div>
              </div>
              <button
                onClick={runDomainEnrichment}
                disabled={isRunning}
                className="btn-sm bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Start'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">5. Contact Enrichment</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Deep contacts for whales</div>
              </div>
              <button
                onClick={runContactEnrichment}
                disabled={isRunning}
                className="btn-sm bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Start'}
              </button>
            </div>
          </div>

          {/* Full Pipeline Button */}
          <button
            onClick={runFullPipeline}
            disabled={isRunning}
            className="w-full btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white disabled:opacity-50"
          >
            {isRunning ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Running Pipeline...
              </div>
            ) : (
              '🚀 Run Full Pipeline'
            )}
          </button>

          {/* Last Run Info */}
          {lastRun && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xs text-green-700 dark:text-green-300">
                Last run: {lastRun.toLocaleString()}
              </div>
            </div>
          )}

          {/* Cost Estimate */}
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              <div className="font-medium mb-1">Estimated Costs:</div>
              <div>• Product crawl: ~$4 per 10k ASINs</div>
              <div>• Seller lookup: ~$40 per 40k ASINs</div>
              <div>• Storefront parsing: ~$4 per 8k sellers</div>
              <div className="font-medium mt-1">Total: ~$51 for 10k seller pilot</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <OffMarketProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onComplete={handleProgressComplete}
      />
    </div>
  );
}

export default PipelineControlsCard;