import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🚀 [execute-seller-lookup.js] Module loaded');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

export async function executeSellerLookup(batchSize = 100) {
  console.log(`🚀 [execute-seller-lookup.js] executeSellerLookup called with batchSize: ${batchSize}`);
  const script = `
import { createClient } from '@supabase/supabase-js';

console.error('Starting seller lookup script...');
console.error('Environment vars:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  DATAFORSEO_USERNAME: process.env.DATAFORSEO_USERNAME ? 'Set' : 'Missing',
  DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD ? 'Set' : 'Missing'
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// DataForSEO configuration
const dataForSEOConfig = {
  username: process.env.DATAFORSEO_USERNAME || '',
  password: process.env.DATAFORSEO_PASSWORD || '',
  baseUrl: 'https://api.dataforseo.com'
};

async function processSellerLookup(batchSize) {
  const startTime = Date.now();
  let totalSellersFound = 0;
  let totalNewSellers = 0;
  let totalDuplicateSellers = 0;
  let totalCost = 0;

  console.error('Starting processSellerLookup with batch size:', batchSize);

  try {
    // Get top 20% ASINs that haven't been processed
    console.error('Fetching ASINs from database...');
    const { data: asins, error } = await supabase
      .from('asins')
      .select('id, asin, category, est_rev')
      .eq('is_top_20_percent', true)
      .not('est_rev', 'is', null)
      .order('est_rev', { ascending: false })
      .limit(batchSize);

    if (error) {
      console.error('Database error:', error);
      throw new Error(\`Failed to fetch ASINs: \${error.message}\`);
    }
    
    console.error('ASINs fetched:', asins ? asins.length : 0);

    if (!asins || asins.length === 0) {
      console.error('No ASINs to process, returning empty result');
      return {
        sellersFound: 0,
        newSellers: 0,
        duplicateSellers: 0,
        totalCost: 0,
        processingTime: 0
      };
    }

    console.error('Processing', asins.length, 'ASINs for seller lookup');
    console.error('First ASIN:', asins[0].asin, 'Revenue:', asins[0].est_rev);

    // Process each ASIN
    for (let i = 0; i < asins.length; i++) {
      const asinData = asins[i];
      console.error(\`Processing ASIN \${i + 1}/\${asins.length}: \${asinData.asin}\`);
      
      try {
        // Make request to DataForSEO API
        console.error('Creating DataForSEO credentials...');
        const credentials = Buffer.from(\`\${dataForSEOConfig.username}:\${dataForSEOConfig.password}\`).toString('base64');
        
        console.error('Making DataForSEO API request...');
        const requestBody = [{
          asin: asinData.asin,
          location_code: 2840, // USA
          language_code: 'en',
          priority: 2
        }];
        console.error('Request body:', JSON.stringify(requestBody));
        
        const response = await fetch(\`\${dataForSEOConfig.baseUrl}/v3/merchant/amazon/sellers/task_post\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Basic \${credentials}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.error('DataForSEO response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('DataForSEO API error:', response.status, response.statusText, errorText);
          continue;
        }

        console.error('Parsing DataForSEO response...');
        const apiResult = await response.json();
        console.error('API Result:', JSON.stringify(apiResult).substring(0, 200) + '...');
        
        if (apiResult.tasks && apiResult.tasks[0]) {
          const task = apiResult.tasks[0];
          console.error('Task status code:', task.status_code);
          
          if (task.status_code === 20000 && task.result && task.result[0]) {
            const sellers = task.result[0].items || [];
            console.error(\`Found \${sellers.length} sellers for ASIN \${asinData.asin}\`);
            
            for (const seller of sellers) {
              if (seller.seller_name && seller.seller_url) {
                console.error(\`Processing seller: \${seller.seller_name}\`);
                
                // Check if seller already exists
                console.error('Checking if seller exists in database...');
                const { data: existingSeller } = await supabase
                  .from('sellers')
                  .select('id')
                  .eq('seller_name', seller.seller_name)
                  .single();

                let sellerId;
                
                if (!existingSeller) {
                  // Insert new seller
                  console.error('Inserting new seller...');
                  const { data: newSeller, error: insertError } = await supabase
                    .from('sellers')
                    .insert({
                      seller_name: seller.seller_name,
                      seller_url: seller.seller_url,
                      seller_rating: seller.seller_rating,
                      seller_rating_count: seller.seller_rating_count,
                      is_amazon_seller: seller.is_amazon_seller || false
                    })
                    .select()
                    .single();

                  if (insertError) {
                    console.error('Error inserting seller:', insertError);
                  } else if (newSeller) {
                    sellerId = newSeller.id;
                    totalNewSellers++;
                    console.error('New seller created with ID:', sellerId);
                  }
                } else {
                  sellerId = existingSeller.id;
                  totalDuplicateSellers++;
                  console.error('Seller already exists with ID:', sellerId);
                }

                // Link seller to ASIN
                if (sellerId) {
                  console.error('Linking seller to ASIN...');
                  const { error: linkError } = await supabase
                    .from('asin_sellers')
                    .upsert({
                      asin_id: asinData.id,
                      seller_id: sellerId,
                      price: seller.price?.current || 0,
                      condition: seller.condition || 'New',
                      is_prime: seller.is_prime || false,
                      is_buy_box_winner: seller.is_buy_box_winner || false
                    }, {
                      onConflict: 'asin_id,seller_id'
                    });
                    
                  if (linkError) {
                    console.error('Error linking seller to ASIN:', linkError);
                  } else {
                    console.error('Successfully linked seller to ASIN');
                  }
                }
                
                totalSellersFound++;
              }
            }
            
            totalCost += task.cost || 0.001;
          } else {
            console.error('Task failed or no results. Status:', task.status_code, 'Message:', task.status_message);
          }
        } else {
          console.error('No tasks in API response');
        }
        
        // Small delay between API calls
        console.error('Waiting 500ms before next API call...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(\`Error processing ASIN \${asinData.asin}:\`, error);
        console.error('Error stack:', error.stack);
      }
    }

    const processingTime = Date.now() - startTime;
    
    console.error('Processing complete!');
    console.error(\`Total sellers found: \${totalSellersFound}\`);
    console.error(\`New sellers: \${totalNewSellers}\`);
    console.error(\`Duplicate sellers: \${totalDuplicateSellers}\`);
    console.error(\`Total cost: $\${totalCost}\`);
    console.error(\`Processing time: \${processingTime}ms\`);
    
    const result = {
      sellersFound: totalSellersFound,
      newSellers: totalNewSellers,
      duplicateSellers: totalDuplicateSellers,
      totalCost,
      processingTime
    };
    
    console.log(JSON.stringify(result));
    return result;

  } catch (error) {
    console.error('Fatal error in seller lookup:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Execute the function
console.error('Starting processSellerLookup with batch size:', ${batchSize});
processSellerLookup(${batchSize}).then(result => {
  console.error('Function completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error in main execution:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
});
`;

  try {
    console.log(`🚀 [execute-seller-lookup.js] Starting script execution process...`);
    
    // Write script to temp file
    const tempFile = path.join(__dirname, '..', 'temp-seller-lookup.mjs');
    console.log('Writing script to:', tempFile);
    console.log('Script length:', script.length, 'characters');
    
    await fs.writeFile(tempFile, script);
    
    // Verify file exists
    const fileExists = await fs.access(tempFile).then(() => true).catch(() => false);
    console.log('Temp file exists:', fileExists);
    
    // Execute with Node.js (using experimental modules)
    const command = `cd ${path.join(__dirname, '..')} && node --experimental-modules ${tempFile}`;
    console.log('Executing command:', command);
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env },
      cwd: path.join(__dirname, '..'),
      timeout: 30000 // 30 second timeout
    });
    
    // Clean up temp file (commented out for debugging)
    // await fs.unlink(tempFile).catch(() => {});
    
    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.error('Seller lookup stderr:', stderr);
    }
    
    console.log('=== EXECUTION COMPLETE ===');
    console.log('Raw stdout length:', stdout.length);
    console.log('Raw stderr length:', stderr.length);
    
    if (stderr) {
      console.log('=== STDERR OUTPUT ===');
      console.log(stderr);
      console.log('=== END STDERR ===');
    }
    
    if (stdout) {
      console.log('=== STDOUT OUTPUT ===');
      console.log(stdout);
      console.log('=== END STDOUT ===');
    }
    
    // Parse the JSON result from stdout
    const lines = stdout.trim().split('\n');
    const resultLine = lines.find(line => line.startsWith('{') && line.endsWith('}'));
    
    if (resultLine) {
      console.log('Found JSON result:', resultLine);
      return JSON.parse(resultLine);
    } else {
      console.error('No JSON result found in output');
      console.error('All lines:', lines);
      throw new Error('No valid JSON result found in output');
    }
    
  } catch (error) {
    console.error('Failed to execute seller lookup:', error);
    throw error;
  }
}