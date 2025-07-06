import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import Papa from 'papaparse';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (asins: any[]) => Promise<void>;
  brandId?: string;
  portfolioId?: string;
}

interface ImportedASIN {
  asin: string;
  product_name?: string;
  brand?: string;
  category?: string;
  current_price?: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  monthly_units_sold?: number;
  profit_margin?: number;
}

function BulkImportModal({ isOpen, onClose, onImport, brandId, portfolioId }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedASIN[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[];
        
        // Filter out empty rows and validate data
        const validASINs = data
          .filter(row => row.asin || row.ASIN) // Check for ASIN field
          .map(row => ({
            asin: row.asin || row.ASIN,
            product_name: row.product_name || row['Product Name'] || row.title || row.Title,
            brand: row.brand || row.Brand,
            category: row.category || row.Category,
            current_price: parseFloat(row.current_price || row.price || row.Price || 0),
            monthly_revenue: parseFloat(row.monthly_revenue || row.revenue || row.Revenue || 0),
            monthly_profit: parseFloat(row.monthly_profit || row.profit || row.Profit || 0),
            monthly_units_sold: parseInt(row.monthly_units_sold || row.units || row.Units || 0),
            profit_margin: parseFloat(row.profit_margin || row.margin || row.Margin || 0)
          }))
          .filter(asin => asin.asin); // Ensure ASIN exists

        if (validASINs.length === 0) {
          setError('No valid ASINs found in the CSV file. Make sure your CSV has an "asin" or "ASIN" column.');
          setPreview([]);
        } else {
          setPreview(validASINs);
          setError(null);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setPreview([]);
      },
      header: true,
      skipEmptyLines: true
    });
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setError('No ASINs to import');
      return;
    }

    setImporting(true);
    setImportStatus('idle');
    
    try {
      // Add brand_id and portfolio_id to each ASIN
      const asinsToImport = preview.map(asin => ({
        ...asin,
        brand_id: brandId,
        portfolio_id: portfolioId
      }));
      
      await onImport(asinsToImport);
      setImportStatus('success');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1500);
    } catch (error) {
      console.error('Error importing ASINs:', error);
      setError('Failed to import ASINs. Please try again.');
      setImportStatus('error');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setError(null);
    setPreview([]);
    setImportStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['asin', 'product_name', 'brand', 'category', 'current_price', 'monthly_revenue', 'monthly_profit', 'monthly_units_sold', 'profit_margin'],
      ['B08N5WRWNW', 'Echo Dot (4th Gen)', 'Amazon', 'Smart Speakers', '49.99', '125000', '25000', '2500', '20'],
      ['B07FZ8S74R', 'Echo Show 8', 'Amazon', 'Smart Displays', '84.99', '85000', '17000', '1000', '20']
    ];
    
    const csv = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asin_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Bulk Import ASINs
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>First row must contain column headers</li>
                    <li>Required column: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">asin</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ASIN</code></li>
                    <li>Optional columns: product_name, brand, category, current_price, monthly_revenue, monthly_profit, monthly_units_sold, profit_margin</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CSV files only
                  </p>
                  {file && (
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {importStatus === 'success' && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Successfully imported {preview.length} ASINs!
                  </p>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {preview.length > 0 && importStatus !== 'success' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Preview ({preview.length} ASINs)
                </h4>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ASIN
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {preview.slice(0, 10).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {item.asin}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {item.product_name || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {item.brand || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            ${item.monthly_revenue?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 10 && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 text-center">
                      And {preview.length - 10} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleImport}
              disabled={preview.length === 0 || importing || importStatus === 'success'}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {preview.length} ASINs
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                resetModal();
              }}
              disabled={importing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkImportModal;