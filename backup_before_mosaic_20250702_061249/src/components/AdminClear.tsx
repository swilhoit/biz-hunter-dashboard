import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const AdminClear = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<string>('');

  const clearAllFakeListings = async () => {
    setIsClearing(true);
    setResult('');
    
    try {
      console.log('🗑️ Clearing all fake listings...');
      
      // First check what we have
      const { data: allListings, error: selectError } = await supabase
        .from('business_listings')
        .select('id, name, source');
      
      if (selectError) throw selectError;
      
      const fakeListings = allListings.filter(l => l.source !== 'BizBuySell');
      const realListings = allListings.filter(l => l.source === 'BizBuySell');
      
      setResult(`Found ${allListings.length} total listings:\n- Real (BizBuySell): ${realListings.length}\n- Fake (Other): ${fakeListings.length}\n\nDeleting fake listings...`);
      
      if (fakeListings.length === 0) {
        setResult(prev => prev + '\n\n✅ No fake listings found!');
        return;
      }
      
      // Delete fake listings one by one
      let deleted = 0;
      for (const listing of fakeListings) {
        const { error } = await supabase
          .from('business_listings')
          .delete()
          .eq('id', listing.id);
        
        if (!error) {
          deleted++;
          setResult(prev => prev + `\n✅ Deleted: ${listing.name}`);
        } else {
          setResult(prev => prev + `\n❌ Failed to delete: ${listing.name} - ${error.message}`);
        }
      }
      
      setResult(prev => prev + `\n\n🎉 Successfully deleted ${deleted} fake listings!`);
      
      // Refresh the page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        🗑️ Emergency Clear Fake Listings
      </h3>
      <p className="text-sm text-red-600 mb-4">
        This will delete all non-BizBuySell listings from the database permanently.
      </p>
      
      <Button 
        onClick={clearAllFakeListings}
        disabled={isClearing}
        variant="destructive"
      >
        {isClearing ? 'Clearing...' : 'DELETE ALL FAKE LISTINGS'}
      </Button>
      
      {result && (
        <div className="mt-4 p-3 bg-white border rounded max-h-96 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};