import React, { useState, useEffect } from 'react';
import { Deal } from '../../types/deal';
import { 
  TrendingUp, Globe, Package, MessageCircle, Search, DollarSign, 
  Users, BarChart3, Mic, ShoppingCart, Store, Monitor, RefreshCw,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { ShareOfVoiceService, StoredShareOfVoiceReport } from '../../services/ShareOfVoiceService';
import ShareOfVoiceReportWithStorage from '../../components/analytics/ShareOfVoiceReportWithStorage';

interface DealMarketOverviewProps {
  deal: Deal;
}

function DealMarketOverview({ deal }: DealMarketOverviewProps) {
  const [showShareOfVoice, setShowShareOfVoice] = useState(false);
  const [reportExists, setReportExists] = useState(false);
  const [checkingReport, setCheckingReport] = useState(true);
  const [existingReport, setExistingReport] = useState<StoredShareOfVoiceReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  useEffect(() => {
    checkForExistingReport();
  }, [deal.id]);

  const checkForExistingReport = async () => {
    setCheckingReport(true);
    try {
      const exists = await ShareOfVoiceService.checkReportExists(deal.id);
      setReportExists(exists);
      
      if (exists) {
        const report = await ShareOfVoiceService.getLatestReport(deal.id);
        setExistingReport(report);
      }
    } catch (error: any) {
      console.error('Error checking for report:', error);
      // Check if it's a migration issue
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        setMigrationNeeded(true);
      }
    } finally {
      setCheckingReport(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setShowShareOfVoice(true);
  };

  const handleReportComplete = async (report: any) => {
    // Report has been generated, refresh the status
    await checkForExistingReport();
    setGeneratingReport(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysSinceReport = (dateString: string) => {
    const reportDate = new Date(dateString);
    const daysSince = Math.floor((Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince;
  };

  return (
    <div className="space-y-6">
      {/* Share of Voice Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Share of Voice Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Competitive landscape analysis using real Amazon marketplace data
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!checkingReport && reportExists && existingReport && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span>
                  Last updated: {formatDate(existingReport.analysis_date)}
                  {getDaysSinceReport(existingReport.analysis_date) > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({getDaysSinceReport(existingReport.analysis_date)} days ago)
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {!checkingReport && !reportExists && (
              <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>No report generated yet</span>
              </div>
            )}
            
            {checkingReport && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1 animate-pulse" />
                <span>Checking for existing report...</span>
              </div>
            )}
            
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport || checkingReport}
              className={`btn ${
                generatingReport 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white text-sm`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generatingReport ? 'animate-spin' : ''}`} />
              {reportExists ? 'Update Report' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Show existing report summary if available */}
        {reportExists && existingReport && !showShareOfVoice && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs text-gray-500">Market Share</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {existingReport.brand_market_share?.toFixed(1) || '0'}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Rank #{existingReport.brand_rank || 'N/A'} of {existingReport.total_brands || 'N/A'}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-xs text-gray-500">Revenue Share</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${((existingReport.brand_revenue || 0) / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                of ${((existingReport.total_market_revenue || 0) / 1000000).toFixed(1)}M total
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-gray-500">Products</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {existingReport.brand_product_count || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Avg {existingReport.avg_products_per_brand?.toFixed(0) || 0} per brand
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Search className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs text-gray-500">Keyword Share</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {existingReport.brand_keyword_share?.toFixed(1) || '0'}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Avg presence in searches
              </p>
            </div>
          </div>
        )}

        {/* Show full report when requested */}
        {showShareOfVoice && (
          <div className="mt-6">
            <ShareOfVoiceReportWithStorage
              dealId={deal.id}
              brandName={deal.amazon_store_name || deal.business_name}
              category={deal.amazon_category || deal.sub_industry}
              onComplete={handleReportComplete}
            />
          </div>
        )}

        {/* Instructions when no report exists */}
        {!reportExists && !showShareOfVoice && !checkingReport && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              No market analysis data available yet
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Click "Generate Report" to analyze the competitive landscape for this brand using real Amazon marketplace data.
              The analysis will include market share, competitor analysis, keyword performance, and more.
            </p>
            {migrationNeeded && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                  Note: Database tables for storing reports are not set up yet. Reports will work but won't be saved.
                  Run <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">npx supabase migration up</code> to enable storage.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deal Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${deal.annual_revenue ? (deal.annual_revenue / 1000000).toFixed(1) : '0'}M
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Profit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${deal.annual_profit ? (deal.annual_profit / 1000000).toFixed(1) : '0'}M
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asking Multiple</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {deal.asking_multiple || 'N/A'}x
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Industry</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {deal.amazon_category || deal.sub_industry || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Business Summary</h3>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300">
            {deal.business_description || 'No business description available.'}
          </p>
        </div>
        
        {deal.products && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Products</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{deal.products}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DealMarketOverview;