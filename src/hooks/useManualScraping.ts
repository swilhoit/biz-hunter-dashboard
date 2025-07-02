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

  const runAllScrapersMutation = useMutation<any, Error>({
    mutationFn: async () => {
      try {
        const response = await fetch(`${SCRAPING_API_URL}/api/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to start scraping' }));
          throw new Error(error.message || 'Failed to start scraping');
        }

        return response.json();
      } catch (error: any) {
        if (error.message === 'Failed to fetch') {
          throw new Error('Scraping server is not running. Please start it with: cd server && node index.js');
        }
        throw error;
      }
    },
    onMutate: () => {
      setIsChecking(true);
      setProgress(0);
      setCurrentScraper('BizBuySell');
      showInfo('Checking for new listings from all sources...');
      
      // Simulate progress since this server doesn't provide real-time updates
      let currentProgress = 0;
      const scrapers = ['BizBuySell', 'Flippa', 'QuietLight', 'Empire Flippers'];
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
    onSuccess: (data, _, context) => {
      // Clear the progress interval
      if ((window as any).__scrapingProgressInterval) {
        clearInterval((window as any).__scrapingProgressInterval);
      }
      
      setIsChecking(false);
      setProgress(100);
      setCurrentScraper(null);
      
      showSuccess(`Scraping completed! Found ${data.totalScraped || 0} total listings, ${data.newCount || 0} new listings added.`);
      if (context?.onComplete) {
        context.onComplete();
      }
    },
    onError: (error) => {
      // Clear the progress interval
      if ((window as any).__scrapingProgressInterval) {
        clearInterval((window as any).__scrapingProgressInterval);
      }
      
      setIsChecking(false);
      setProgress(0);
      setCurrentScraper(null);
      showError(`${error.message}`);
    },
  });

  const checkForNewListings = (onComplete: () => void) => {
    runAllScrapersMutation.mutate(undefined, { onComplete });
  };

  return {
    checkForNewListings,
    isChecking: isChecking || runAllScrapersMutation.isPending,
    progress,
    currentScraper,
  };
}