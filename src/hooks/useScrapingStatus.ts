import { useState, useEffect } from 'react';

interface ScrapingStatus {
  apiRunning: boolean;
  lastScrape: Date | null;
  isAutoScraping: boolean;
}

export const useScrapingStatus = () => {
  const [status, setStatus] = useState<ScrapingStatus>({
    apiRunning: false,
    lastScrape: null,
    isAutoScraping: false,
  });

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
        });
        
        if (response.ok) {
          setStatus(prev => ({ ...prev, apiRunning: true }));
        } else {
          setStatus(prev => ({ ...prev, apiRunning: false }));
        }
      } catch (error) {
        setStatus(prev => ({ ...prev, apiRunning: false }));
      }
    };

    // Check immediately
    checkApiStatus();
    
    // Check every 10 seconds
    const interval = setInterval(checkApiStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return status;
};