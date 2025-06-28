import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ToastTest: React.FC = () => {
  const testToasts = () => {
    console.log('🧪 Testing toasts...');
    toast.success('✅ Success toast test');
    toast.error('❌ Error toast test');
    toast('ℹ️ Info toast test');
  };

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-semibold mb-2">🍞 Toast Test</h3>
      <Button onClick={testToasts} className="w-full">
        Test Toast Notifications
      </Button>
    </div>
  );
};