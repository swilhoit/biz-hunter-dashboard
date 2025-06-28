import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function SupabaseTest() {
  const [status, setStatus] = useState('Testing...');
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Supabase connection...');
        
        const { data, error } = await supabase
          .from('business_listings')
          .select('id, name, source, asking_price')
          .limit(3);

        if (error) {
          console.error('Supabase error:', error);
          console.error('Full error details:', JSON.stringify(error, null, 2));
          setStatus(`Error: ${error.message} (${error.code})`);
        } else {
          console.log('Supabase success:', data);
          setStatus(`Success! Found ${data.length} listings`);
          setListings(data);
        }
      } catch (err) {
        console.error('Connection failed:', err);
        setStatus(`Connection failed: ${err}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <h4>Supabase Connection Test</h4>
      <p><strong>Status:</strong> {status}</p>
      {listings.length > 0 && (
        <div>
          <p><strong>Sample listings:</strong></p>
          <ul>
            {listings.map((listing) => (
              <li key={listing.id}>
                {listing.name} - ${listing.asking_price?.toLocaleString()} ({listing.source})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}