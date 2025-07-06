import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function CrawlStatusCard() {
  const [stats, setStats] = useState({
    totalASINs: 0,
    top20ASINs: 0,
    processedASINs: 0,
    totalSellers: 0,
    processingProgress: 0
  });
  const [jobsSummary, setJobsSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrawlStatus();
    const interval = setInterval(loadCrawlStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCrawlStatus = async () => {
    try {
      // Get ASIN statistics
      const { data: asinStats } = await supabase
        .from('asins')
        .select('id, is_top_20_percent');

      const totalASINs = asinStats?.length || 0;
      const top20ASINs = asinStats?.filter(a => a.is_top_20_percent).length || 0;

      // Get processed ASINs (those with seller relationships)
      const { data: processedASINs } = await supabase
        .from('asin_sellers')
        .select('asin_id');

      const processedCount = new Set(processedASINs?.map(p => p.asin_id) || []).size;

      // Get total sellers
      const { count: totalSellers } = await supabase
        .from('sellers')
        .select('id', { count: 'exact' });

      // Calculate processing progress
      const processingProgress = top20ASINs > 0 ? (processedCount / top20ASINs) * 100 : 0;

      setStats({
        totalASINs,
        top20ASINs,
        processedASINs: processedCount,
        totalSellers: totalSellers || 0,
        processingProgress
      });

      // Get crawl jobs summary
      const { data: jobsSummary } = await supabase
        .from('crawl_job_summary')
        .select('*');

      setJobsSummary(jobsSummary || []);

    } catch (error) {
      console.error('Error loading crawl status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500">✓</span>;
      case 'running':
        return <span className="text-blue-500 animate-spin">⟳</span>;
      case 'failed':
        return <span className="text-red-500">✗</span>;
      default:
        return <span className="text-gray-400">○</span>;
    }
  };

  const formatJobType = (jobType) => {
    const typeMap = {
      'product_search': 'Product Search',
      'seller_lookup': 'Seller Lookup',
      'storefront_parse': 'Storefront Parse',
      'domain_enrich': 'Domain Enrich'
    };
    return typeMap[jobType] || jobType;
  };

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-6 xl:col-span-4">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Crawl Status</h2>
          </div>
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-4">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Crawl Status</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Current progress of the seller discovery pipeline
          </p>
        </header>
        
        <div className="p-5">
          {/* Progress Overview */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(stats.processingProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.processingProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.totalASINs.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total ASINs</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.top20ASINs.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Top 20% ASINs</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.processedASINs.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Processed ASINs</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.totalSellers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Sellers</div>
            </div>
          </div>

          {/* Job Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recent Jobs
            </h3>
            <div className="space-y-2">
              {jobsSummary.length > 0 ? (
                jobsSummary.map((job, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatJobType(job.job_type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {job.job_count} jobs
                      </div>
                      {job.total_cost && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ${job.total_cost.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No crawl jobs found
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          {stats.processingProgress < 100 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-1">Next Steps:</div>
                {stats.totalASINs === 0 && (
                  <div>• Run product crawl to discover ASINs</div>
                )}
                {stats.top20ASINs > stats.processedASINs && (
                  <div>• Run seller lookup for {(stats.top20ASINs - stats.processedASINs).toLocaleString()} remaining ASINs</div>
                )}
                {stats.totalSellers > 0 && (
                  <div>• Run storefront parsing to extract contacts</div>
                )}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadCrawlStatus}
            className="w-full mt-4 btn-sm bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
          >
            <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 0 1 8 8 1 1 0 1 1-2 0 6 6 0 1 0-6 6 1 1 0 1 1 0 2 8 8 0 1 1 0-16z"/>
            </svg>
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default CrawlStatusCard;