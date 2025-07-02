import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DealDetailView from '@/components/DealDetailView';

export default function DealDetail() {
  const { dealId } = useParams();
  const navigate = useNavigate();

  if (!dealId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Deal ID not found</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/dashboard/crm');
  };

  return <DealDetailView dealId={dealId} onBack={handleBack} />;
}