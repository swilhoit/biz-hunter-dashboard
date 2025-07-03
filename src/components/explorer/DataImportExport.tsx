import React, { useState, useCallback } from 'react';
import { Upload, Download, FileText, Database, AlertCircle, Check } from 'lucide-react';
import Papa from 'papaparse';

interface DataImportExportProps {
  onDataImport: (data: any[]) => void;
  exportData: any[];
  segments?: any[];
}

export function DataImportExport({ onDataImport, exportData, segments = [] }: DataImportExportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setImportStatus('Reading file...');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          // Handle JSON import
          const data = JSON.parse(content);
          const products = Array.isArray(data) ? data : data.products || [];
          
          setImportStatus(`Processing ${products.length} products...`);
          setTimeout(() => {
            onDataImport(products);
            setImportStatus(`Successfully imported ${products.length} products!`);
            setIsImporting(false);
          }, 500);
        } else {
          // Handle CSV import
          Papa.parse(content, {
            header: true,
            complete: (results) => {
              setImportStatus(`Processing ${results.data.length} products...`);
              setTimeout(() => {
                onDataImport(results.data);
                setImportStatus(`Successfully imported ${results.data.length} products!`);
                setIsImporting(false);
              }, 500);
            },
            error: (error) => {
              setError(`Error parsing CSV: ${error.message}`);
              setIsImporting(false);
            }
          });
        }
      } catch (err) {
        setError(`Error processing file: ${err.message}`);
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      setIsImporting(false);
    };

    reader.readAsText(file);
  }, [onDataImport]);

  const handleExport = useCallback(() => {
    if (exportData.length === 0) {
      setError('No data to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportFormat === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amazon-explorer-data-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // JSON export with metadata
      const exportObject = {
        metadata: {
          exportDate: new Date().toISOString(),
          productCount: exportData.length,
          segmentCount: segments.length,
          totalRevenue: exportData.reduce((sum, p) => sum + (p.revenue || 0), 0),
          totalSales: exportData.reduce((sum, p) => sum + (p.sales || 0), 0)
        },
        products: exportData,
        segments: segments
      };
      
      const json = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amazon-explorer-data-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    
    setImportStatus('Export completed successfully!');
    setTimeout(() => setImportStatus(null), 3000);
  }, [exportData, segments, exportFormat]);

  const sampleData = [
    { field: 'asin', description: 'Amazon Standard Identification Number', example: 'B08N5WRWNW' },
    { field: 'title', description: 'Product title', example: 'Echo Dot (4th Gen)' },
    { field: 'price', description: 'Product price in USD', example: '49.99' },
    { field: 'sales', description: 'Monthly sales volume', example: '1500' },
    { field: 'revenue', description: 'Monthly revenue', example: '74985' },
    { field: 'reviews', description: 'Total number of reviews', example: '15420' },
    { field: 'rating', description: 'Average rating (1-5)', example: '4.5' },
    { field: 'brand', description: 'Brand name', example: 'Amazon' },
    { field: 'category', description: 'Product category', example: 'Electronics' },
    { field: 'imageUrl', description: 'Product image URL', example: 'https://...' }
  ];

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Import Data</h3>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Import product data from CSV or JSON files to analyze in the explorer
          </p>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
                id="file-import"
              />
              <label 
                htmlFor="file-import" 
                className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import File'}
              </label>
            </label>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Supported formats: CSV, JSON
            </span>
          </div>

          {importStatus && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 dark:text-green-400">{importStatus}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Export Data</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Export your analyzed data and segments
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {exportData.length} products ready for export
                {segments.length > 0 && ` • ${segments.length} segments`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON (with metadata)</option>
              </select>
              
              <button
                onClick={handleExport}
                disabled={exportData.length === 0}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Format Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Data Format Guide</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sampleData.map((field) => (
                <tr key={field.field} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                    {field.field}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {field.description}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {field.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Import Tips:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Ensure your CSV has a header row with field names</li>
            <li>• Price, sales, revenue, reviews, and rating should be numeric values</li>
            <li>• ASIN should be a valid Amazon product identifier</li>
            <li>• JSON files can include additional metadata and custom fields</li>
          </ul>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center">
        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Need a template to get started?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              const template = Papa.unparse([sampleData.reduce((acc, field) => {
                acc[field.field] = field.example;
                return acc;
              }, {})]);
              const blob = new Blob([template], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'amazon-explorer-template.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="text-sm text-violet-600 hover:text-violet-800 font-medium"
          >
            Download CSV Template
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => {
              const template = {
                products: [sampleData.reduce((acc, field) => {
                  acc[field.field] = field.example;
                  return acc;
                }, {})]
              };
              const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'amazon-explorer-template.json';
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="text-sm text-violet-600 hover:text-violet-800 font-medium"
          >
            Download JSON Template
          </button>
        </div>
      </div>
    </div>
  );
}