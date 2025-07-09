import React, { useState, useEffect } from 'react';
import ShareOfVoiceReport from './ShareOfVoiceReport';
import { ShareOfVoiceService } from '../../services/ShareOfVoiceService';
import { ShareOfVoiceReport as ShareOfVoiceReportType } from '../../utils/shareOfVoiceAnalysis';

interface ShareOfVoiceReportWithStorageProps {
  dealId?: string;
  brandName?: string;
  storeUrl?: string;
  category?: string;
  onComplete?: (report: ShareOfVoiceReportType, storeName?: string) => void;
}

export default function ShareOfVoiceReportWithStorage({ 
  dealId,
  brandName, 
  storeUrl, 
  category, 
  onComplete 
}: ShareOfVoiceReportWithStorageProps) {
  const [isStoring, setIsStoring] = useState(false);

  const handleReportComplete = async (report: ShareOfVoiceReportType, storeName?: string) => {
    // Store the report in database if dealId is provided
    if (dealId && (brandName || storeUrl)) {
      setIsStoring(true);
      try {
        await ShareOfVoiceService.generateAndStoreReport(
          dealId,
          storeUrl || brandName!,
          category,
          !!storeUrl
        );
        console.log('Share of voice report stored successfully');
      } catch (error) {
        console.error('Error storing share of voice report:', error);
      } finally {
        setIsStoring(false);
      }
    }

    // Call the original onComplete callback
    if (onComplete) {
      onComplete(report, storeName);
    }
  };

  return (
    <>
      <ShareOfVoiceReport
        brandName={brandName}
        storeUrl={storeUrl}
        category={category}
        onComplete={handleReportComplete}
      />
      {isStoring && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Saving report to database...
        </div>
      )}
    </>
  );
}