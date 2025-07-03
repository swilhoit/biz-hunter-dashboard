import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';

const SCRAPING_API_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:3001';

interface ScrapingResult {
  operationId: string;
  status: string;
  message: string;
}

interface ScrapingStatusResponse {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  totalScrapers: number;
  completedScrapers: number;
  currentScraper?: string;
  results?: Record<string, {
    success: boolean;
    listings: number;
    errors: string[];
  }>;
  summary?: {
    totalListings: number;
    newListings: number;
    duration: string;
  };
}

export function useManualScraping() {
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentScraper, setCurrentScraper] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<'traditional' | 'scrapegraph'>('traditional');
  const { showSuccess, showError, showInfo } = useToast();

  const runScraperMutation = useMutation<any, Error, { method?: 'traditional' | 'scrapegraph'; showModal?: boolean; selectedSites?: string[] }>({
    mutationFn: async ({ method = 'traditional', showModal = true, selectedSites }) => {
      const startTime = Date.now();
      console.log('\n========================================');
      console.log('🚀 [CLIENT SCRAPING] Initiating scraping request from client...');
      console.log(`🔌 [CLIENT SCRAPING] Method selected: ${method}`);
      console.log(`📡 [CLIENT SCRAPING] Target API: ${SCRAPING_API_URL}/api/scrape`);
      console.log(`🕒 [CLIENT SCRAPING] Request timestamp: ${new Date().toISOString()}`);
      console.log('========================================');
      
      try {
        console.log('📤 [CLIENT SCRAPING] Sending POST request to server...');
        console.log('📋 [CLIENT SCRAPING] Request payload:', { method });
        console.log('🔧 [CLIENT SCRAPING] Request headers: Content-Type: application/json');
        
        const response = await fetch(`${SCRAPING_API_URL}/api/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({ method, selectedSites })
        });

        const responseTime = Date.now() - startTime;
        console.log(`📨 [CLIENT SCRAPING] Response received after ${responseTime}ms`);
        console.log(`📊 [CLIENT SCRAPING] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          console.error(`❌ [CLIENT SCRAPING] HTTP error: ${response.status} ${response.statusText}`);
          const error = await response.json().catch(() => ({ message: 'Failed to start scraping' }));
          console.error('📝 [CLIENT SCRAPING] Error response body:', error);
          throw new Error(error.message || 'Failed to start scraping');
        }

        console.log('📄 [CLIENT SCRAPING] Parsing response body as JSON...');
        const result = await response.json();
        
        console.log('\n📊 [CLIENT SCRAPING] Complete API response received:');
        console.log('📦 [CLIENT SCRAPING] Response summary:');
        console.log(`   🎯 Success: ${result.success}`);
        console.log(`   📊 Count: ${result.count || 0}`);
        console.log(`   📋 Total found: ${result.totalFound || 'N/A'}`);
        console.log(`   💾 Total saved: ${result.totalSaved || 'N/A'}`);
        console.log(`   🔄 Duplicates skipped: ${result.duplicatesSkipped || 'N/A'}`);
        console.log(`   ⏱️ Server execution time: ${result.executionTime || 'N/A'}s`);
        console.log(`   📝 Message: ${result.message}`);
        
        if (result.siteBreakdown && Object.keys(result.siteBreakdown).length > 0) {
          console.log('🏢 [CLIENT SCRAPING] Site breakdown:');
          Object.entries(result.siteBreakdown).forEach(([site, data]: [string, any]) => {
            console.log(`   📍 ${site}: ${data.found || 0} found, ${data.saved || 0} saved, ${data.duplicates || 0} duplicates`);
          });
        }
        
        if (result.logs && result.logs.length > 0) {
          console.log(`📋 [CLIENT SCRAPING] Server logs (${result.logs.length} entries):`);
          result.logs.forEach((log: any, index: number) => {
            console.log(`   ${index + 1}. [${log.level?.toUpperCase() || 'INFO'}] ${log.message}`);
          });
        }
        
        if (result.errors && result.errors.length > 0) {
          console.log(`❌ [CLIENT SCRAPING] Server errors (${result.errors.length} entries):`);
          result.errors.forEach((error: any, index: number) => {
            console.log(`   ${index + 1}. [${error.source || 'Unknown'}] ${error.message}`);
          });
        }
        
        const totalTime = Date.now() - startTime;
        console.log(`⏱️ [CLIENT SCRAPING] Total client-side time: ${totalTime}ms`);
        console.log('========================================');
        
        return result;
      } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.error('\n❌ [CLIENT SCRAPING] Request failed!');
        console.error(`📝 [CLIENT SCRAPING] Error message: ${error.message}`);
        console.error(`⏱️ [CLIENT SCRAPING] Failed after ${totalTime}ms`);
        
        if (error.message === 'Failed to fetch') {
          console.error('🔗 [CLIENT SCRAPING] Network connection failed - possible causes:');
          console.error('   - Server not running (start with: cd server && node index.js)');
          console.error('   - Wrong API URL in environment');
          console.error('   - CORS configuration issues');
          console.error('   - Network connectivity problems');
          throw new Error('Scraping server is not running. Please start it with: cd server && node index.js');
        }
        
        console.error('📍 [CLIENT SCRAPING] Error stack:', error.stack);
        console.log('========================================');
        throw error;
      }
    },
    onMutate: ({ method, showModal }) => {
      console.log('\n🔄 [CLIENT STATUS] Starting scraping request...');
      console.log(`📋 [CLIENT STATUS] Method: ${method}`);
      
      setIsChecking(true);
      setProgress(0);
      setCurrentMethod(method || 'traditional');
      
      // Show progress modal if requested
      if (showModal) {
        setShowProgressModal(true);
      }
      
      if (method === 'scrapegraph') {
        setCurrentScraper('AI-powered scraping in progress...');
        console.log('🤖 [CLIENT STATUS] AI-powered scraping mode activated');
        if (!showModal) {
          showInfo('Using AI-powered scraping to find new listings...');
        }
      } else {
        setCurrentScraper('Scraping from multiple sources...');
        console.log('🔧 [CLIENT STATUS] Traditional scraping mode activated');
        if (!showModal) {
          showInfo('Checking for new listings from all sources...');
        }
      }
      
      console.log('⏳ [CLIENT STATUS] Waiting for real server response (no fake progress)');
    },
    onSuccess: (data, variables, context) => {
      console.log('\n🎉 [CLIENT SUCCESS] Scraping request completed successfully!');
      
      setIsChecking(false);
      setProgress(0);
      setCurrentScraper(null);
      
      const method = variables.method === 'scrapegraph' ? 'AI-powered' : 'Traditional';
      console.log(`📋 [CLIENT SUCCESS] Method used: ${method}`);
      
      // Store results for modal
      const results = {
        totalFound: data.totalFound || data.count || 0,
        totalSaved: data.totalSaved || data.count || 0,
        duplicatesSkipped: data.duplicatesSkipped || 0,
        method: variables.method || 'traditional',
        siteBreakdown: data.siteBreakdown || {},
        executionTime: data.executionTime || 0,
        logs: data.logs || [],
        errors: data.errors || []
      };
      setLastResults(results);
      
      console.log('\n📊 [CLIENT SUCCESS] Final processing summary:');
      console.log(`   🎯 Success: ${data.success}`);
      console.log(`   📦 Total found: ${results.totalFound}`);
      console.log(`   💾 New listings saved: ${results.totalSaved}`);
      console.log(`   🔄 Duplicates skipped: ${results.duplicatesSkipped}`);
      console.log(`   ⏱️ Server execution time: ${results.executionTime}s`);
      console.log(`   📝 Server message: ${data.message}`);
      
      if (results.siteBreakdown && Object.keys(results.siteBreakdown).length > 0) {
        console.log('🏢 [CLIENT SUCCESS] Site breakdown summary:');
        Object.entries(results.siteBreakdown).forEach(([site, siteData]: [string, any]) => {
          console.log(`   📍 ${site}: ${siteData.saved || 0} saved / ${siteData.found || 0} found`);
        });
      }
      
      // Show notifications only if not using progress modal
      if (!variables.showModal) {
        console.log('🔔 [CLIENT SUCCESS] Showing user notification...');
        if (data.success && data.count > 0) {
          showSuccess(`${method} scraping completed! Found ${data.count} new listings.`);
          console.log(`✅ [CLIENT SUCCESS] Success notification shown: ${data.count} new listings`);
        } else if (data.success && data.count === 0) {
          showInfo(`${method} scraping completed. No new listings found.`);
          console.log(`ℹ️ [CLIENT SUCCESS] Info notification shown: No new listings`);
        } else {
          showError(data.message || 'Scraping completed with errors');
          console.log(`❌ [CLIENT SUCCESS] Error notification shown: ${data.message}`);
        }
      }
      
      console.log('========================================');
    },
    onError: (error, variables) => {
      console.log('\n❌ [CLIENT ERROR] Scraping request failed!');
      
      setIsChecking(false);
      setProgress(0);
      setCurrentScraper(null);
      
      const method = variables.method === 'scrapegraph' ? 'AI-powered' : 'Traditional';
      
      console.log('📊 [CLIENT ERROR] Error details:');
      console.log(`   📋 Method attempted: ${method}`);
      console.log(`   📝 Error message: ${error.message}`);
      console.log(`   📍 Error type: ${error.name || 'Unknown'}`);
      
      if (error.stack) {
        console.log(`   🔍 Error stack: ${error.stack}`);
      }
      
      // Show error notifications only if not using progress modal
      if (!variables.showModal) {
        console.log('🔔 [CLIENT ERROR] Showing error notification to user...');
        showError(`${method} scraping failed: ${error.message}`);
      }
      console.log('========================================');
    },
  });

  const checkForNewListings = (onComplete?: (results?: any) => void, method: 'traditional' | 'scrapegraph' = 'traditional', showModal: boolean = false, selectedSites?: string[]) => {
    console.log(`\n🚀 [CLIENT TRIGGER] checkForNewListings called with method: ${method}, showModal: ${showModal}`);
    console.log(`🔄 [CLIENT TRIGGER] Has completion callback: ${!!onComplete}`);
    
    runScraperMutation.mutate({ method, showModal, selectedSites }, { 
      onSuccess: (data) => {
        console.log('✅ [CLIENT TRIGGER] Mutation succeeded, calling completion callback...');
        if (onComplete) {
          console.log('📤 [CLIENT TRIGGER] Executing onComplete callback with results');
          onComplete(lastResults);
        } else {
          console.log('⚠️ [CLIENT TRIGGER] No completion callback provided');
        }
      }
    });
  };

  const checkForNewListingsWithProgress = (method: 'traditional' | 'scrapegraph' = 'traditional', selectedSites?: string[]) => {
    console.log(`\n🚀 [CLIENT TRIGGER] checkForNewListingsWithProgress called with method: ${method}`);
    setCurrentMethod(method);
    setShowProgressModal(true);
    runScraperMutation.mutate({ method, showModal: true, selectedSites });
  };

  const handleProgressModalClose = () => {
    console.log('🔄 [CLIENT MODAL] Progress modal closed');
    setShowProgressModal(false);
  };

  const handleProgressModalComplete = (results: any) => {
    console.log('✅ [CLIENT MODAL] Progress modal completed with results:', results);
    setLastResults(results);
    setShowProgressModal(false);
    
    // Show final notification
    if (results.totalSaved > 0) {
      showSuccess(`Scraping completed! Found ${results.totalSaved} new listings.`);
    } else if (results.errors && results.errors.length > 0) {
      showError('Scraping completed with errors');
    } else {
      showInfo('Scraping completed. No new listings found.');
    }
  };

  const clearResults = () => {
    console.log('🧹 [CLIENT CLEANUP] Clearing stored results from memory');
    setLastResults(null);
  };

  return {
    checkForNewListings,
    checkForNewListingsWithProgress,
    isChecking: isChecking || runScraperMutation.isPending,
    progress,
    currentScraper,
    lastResults,
    clearResults,
    showProgressModal,
    currentMethod,
    handleProgressModalClose,
    handleProgressModalComplete,
  };
}