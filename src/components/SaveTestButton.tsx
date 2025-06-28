import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessListings, useToggleFavorite } from '@/hooks/useBusinessListings';
import { toast } from 'sonner';

export const SaveTestButton: React.FC = () => {
  const { user } = useAuth();
  const { data: listings = [] } = useBusinessListings();
  const toggleFavorite = useToggleFavorite();

  const testSave = async () => {
    console.log('🧪 Starting save test...');
    
    if (!user) {
      console.log('❌ No user');
      toast.error('Not signed in');
      return;
    }
    
    if (listings.length === 0) {
      console.log('❌ No listings');
      toast.error('No listings available');
      return;
    }

    const testListing = listings[0];
    console.log('📋 Using test listing:', testListing.name);
    
    try {
      const result = await toggleFavorite.mutateAsync({
        listingId: testListing.id,
        userId: user.id
      });
      
      console.log('✅ Test result:', result);
      toast.success(`Test completed: ${result}`);
    } catch (error) {
      console.error('❌ Test failed:', error);
      toast.error(`Test failed: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold mb-2">🧪 Direct Save Test</h3>
      <div className="space-y-2 text-sm mb-4">
        <div>👤 User: {user ? `✅ ${user.email}` : '❌ Not signed in'}</div>
        <div>📋 Listings: {listings.length} available</div>
        <div>🔄 Mutation: {toggleFavorite.isPending ? 'Loading...' : 'Ready'}</div>
      </div>
      <Button 
        onClick={testSave} 
        disabled={!user || listings.length === 0 || toggleFavorite.isPending}
        className="w-full"
      >
        {toggleFavorite.isPending ? 'Testing...' : 'Test Direct Save'}
      </Button>
    </div>
  );
};