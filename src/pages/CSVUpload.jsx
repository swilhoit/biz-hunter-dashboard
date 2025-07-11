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

  // Mapping of CSV fields to database fields
  const fieldMapping = {
    'source': 'source',
    'name': 'name',
    'original_price': 'asking_price',
    'asking_price': 'asking_price',
    'price': 'asking_price',
    'annual_revenue': 'annual_revenue',
    'annual_profit': 'annual_profit',
    'revenue': 'annual_revenue',
    'profit': 'annual_profit',
    'url': 'original_url',
    'link': 'original_url',
    'website': 'original_url',
    'listing_url': 'original_url',
    'business_name': 'name',
    'title': 'name',
    'listing_name': 'name',
    'company': 'name',
    'location': 'location',
    'city': 'location',
    'state': 'location',
    'country': 'location',
    'industry': 'industry',
    'category': 'industry',
    'niche': 'niche',
    'description': 'description',
    'full_description': 'description',
    'summary': 'description',
    'established_date': 'established_date',
    'founded': 'established_date',
    'years_in_business': 'years_in_business',
    'age': 'years_in_business',
    'employees': 'employees',
    'staff': 'employees',
    'reason_for_selling': 'reason_for_selling',
    'reason': 'reason_for_selling',
    'seller_financing': 'seller_financing',
    'financing': 'seller_financing',
    'monthly_revenue': 'monthly_revenue',
    'monthly_profit': 'monthly_profit',
    'multiple': 'multiple',
    'valuation_multiple': 'multiple',
    'inventory_value': 'inventory_value',
    'inventory': 'inventory_value',
    'real_estate_included': 'real_estate_included',
    'real_estate': 'real_estate_included',
    'image_urls': 'image_urls',
    'images': 'image_urls',
    'scrape_timestamp': 'scraped_at',
    'scraped_date': 'scraped_at',
    'date_scraped': 'scraped_at',
    'yoy_trend': 'yoy_trend_percent',
    'yoy_growth': 'yoy_trend_percent',
    'revenue_growth': 'yoy_trend_percent',
    'year_over_year': 'yoy_trend_percent',
    'growth': 'yoy_trend_percent'
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
    // Use AI mappings if available, otherwise fall back to hardcoded mappings
    const mappingsToUse = columnMappings?.mappings || [];
    const hasMappings = mappingsToUse.length > 0;
    
    const transformed = {
      source: row.source || 'CSV Import',
      scraped_at: row.scrape_timestamp ? new Date(row.scrape_timestamp).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_off_market: false // CSV imports are on-market listings
    };

    // If we have AI mappings, use them
    if (hasMappings) {
      const result = CSVColumnMappingService.transformDataWithMapping([row], mappingsToUse)[0];
      Object.assign(transformed, result);
      
      // Ensure source is always set
      if (!transformed.source) {
        transformed.source = 'CSV Import';
      }
    } else {
      // Fall back to original logic with hardcoded mappings
      Object.entries(row).forEach(([key, value]) => {
        const dbField = fieldMapping[key.toLowerCase()];
        if (dbField && value && value.trim() !== '') {
        // Handle numeric fields
        if (['asking_price', 'annual_revenue', 'annual_profit', 'monthly_revenue', 'monthly_profit', 'inventory_value'].includes(dbField)) {
          const numValue = parseFloat(value.replace(/[$,]/g, ''));
          if (!isNaN(numValue)) {
            transformed[dbField] = Math.round(numValue);
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
        // Handle boolean fields
        else if (['seller_financing', 'real_estate_included'].includes(dbField)) {
          transformed[dbField] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
        }
        // Handle array fields (image_urls)
        else if (dbField === 'image_urls') {
          try {
            const urls = value.startsWith('[') ? JSON.parse(value) : value.split(';').map(url => url.trim()).filter(url => url);
            if (urls.length > 0) {
              transformed.image_url = urls[0]; // Use first image as main image
              transformed.image_urls = urls;
            }
          } catch (e) {
            console.warn('Failed to parse image URLs:', e);
          }
        }
        // Handle numeric fields like years_in_business, employees
        else if (['years_in_business', 'employees'].includes(dbField)) {
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
        // Handle YoY trend percentage
        else if (dbField === 'yoy_trend_percent') {
          // Remove % sign if present and parse
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

    return transformed;
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
            const hasRequiredSource = transformed.original_url || transformed.source;
            
            if (hasRequiredName && hasRequiredSource) {
              listings.push(transformed);
            } else {
              const missingFields = [];
              if (!hasRequiredName) missingFields.push(targetTable === 'deals' ? 'business_name' : 'name');
              if (!hasRequiredSource) missingFields.push('url or source');
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
          try {
            const { data, error } = await supabase
              .from(targetTable)
              .upsert(listings, {
                onConflict: targetTable === 'business_listings' ? 'name,original_url,source' : undefined,
                ignoreDuplicates: true
              })
              .select();

            if (error) {
              setErrors([`Database error: ${error.message}`]);
            } else {
              setUploadResults({
                total: results.data.length,
                successful: data?.length || 0,
                failed: results.data.length - (data?.length || 0),
                errors: parseErrors
              });
            }
          } catch (error) {
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