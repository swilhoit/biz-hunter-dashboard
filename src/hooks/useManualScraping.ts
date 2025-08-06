import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

export function useManualScraping() {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<'traditional' | 'scrapegraph'>('traditional');
  const [lastResults, setLastResults] = useState<any>(null);
  const [selectedSites, setSelectedSites] = useState<string[]>(['quietlight', 'bizbuysell']);
  const { showSuccess, showError, showInfo } = useToast();

  const startScraping = (method: 'traditional' | 'scrapegraph' = 'traditional', sites?: string[]) => {
    console.log(`\n🚀 [CLIENT TRIGGER] Opening scraping modal with method: ${method}`);
    setCurrentMethod(method);
    if (sites) {
      setSelectedSites(sites);
    }
    setShowProgressModal(true);
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
  
  const handleSiteSelectionChange = (newSites: string[]) => {
    setSelectedSites(newSites);
  };

  return {
    startScraping,
    isChecking: showProgressModal, // The modal open state is the new "isChecking"
    lastResults,
    showProgressModal,
    currentMethod,
    selectedSites,
    handleSiteSelectionChange,
    handleProgressModalClose,
    handleProgressModalComplete,
  };
}