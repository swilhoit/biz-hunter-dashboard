import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../partials/Header';
import Sidebar from '../partials/Sidebar';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { CSVColumnMappingService } from '../services/CSVColumnMappingService';
import { Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import CSVMappingEditor from '../components/CSVMappingEditor';

function CSVUpload() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [columnMappings, setColumnMappings] = useState(null);
  const [showMappingDetails, setShowMappingDetails] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetTable, setTargetTable] = useState('deals'); // 'deals' or 'business_listings'

  // Mapping of CSV fields to database fields - context-aware based on target table
  const getFieldMapping = () => {
    if (targetTable === 'deals') {
      return {
        // Basic fields
        'source': 'source',
        'business_name': 'business_name',
        'name': 'business_name',
        'title': 'business_name',
        'company': 'business_name',
        'listing_name': 'business_name',
        // Financial fields
        'asking_price': 'asking_price',
        'price': 'asking_price',
        'original_price': 'asking_price',
        'list_price': 'list_price',
        'annual_revenue': 'annual_revenue',
        'revenue': 'annual_revenue',
        'annual_profit': 'annual_profit',
        'profit': 'annual_profit',
        'monthly_revenue': 'avg_monthly_revenue',
        'monthly_profit': 'avg_monthly_profit',
        'ttm_revenue': 'ttm_revenue',
        'ttm_profit': 'ttm_profit',
        'ebitda': 'ebitda',
        'sde': 'sde',
        'multiple': 'multiple',
        'valuation_multiple': 'multiple',
        'inventory': 'inventory_value',
        'inventory_value': 'inventory_value',
        // Business details
        'industry': 'amazon_category',
        'category': 'amazon_category',
        'amazon_category': 'amazon_category',
        'location': 'seller_location',
        'seller_location': 'seller_location',
        'description': 'business_description',
        'business_description': 'business_description',
        'summary': 'business_description',
        // Amazon specific
        'store_name': 'amazon_store_name',
        'brand': 'amazon_store_name',
        'fba_percentage': 'fba_percentage',
        'fba_percent': 'fba_percentage',
        // Seller info
        'seller_name': 'seller_name',
        'seller_email': 'seller_email',
        'seller_phone': 'seller_phone',
        // Operations
        'hours_per_week': 'hours_per_week',
        'owner_involvement': 'owner_involvement',
        'growth_trend': 'growth_trend'
      };
    } else {
      // business_listings mapping
      return {
        'source': 'source',
        'name': 'name',
        'business_name': 'name',
        'title': 'name',
        'company': 'name',
        'listing_name': 'name',
        'url': 'original_url',
        'link': 'original_url',
        'website': 'original_url',
        'listing_url': 'original_url',
        'asking_price': 'asking_price',
        'price': 'asking_price',
        'annual_revenue': 'annual_revenue',
        'revenue': 'annual_revenue',
        'annual_profit': 'annual_profit',
        'profit': 'annual_profit',
        'monthly_revenue': 'monthly_revenue',
        'monthly_profit': 'monthly_profit',
        'multiple': 'profit_multiple',
        'valuation_multiple': 'profit_multiple',
        'profit_multiple': 'profit_multiple',
        'inventory': 'inventory_value',
        'inventory_value': 'inventory_value',
        'location': 'location',
        'city': 'location',
        'state': 'location',
        'industry': 'industry',
        'category': 'industry',
        'description': 'description',
        'summary': 'description',
        'business_description': 'description',
        'business_age_months': 'business_age_months',
        'age': 'business_age_months',
        'established_year': 'established_year',
        'founded': 'established_year',
        'seller_name': 'seller_name',
        'owner_name': 'owner_name',
        'image_url': 'image_url',
        'image': 'image_url',
        'scraped_at': 'scraped_at',
        'scrape_timestamp': 'scraped_at',
        'scraped_date': 'scraped_at'
      };
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrors([]);
      setUploadResults(null);
      handlePreview(selectedFile);
    } else {
      setErrors(['Please select a valid CSV file']);
    }
  };

  const handlePreview = async (fileToPreview) => {
    Papa.parse(fileToPreview, {
      header: true,
      preview: 10, // Get more rows for better AI analysis
      complete: async (results) => {
        setPreviewData(results.data.slice(0, 5)); // Show first 5 rows in preview
        setShowPreview(true);
        
        // Automatically analyze column mappings with AI
        if (results.data.length > 0) {
          setIsAnalyzing(true);
          try {
            const headers = Object.keys(results.data[0]);
            const mappingResult = await CSVColumnMappingService.generateSmartMapping(
              headers,
              results.data,
              targetTable
            );
            setColumnMappings(mappingResult);
          } catch (error) {
            console.error('Error analyzing columns:', error);
            setErrors([`AI column analysis failed: ${error.message}. Using fallback mapping.`]);
          } finally {
            setIsAnalyzing(false);
          }
        }
      },
      error: (error) => {
        setErrors([`Preview error: ${error.message}`]);
      }
    });
  };

  const transformData = (row) => {
    try {
      // Use AI mappings if available, otherwise fall back to hardcoded mappings
      const mappingsToUse = columnMappings?.mappings || [];
      const hasMappings = mappingsToUse.length > 0;
      
      const transformed = {
        source: row.source || 'CSV Import',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add scraped_at for business_listings table
      if (targetTable === 'business_listings') {
        transformed.scraped_at = row.scrape_timestamp ? new Date(row.scrape_timestamp).toISOString() : new Date().toISOString();
      }
    
    // Set market status based on target table
    if (targetTable === 'deals') {
      transformed.is_on_market = true; // CSV imports are on-market listings
    } else {
      transformed.is_off_market = false; // CSV imports are on-market listings
    }

    // If we have AI mappings, use them
    if (hasMappings) {
      const result = CSVColumnMappingService.transformDataWithMapping([row], mappingsToUse)[0];
      
      // Clean up field names - remove any that have spaces or capital letters
      const cleanedResult = {};
      Object.entries(result).forEach(([key, value]) => {
        // Convert field names to snake_case and lowercase
        const cleanKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        cleanedResult[cleanKey] = value;
      });
      
      Object.assign(transformed, cleanedResult);
      
      // Post-process AI mappings to handle table-specific field names
      if (targetTable === 'deals') {
        // For deals table, rename description to business_description
        if (transformed.description && !transformed.business_description) {
          transformed.business_description = transformed.description;
          delete transformed.description;
        }
        // Remove niche field as it doesn't exist in deals table
        if (transformed.niche && !transformed.industry) {
          transformed.industry = transformed.niche;
        }
        delete transformed.niche;
        // Handle market status field
        if (transformed.is_off_market !== undefined) {
          transformed.is_on_market = !transformed.is_off_market;
          delete transformed.is_off_market;
        }
      } else if (targetTable === 'business_listings') {
        // For business_listings table, rename business_description to description
        if (transformed.business_description && !transformed.description) {
          transformed.description = transformed.business_description;
          delete transformed.business_description;
        }
        // Handle market status field
        if (transformed.is_on_market !== undefined) {
          transformed.is_off_market = !transformed.is_on_market;
          delete transformed.is_on_market;
        }
      }
      
      // Ensure source is always set
      if (!transformed.source) {
        transformed.source = 'CSV Import';
      }
    } else {
      // Fall back to original logic with hardcoded mappings
      const fieldMapping = getFieldMapping();
      Object.entries(row).forEach(([key, value]) => {
        const dbField = fieldMapping[key.toLowerCase()];
        if (dbField && value && value.trim() !== '') {
        // Handle numeric fields based on target table and data type
        const financialFields = targetTable === 'deals' 
          ? ['asking_price', 'list_price', 'annual_revenue', 'annual_profit', 'avg_monthly_revenue', 'avg_monthly_profit', 'ttm_revenue', 'ttm_profit', 'ebitda', 'sde', 'inventory_value']
          : ['asking_price', 'annual_revenue', 'annual_profit', 'monthly_revenue', 'monthly_profit', 'inventory_value'];
          
        if (financialFields.includes(dbField)) {
          const numValue = parseFloat(value.toString().replace(/[$,]/g, ''));
          if (!isNaN(numValue)) {
            // For business_listings: asking_price, annual_revenue, annual_profit are BIGINT (need integers)
            // For deals: all financial fields are NUMERIC (can have decimals)
            if (targetTable === 'business_listings' && ['asking_price', 'annual_revenue', 'annual_profit'].includes(dbField)) {
              transformed[dbField] = Math.round(numValue);
            } else {
              transformed[dbField] = numValue;
            }
          }
        }
        // Handle location combining
        else if (dbField === 'location') {
          if (key === 'city' || key === 'state' || key === 'country') {
            const city = row.city || '';
            const state = row.state || '';
            const country = row.country || '';
            const parts = [city, state, country].filter(p => p && p.trim());
            if (parts.length > 0) {
              transformed.location = parts.join(', ');
            }
          } else {
            transformed[dbField] = value.trim();
          }
        }
        // Handle boolean fields (only for deals table)
        else if (targetTable === 'deals' && ['brand_registry', 'training_included', 'verified_revenue', 'verified_profit'].includes(dbField)) {
          transformed[dbField] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
        }
        // Handle boolean for business_listings
        else if (targetTable === 'business_listings' && dbField === 'is_off_market') {
          transformed[dbField] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
        }
        // Handle array fields (image_url for business_listings)
        else if (dbField === 'image_url' && targetTable === 'business_listings') {
          try {
            // If value looks like an array, take the first item
            if (value.startsWith('[')) {
              const urls = JSON.parse(value);
              if (urls.length > 0) {
                transformed.image_url = urls[0];
              }
            } else if (value.includes(';') || value.includes(',')) {
              // Handle semicolon or comma separated URLs
              const urls = value.split(/[;,]/).map(url => url.trim()).filter(url => url);
              if (urls.length > 0) {
                transformed.image_url = urls[0];
              }
            } else {
              transformed.image_url = value.trim();
            }
          } catch (e) {
            console.warn('Failed to parse image URLs:', e);
            transformed.image_url = value.trim(); // Fallback to raw value
          }
        }
        // Handle numeric fields for business age
        else if (dbField === 'business_age_months') {
          const numValue = parseInt(value);
          if (!isNaN(numValue)) {
            transformed[dbField] = numValue;
          }
        }
        // Handle multiplier
        else if (dbField === 'multiple') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            transformed[dbField] = numValue;
          }
        }
        // Handle percentage fields for deals
        else if (targetTable === 'deals' && ['gross_margin', 'operating_margin', 'net_margin', 'profit_margin', 'fba_percentage', 'tacos', 'acos', 'cogs_percentage'].includes(dbField)) {
          // Remove % sign if present and parse
          const cleanValue = value.toString().replace('%', '').trim();
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue)) {
            transformed[dbField] = numValue;
          }
        }
        // Handle profit_margin for business_listings
        else if (targetTable === 'business_listings' && dbField === 'profit_margin') {
          const cleanValue = value.toString().replace('%', '').trim();
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue)) {
            transformed[dbField] = numValue;
          }
        }
        // Default text fields
        else {
          transformed[dbField] = value.trim();
        }
      }
    });
    }

    // Ensure required fields based on target table
    if (targetTable === 'deals') {
      if (!transformed.business_name) {
        transformed.business_name = row.business_name || row.name || row.title || 'Unnamed Business';
      }
    } else {
      if (!transformed.name) {
        transformed.name = row.business_name || row.name || row.title || 'Unnamed Business';
      }
    }

    // Final safety check: ensure no invalid fields for the target table
    if (targetTable === 'deals') {
      // Define allowed fields for deals table (verified against actual schema)
      const allowedDealFields = [
        // Basic information
        'business_name', 'dba_names', 'entity_type', 'business_description',
        // Financial metrics (all NUMERIC in database)
        'asking_price', 'list_price', 'annual_revenue', 'annual_profit', 
        'ebitda', 'sde', 'multiple', 'inventory_value',
        'avg_monthly_revenue', 'avg_monthly_profit', 'ttm_revenue', 'ttm_profit',
        'gross_margin', 'operating_margin', 'net_margin', 'profit_margin',
        // Business details
        'business_age', 'business_age_years', 'business_age_months', 
        'employee_count', 'business_started_date', 'pricing_period',
        // Amazon specific
        'amazon_store_name', 'amazon_store_url', 'amazon_category', 
        'amazon_subcategory', 'seller_account_health', 'fba_percentage',
        'sku_count', 'parent_asin_count', 'brand_registry', 
        'tacos', 'acos', 'cogs_percentage', 
        'top_seller_retail_price', 'avg_retail_price',
        // Seller info
        'seller_name', 'seller_email', 'seller_phone', 'seller_location',
        // Operations
        'hours_per_week', 'owner_involvement', 'growth_trend',
        'transfer_period_days', 'training_included', 'support_period_days',
        // Metadata
        'date_listed', 'priority', 'is_on_market', 'source', 'stage',
        // Additional JSONB fields that exist
        'top_skus', 'assets_included', 'monthly_financials', 
        'revenue_sources', 'traffic_breakdown',
        // Verification fields
        'last_month_revenue', 'last_month_profit', 
        'verified_revenue', 'verified_profit', 'verification_date'
      ];
      
      // Remove any fields not in the allowed list
      Object.keys(transformed).forEach(key => {
        if (!allowedDealFields.includes(key) && 
            !['source', 'created_at', 'updated_at'].includes(key)) {
          delete transformed[key];
        }
      });
      
      // Ensure is_on_market is set
      if (transformed.is_on_market === undefined) {
        transformed.is_on_market = true;
      }
    } else if (targetTable === 'business_listings') {
      // Define allowed fields for business_listings table (verified against actual schema)
      const allowedListingFields = [
        // Basic fields
        'name', 'source', 'original_url',
        // Financial fields (asking_price, annual_revenue, annual_profit are BIGINT)
        'asking_price', 'annual_revenue', 'annual_profit', 
        'monthly_revenue', 'monthly_profit', 'gross_revenue', 
        'net_revenue', 'inventory_value', 'profit_multiple', 'profit_margin',
        // Business details
        'industry', 'location', 'description', 'business_age_months', 
        'established_year', 'revenue_trend', 'asin_count',
        // Seller/Owner info
        'seller_name', 'owner_name', 'owner_title', 
        'owner_email', 'owner_phone', 'owner_linkedin', 'company_website',
        // Status fields
        'is_off_market', 'listing_status', 'status',
        // Other fields
        'image_url', 'scraped_at', 'highlights'
      ];
      
      // Remove any fields not in the allowed list
      Object.keys(transformed).forEach(key => {
        if (!allowedListingFields.includes(key) && 
            !['created_at', 'updated_at'].includes(key)) {
          delete transformed[key];
        }
      });
      
      // Ensure is_off_market is set
      if (transformed.is_off_market === undefined) {
        transformed.is_off_market = false;
      }
    }
    
    return transformed;
    } catch (error) {
      console.error('Error transforming row:', error);
      throw new Error(`Failed to transform row: ${error.message}`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrors(['Please select a file first']);
      return;
    }

    setUploading(true);
    setErrors([]);
    setUploadResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('CSV Parse Results:', {
          rowCount: results.data.length,
          headers: results.data.length > 0 ? Object.keys(results.data[0]) : [],
          firstRow: results.data[0]
        });
        
        const listings = [];
        const parseErrors = [];

        results.data.forEach((row, index) => {
          try {
            const transformed = transformData(row);
            
            // Debug first few rows
            if (index < 3) {
              console.log(`Row ${index + 1} transformed:`, {
                targetTable,
                business_name: transformed.business_name,
                name: transformed.name,
                original_url: transformed.original_url,
                source: transformed.source
              });
            }
            
            // Check required fields based on target table
            const hasRequiredName = targetTable === 'deals' 
              ? transformed.business_name 
              : transformed.name;
            
            // For deals, we only need source (no URL field in deals table)
            // For business_listings, we need original_url or source
            const hasRequiredSource = targetTable === 'deals'
              ? transformed.source
              : (transformed.original_url || transformed.source);
            
            if (hasRequiredName && hasRequiredSource) {
              // For deals table, remove original_url as it doesn't exist
              if (targetTable === 'deals') {
                delete transformed.original_url;
              }
              listings.push(transformed);
            } else {
              const missingFields = [];
              if (!hasRequiredName) missingFields.push(targetTable === 'deals' ? 'business_name' : 'name');
              if (!hasRequiredSource) missingFields.push(targetTable === 'deals' ? 'source' : 'url or source');
              parseErrors.push(`Row ${index + 2}: Missing required fields (${missingFields.join(' and ')})`);
            }
          } catch (error) {
            parseErrors.push(`Row ${index + 2}: ${error.message}`);
          }
        });

        if (parseErrors.length > 0) {
          setErrors(parseErrors);
        }

        if (listings.length > 0) {
          // Debug: log first listing to see what's being sent
          console.log('First listing being sent to database:', listings[0]);
          console.log('All fields:', Object.keys(listings[0]));
          
          try {
            const { data, error } = await supabase
              .from(targetTable)
              .upsert(listings, {
                onConflict: targetTable === 'business_listings' ? 'name,original_url,source' : undefined,
                ignoreDuplicates: true
              })
              .select();

            if (error) {
              console.error('Database error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
              
              // Provide more helpful error messages
              let errorMessage = `Database error: ${error.message}`;
              
              // Check for common schema errors
              if (error.message.includes('column') && error.message.includes('does not exist')) {
                const match = error.message.match(/column "(.+?)" of relation "(.+?)"/);
                if (match) {
                  errorMessage = `Field "${match[1]}" doesn't exist in the ${match[2]} table. Please check your CSV column mappings.`;
                }
              } else if (error.message.includes('invalid input syntax')) {
                errorMessage = `Data type error: ${error.message}. Please check that numeric fields contain only numbers.`;
              } else if (error.message.includes('null value in column')) {
                const match = error.message.match(/null value in column "(.+?)"/);
                if (match) {
                  errorMessage = `Required field "${match[1]}" is missing. Please ensure all required fields are provided.`;
                }
              }
              
              setErrors([errorMessage]);
            } else {
              setUploadResults({
                total: results.data.length,
                successful: data?.length || 0,
                failed: results.data.length - (data?.length || 0),
                errors: parseErrors
              });
            }
          } catch (error) {
            console.error('Upload error:', error);
            setErrors([`Upload error: ${error.message}`]);
          }
        } else {
          const helpMessage = targetTable === 'deals' 
            ? 'Please ensure your CSV has columns for business name (e.g., "name", "business_name", "title") and URL/source (e.g., "url", "link", "website", "source").'
            : 'Please ensure your CSV has columns for name (e.g., "name", "business_name", "title") and URL/source (e.g., "url", "link", "website", "source").';
          
          setErrors([
            'No valid listings found in the CSV file',
            helpMessage,
            'Common column names: name, business_name, title, url, link, website, price, asking_price, revenue, profit, location, industry, description'
          ]);
        }

        setUploading(false);
      },
      error: (error) => {
        setErrors([`Parse error: ${error.message}`]);
        setUploading(false);
      }
    });
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">CSV Import</h1>
              <p className="text-gray-600 dark:text-gray-400">Import business listings from a CSV file</p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
              <div className="max-w-4xl">
                {/* Target Table Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Import Destination
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="deals"
                        checked={targetTable === 'deals'}
                        onChange={(e) => setTargetTable(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Deals (Pipeline)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="business_listings"
                        checked={targetTable === 'business_listings'}
                        onChange={(e) => setTargetTable(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Business Listings (Feed)</span>
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a CSV file with business data. AI will automatically detect and map columns.
                  </p>
                </div>

                {showPreview && previewData && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Preview (First 5 rows)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {Object.keys(previewData[0] || {}).slice(0, 5).map((header) => (
                              <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {header}
                              </th>
                            ))}
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ...
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {previewData.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).slice(0, 5).map((value, idx) => (
                                <td key={idx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  {value?.toString().substring(0, 50) || '-'}
                                </td>
                              ))}
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                ...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* AI Column Mapping Analysis */}
                {isAnalyzing && (
                  <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-3 animate-spin text-violet-600" />
                      <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
                        AI is analyzing your CSV columns...
                      </span>
                    </div>
                  </div>
                )}

                {columnMappings && !isAnalyzing && (
                  <div className="mb-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                          <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                            AI Column Mapping Analysis
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowMappingDetails(!showMappingDetails)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            {showMappingDetails ? 'Hide' : 'Show'} Details
                            {showMappingDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {previewData && previewData.length > 0 && (
                            <>
                              <span className="text-gray-400">|</span>
                              <CSVMappingEditor
                                mappings={columnMappings}
                                onMappingsChange={setColumnMappings}
                                availableColumns={Object.keys(previewData[0])}
                                targetTable={targetTable}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-indigo-700 dark:text-indigo-300">Mapped Columns:</span>
                          <span className="ml-2 font-medium text-indigo-900 dark:text-indigo-100">
                            {columnMappings.mappings.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-indigo-700 dark:text-indigo-300">Unmapped Columns:</span>
                          <span className="ml-2 font-medium text-indigo-900 dark:text-indigo-100">
                            {columnMappings.unmappedColumns.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-indigo-700 dark:text-indigo-300">Data Types Detected:</span>
                          <span className="ml-2 font-medium text-indigo-900 dark:text-indigo-100">
                            {Object.keys(columnMappings.dataTypeDetection || {}).length}
                          </span>
                        </div>
                      </div>

                      {showMappingDetails && (
                        <div className="mt-4 space-y-3">
                          {/* Mapped Columns */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Mapped Columns
                            </h4>
                            <div className="space-y-2">
                              {columnMappings.mappings.map((mapping, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-400">{mapping.csvColumn}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{mapping.dbField}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      mapping.confidence >= 80 ? 'bg-green-100 text-green-700' :
                                      mapping.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {mapping.confidence}% confidence
                                    </span>
                                    {mapping.transformationType && (
                                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                        {mapping.transformationType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Unmapped Columns */}
                          {columnMappings.unmappedColumns.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Unmapped Columns
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {columnMappings.unmappedColumns.map((col, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {col}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggestions */}
                          {columnMappings.suggestions?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                AI Suggestions
                              </h4>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {columnMappings.suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h3>
                        <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                          {errors.slice(0, 10).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {errors.length > 10 && (
                            <li>... and {errors.length - 10} more errors</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {uploadResults && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Upload Results:</h3>
                        <ul className="text-sm text-green-700 dark:text-green-300">
                          <li>Total rows: {uploadResults.total}</li>
                          <li>Successfully imported: {uploadResults.successful}</li>
                          <li>Failed/Skipped: {uploadResults.failed}</li>
                        </ul>
                        {uploadResults.successful > 0 && (
                          <button
                            onClick={() => navigate(targetTable === 'deals' ? '/deals' : '/listings')}
                            className="mt-3 text-sm text-green-600 dark:text-green-400 hover:underline"
                          >
                            View imported {targetTable === 'deals' ? 'deals' : 'listings'} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => navigate(-1)}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload CSV'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CSVUpload;