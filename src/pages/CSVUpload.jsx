import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../partials/Header';
import Sidebar from '../partials/Sidebar';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

function CSVUpload() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mapping of CSV fields to database fields
  const fieldMapping = {
    'source': 'source',
    'name': 'name',
    'original_price': 'asking_price',
    'asking_price': 'asking_price',
    'annual_revenue': 'annual_revenue',
    'annual_profit': 'annual_profit',
    'url': 'original_url',
    'business_name': 'name',
    'location': 'location',
    'city': 'location',
    'state': 'location',
    'country': 'location',
    'industry': 'industry',
    'description': 'description',
    'full_description': 'description',
    'established_date': 'established_date',
    'years_in_business': 'years_in_business',
    'employees': 'employees',
    'reason_for_selling': 'reason_for_selling',
    'seller_financing': 'seller_financing',
    'monthly_revenue': 'monthly_revenue',
    'monthly_profit': 'monthly_profit',
    'multiple': 'multiple',
    'inventory_value': 'inventory_value',
    'real_estate_included': 'real_estate_included',
    'image_urls': 'image_urls',
    'scrape_timestamp': 'scraped_at'
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

  const handlePreview = (fileToPreview) => {
    Papa.parse(fileToPreview, {
      header: true,
      preview: 5,
      complete: (results) => {
        setPreviewData(results.data);
        setShowPreview(true);
      },
      error: (error) => {
        setErrors([`Preview error: ${error.message}`]);
      }
    });
  };

  const transformData = (row) => {
    const transformed = {
      source: row.source || 'CSV Import',
      scraped_at: row.scrape_timestamp ? new Date(row.scrape_timestamp).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_off_market: false // CSV imports are on-market listings
    };

    // Process each field with proper type conversion
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
        // Default text fields
        else {
          transformed[dbField] = value.trim();
        }
      }
    });

    // Ensure required fields
    if (!transformed.name) {
      transformed.name = row.business_name || row.name || 'Unnamed Business';
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
        const listings = [];
        const parseErrors = [];

        results.data.forEach((row, index) => {
          try {
            const transformed = transformData(row);
            if (transformed.name && (transformed.original_url || transformed.source)) {
              listings.push(transformed);
            } else {
              parseErrors.push(`Row ${index + 2}: Missing required fields (name and url/source)`);
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
              .from('business_listings')
              .upsert(listings, {
                onConflict: 'name,original_url,source',
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
          setErrors(['No valid listings found in the CSV file']);
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
              <div className="max-w-3xl">
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
                    Upload a CSV file with business listing data. The file should include columns like: name, asking_price, annual_revenue, location, industry, etc.
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

                {errors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
                )}

                {uploadResults && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Upload Results:</h3>
                    <ul className="text-sm text-green-700 dark:text-green-300">
                      <li>Total rows: {uploadResults.total}</li>
                      <li>Successfully imported: {uploadResults.successful}</li>
                      <li>Failed/Skipped: {uploadResults.failed}</li>
                    </ul>
                    {uploadResults.successful > 0 && (
                      <button
                        onClick={() => navigate('/listings')}
                        className="mt-3 text-sm text-green-600 dark:text-green-400 hover:underline"
                      >
                        View imported listings →
                      </button>
                    )}
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