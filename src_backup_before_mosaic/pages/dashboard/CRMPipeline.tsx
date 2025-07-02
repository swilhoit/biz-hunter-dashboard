import React from 'react';
import DealPipeline from '@/components/DealPipeline';
import MigrationStatus from '@/components/MigrationStatus';
import SampleDataLoader from '@/components/SampleDataLoader';

export default function CRMPipeline() {
  return (
    <div className="space-y-6">
      <MigrationStatus />
      <SampleDataLoader />
      <DealPipeline />
    </div>
  );
}