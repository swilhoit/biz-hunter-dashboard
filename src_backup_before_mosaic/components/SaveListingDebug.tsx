import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToggleFavorite, useBusinessListings, useFavorites } from '@/hooks/useBusinessListings';
import { toast } from 'sonner';

export const SaveListingDebug: React.FC = () => {
  const { user } = useAuth();
  const { data: listings = [] } = useBusinessListings();
  const { data: favorites = [] } = useFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testSaveFunction = async () => {
    if (!user) {
      setDebugInfo('❌ No user logged in');
      toast.error('Please sign in first');
      return;
    }

    if (listings.length === 0) {
      setDebugInfo('❌ No listings available');
      return;
    }

    const testListing = listings[0];
    setDebugInfo(`🧪 Testing with listing: ${testListing.name.substring(0, 50)}...`);

    try {
      const result = await toggleFavorite.mutateAsync({
        listingId: testListing.id,
        userId: user.id
      });

      setDebugInfo(`✅ Save operation completed: ${result}`);
      
      if (result === 'added') {
        toast.success('Test listing saved successfully!');
      } else {
        toast.success('Test listing removed from favorites!');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`❌ Save operation failed: ${errorMsg}`);
      toast.error(`Save failed: ${errorMsg}`);
      console.error('Save operation error:', error);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold mb-2">🔧 Save Listing Debug Tool</h3>
      
      <div className="space-y-2 text-sm mb-4">
        <div>👤 User: {user ? `✅ ${user.email}` : '❌ Not logged in'}</div>
        <div>📋 Listings: {listings.length} available</div>
        <div>❤️ Favorites: {favorites.length} saved</div>
        <div>🔄 Status: {toggleFavorite.isPending ? 'Loading...' : 'Ready'}</div>
      </div>

      <Button 
        onClick={testSaveFunction}
        disabled={!user || listings.length === 0 || toggleFavorite.isPending}
        className="mb-2"
      >
        {toggleFavorite.isPending ? 'Testing...' : 'Test Save Function'}
      </Button>

      {debugInfo && (
        <div className="p-2 bg-white border rounded text-sm font-mono">
          {debugInfo}
        </div>
      )}
    </div>
  );
};