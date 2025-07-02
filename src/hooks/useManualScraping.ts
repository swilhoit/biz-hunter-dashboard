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
  const { showSuccess, showError, showInfo } = useToast();

  const runScraperMutation = useMutation<any, Error, { method?: 'traditional' | 'scrapegraph' }>({
    mutationFn: async ({ method = 'traditional' }) => {
      console.log('\n========================================');
      console.log(`🔌 [MANUAL SCRAPING] Starting ${method} scraping request...`);
      console.log(`📡 [MANUAL SCRAPING] API URL: ${SCRAPING_API_URL}/api/scrape`);
      console.log('========================================');
      
      try {
        const response = await fetch(`${SCRAPING_API_URL}/api/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({ method })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to start scraping' }));
          console.error('❌ [MANUAL SCRAPING] API error response:', error);
          throw new Error(error.message || 'Failed to start scraping');
        }

        const result = await response.json();
        console.log('📊 [MANUAL SCRAPING] API response:', result);
        return result;
      } catch (error: any) {
        if (error.message === 'Failed to fetch') {
          throw new Error('Scraping server is not running. Please start it with: cd server && node index.js');
        }
        throw error;
      }
    },
    onMutate: ({ method }) => {
      setIsChecking(true);
      setProgress(0);
      
      if (method === 'scrapegraph') {
        setCurrentScraper('ScrapeGraph AI');
        showInfo('Using AI-powered scraping to find new listings...');
      } else {
        setCurrentScraper('BizBuySell');
        showInfo('Checking for new listings from all sources...');
      }
      
      // Simulate progress
      let currentProgress = 0;
      const scrapers = method === 'scrapegraph' 
        ? ['ScrapeGraph AI', 'Processing...', 'Extracting data...', 'Saving listings...']
        : ['BizBuySell', 'Flippa', 'QuietLight', 'Empire Flippers'];
      let scraperIndex = 0;
      
      const progressInterval = setInterval(() => {
        currentProgress += 5;
        setProgress(Math.min(currentProgress, 95));
        
        // Update current scraper name every 25%
        if (currentProgress % 25 === 0 && scraperIndex < scrapers.length - 1) {
          scraperIndex++;
          setCurrentScraper(scrapers[scraperIndex]);
        }
        
        if (currentProgress >= 95) {
          clearInterval(progressInterval);
        }
      }, 500);
      
      // Store interval so we can clear it on success/error
      (window as any).__scrapingProgressInterval = progressInterval;
    },
    onSuccess: (data, variables, context) => {
      // Clear the progress interval
      if ((window as any).__scrapingProgressInterval) {
        clearInterval((window as any).__scrapingProgressInterval);
      }
      
      setIsChecking(false);
      setProgress(100);
      setCurrentScraper(null);
      
      const method = variables.method === 'scrapegraph' ? 'AI-powered' : 'Traditional';
      
      console.log('\n========================================');
      console.log(`✅ [MANUAL SCRAPING] ${method} scraping completed`);
      console.log(`📊 [MANUAL SCRAPING] Results:`);
      console.log(`  Success: ${data.success}`);
      console.log(`  New listings: ${data.count}`);
      console.log(`  Message: ${data.message}`);
      console.log('========================================\n');
      
      if (data.success && data.count > 0) {
        showSuccess(`${method} scraping completed! Found ${data.count} new listings.`);
      } else if (data.success && data.count === 0) {
        showInfo(`${method} scraping completed. No new listings found.`);
      } else {
        showError(data.message || 'Scraping completed with errors');
      }
    },
    onError: (error, variables) => {
      // Clear the progress interval
      if ((window as any).__scrapingProgressInterval) {
        clearInterval((window as any).__scrapingProgressInterval);
      }
      
      setIsChecking(false);
      setProgress(0);
      setCurrentScraper(null);
      
      const method = variables.method === 'scrapegraph' ? 'AI-powered' : 'Traditional';
      showError(`${method} scraping failed: ${error.message}`);
    },
  });

  const checkForNewListings = (onComplete?: () => void, method: 'traditional' | 'scrapegraph' = 'traditional') => {
    runScraperMutation.mutate({ method }, { 
      onSuccess: () => {
        if (onComplete) {
          onComplete();
        }
      }
    });
  };

  return {
    checkForNewListings,
    isChecking: isChecking || runScraperMutation.isPending,
    progress,
    currentScraper,
  };
}