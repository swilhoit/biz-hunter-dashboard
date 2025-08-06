// Debug script to test DataForSEO ranking functionality
// Run with: node debug-rankings.js

const fetch = require('node-fetch');

async function debugRankings() {
  console.log('=== DEBUG DATAFORSEO RANKINGS ===');
  console.log('Testing for brand: Mister Candle\n');

  const username = 'tetrahedronglobal@gmail.com';
  const password = '657d88542daef67e';
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  // Test 1: Check API credentials
  console.log('1. Testing API credentials...');
  try {
    const testResponse = await fetch('https://api.dataforseo.com/v3/merchant/amazon/products/tasks_ready', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ API credentials are valid');
      console.log(`   Status: ${data.status_code}, Message: ${data.status_message}`);
    } else {
      console.log('❌ API credentials invalid:', testResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Failed to connect to API:', error.message);
    return;
  }

  // Test 2: Submit a test search task
  console.log('\n2. Submitting test search task for "candles"...');
  let taskId;
  try {
    const searchResponse = await fetch('https://api.dataforseo.com/v3/merchant/amazon/products/task_post', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: 'candles',
        location_code: 2840,
        language_code: 'en_US',
        depth: 10,
        tag: 'debug-test'
      }])
    });

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      if (data.tasks?.[0]?.id) {
        taskId = data.tasks[0].id;
        console.log('✅ Task submitted successfully');
        console.log(`   Task ID: ${taskId}`);
        console.log(`   Status: ${data.tasks[0].status_code}`);
      } else {
        console.log('❌ Failed to get task ID:', data);
        return;
      }
    } else {
      console.log('❌ Failed to submit task:', searchResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Error submitting task:', error.message);
    return;
  }

  // Test 3: Wait and fetch results
  console.log('\n3. Waiting 15 seconds for task to process...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('4. Fetching task results...');
  try {
    const resultResponse = await fetch(
      `https://api.dataforseo.com/v3/merchant/amazon/products/task_get/advanced/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (resultResponse.ok) {
      const data = await resultResponse.json();
      console.log('✅ Got response from API');
      console.log(`   Response status: ${data.status_code}`);
      
      if (data.tasks?.[0]) {
        const task = data.tasks[0];
        console.log(`   Task status: ${task.status_code} (${task.status_message})`);
        
        if (task.status_code === 20000 && task.result?.[0]?.items) {
          const items = task.result[0].items;
          console.log(`   ✅ Found ${items.length} results`);
          
          // Show sample results
          console.log('\n5. Sample results:');
          items.slice(0, 3).forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.title || 'No title'}`);
            console.log(`      - ASIN: ${item.asin || 'No ASIN'}`);
            console.log(`      - Type: ${item.type}`);
            console.log(`      - Position: ${item.rank_absolute || item.position || 'N/A'}`);
          });
          
          // Check for brand matches
          console.log('\n6. Checking for "Mister Candle" products:');
          const brandMatches = items.filter(item => 
            item.title?.toLowerCase().includes('mister candle')
          );
          
          if (brandMatches.length > 0) {
            console.log(`   ✅ Found ${brandMatches.length} Mister Candle products`);
            brandMatches.forEach((item, i) => {
              console.log(`   ${i + 1}. ${item.title}`);
              console.log(`      - ASIN: ${item.asin}`);
              console.log(`      - Position: ${item.rank_absolute || item.position}`);
            });
          } else {
            console.log('   ⚠️  No "Mister Candle" products found in top 10 results');
          }
          
        } else if (task.status_code === 20100 || task.status_code === 40602) {
          console.log('   ⏳ Task is still processing, try again in a few seconds');
        } else {
          console.log('   ❌ Task failed or no results');
          console.log('   Full task data:', JSON.stringify(task, null, 2));
        }
      }
    } else {
      console.log('❌ Failed to fetch results:', resultResponse.status);
    }
  } catch (error) {
    console.log('❌ Error fetching results:', error.message);
  }

  console.log('\n=== DEBUG COMPLETE ===');
  console.log('\nSummary:');
  console.log('- If API credentials work but no results appear, check the browser console');
  console.log('- Look for errors in the Network tab when clicking "Fetch Rankings"');
  console.log('- Check if the response contains the expected data structure');
}

// Run the debug
debugRankings().catch(console.error);