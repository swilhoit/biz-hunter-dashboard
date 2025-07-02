import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { integratedScrapingService, ScrapingOperation } from '@/services/IntegratedScrapingService.client';
import { ScrapingConfig } from '@/services/scraping/types';
import { ScraperName } from '@/services/scraping/scrapers';

export const useIntegratedScraping = () => {
  const [currentOperation, setCurrentOperation] = useState<ScrapingOperation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = integratedScrapingService.onProgress((operation) => {
      setCurrentOperation(operation);
      setIsLoading(operation.status === 'running');
      
      // Invalidate queries when scraping completes
      if (operation.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['business-listings'] });
      }
    });

    // Get current operation on mount
    const current = integratedScrapingService.getCurrentOperation();
    if (current) {
      setCurrentOperation(current);
      setIsLoading(current.status === 'running');
    }

    return unsubscribe;
  }, [queryClient]);

  const runFullScraping = useCallback(async (config?: ScrapingConfig) => {
    setIsLoading(true);
    try {
      const operation = await integratedScrapingService.runFullScraping(config);
      return operation;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const runSingleScraper = useCallback(async (scraperName: ScraperName, config?: ScrapingConfig) => {
    setIsLoading(true);
    try {
      const operation = await integratedScrapingService.runSingleScraper(scraperName, config);
      return operation;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const getAvailableScrapers = useCallback(() => {
    return integratedScrapingService.getAvailableScrapers();
  }, []);

  return {
    currentOperation,
    isLoading,
    runFullScraping,
    runSingleScraper,
    getAvailableScrapers,
  };
};