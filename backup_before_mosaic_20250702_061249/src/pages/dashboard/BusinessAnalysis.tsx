import React from 'react';
import { useParams } from 'react-router-dom';
import { BusinessAnalysisReport } from '@/components/BusinessAnalysisReport';

const BusinessAnalysis = () => {
  const { analysisId } = useParams<{ analysisId: string }>();

  if (!analysisId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Analysis Not Found</h2>
          <p className="text-gray-600">The requested analysis could not be found.</p>
        </div>
      </div>
    );
  }

  return <BusinessAnalysisReport analysisId={analysisId} />;
};

export default BusinessAnalysis;