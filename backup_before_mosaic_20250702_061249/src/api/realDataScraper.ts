const API_BASE_URL = 'http://localhost:3001/api';

export async function performRealScraping(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    console.log('🚀 Starting REAL scraping via API...');
    
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📡 API Response:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Real scraping failed:', error);
    
    // Check if the API server is running
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        count: 0,
        message: 'Scraper API not running. Please start with: cd server && npm run dev'
      };
    }
    
    return {
      success: false,
      count: 0,
      message: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function clearAllListings(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🗑️ Clearing all listings via API...');
    
    const response = await fetch(`${API_BASE_URL}/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📡 Clear Response:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Clear failed:', error);
    
    return {
      success: false,
      message: `Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}