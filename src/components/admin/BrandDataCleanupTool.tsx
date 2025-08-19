import React, { useState } from 'react';
import { Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { BrandDataCleanup } from '../../utils/cleanupBrandData';

export default function BrandDataCleanupTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleCleanup = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      await BrandDataCleanup.runFullCleanup();
      setResult({
        success: true,
        message: 'Brand data cleanup completed successfully. Check the console for details.'
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      setResult({
        success: false,
        message: 'Brand data cleanup failed. Check the console for errors.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Trash2 className="mr-2 h-5 w-5" />
          Brand Data Cleanup Tool
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This tool cleans up invalid brand names in the database that are actually product descriptions.
          It will convert entries like "100 Count White Unscented Candles" to NULL or "Unknown".
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-semibold">Warning:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>This operation will modify brand data in the keyword_rankings and asins tables</li>
              <li>Invalid brand names will be set to NULL or "Unknown"</li>
              <li>This may affect existing Share of Voice reports</li>
              <li>Consider backing up your data before proceeding</li>
            </ul>
          </div>
        </div>
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-md ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            )}
            <p className={`text-sm ${
              result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {result.message}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleCleanup}
        disabled={isRunning}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <>
            <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Running Cleanup...
          </>
        ) : (
          <>
            <Trash2 className="-ml-1 mr-2 h-4 w-4" />
            Run Brand Data Cleanup
          </>
        )}
      </button>

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-semibold mb-2">What this tool does:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Identifies brand names that are actually product descriptions</li>
          <li>Sets invalid brand names to NULL in keyword_rankings table</li>
          <li>Updates invalid brand names to "Unknown" in asins table</li>
          <li>Attempts to extract real brand names from product titles where possible</li>
        </ol>
      </div>
    </div>
  );
}