import React, { useState } from 'react';
import { testStorageAccess, ensureStorageBucketExists } from '../lib/storage-setup';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function StorageTest() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults(null);

    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Check if user is authenticated
      console.log('Test 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      testResults.tests.authentication = {
        success: !authError && !!user,
        error: authError?.message,
        userId: user?.id,
        userEmail: user?.email
      };

      // Test 1.5: Check user's deal access
      if (user) {
        console.log('Test 1.5: Checking user deal access...');
        const { data: userDeals, error: dealsError } = await supabase
          .from('deals')
          .select('id, business_name, created_by')
          .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
          .limit(5);

        testResults.tests.dealAccess = {
          success: !dealsError,
          error: dealsError?.message,
          dealCount: userDeals?.length || 0,
          deals: userDeals?.map(d => ({ id: d.id, name: d.business_name, isOwner: d.created_by === user.id }))
        };
      }

      // Test 2: Test storage access
      console.log('Test 2: Testing storage access...');
      const storageTest = await testStorageAccess();
      testResults.tests.storageAccess = storageTest;

      // Test 3: Ensure bucket exists
      console.log('Test 3: Ensuring bucket exists...');
      const bucketTest = await ensureStorageBucketExists();
      testResults.tests.bucketCreation = bucketTest;

      // Test 4: Try to upload a small test file using deal ID structure
      if (user && testResults.tests.dealAccess?.deals?.length > 0) {
        console.log('Test 4: Testing file upload with deal ID structure...');
        try {
          const testFileContent = 'This is a test file';
          const testFile = new Blob([testFileContent], { type: 'text/plain' });
          const dealId = testResults.tests.dealAccess.deals[0].id;
          const testFileName = `${dealId}/test-${Date.now()}.txt`;

          console.log('Uploading test file to path:', testFileName);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('deal-documents')
            .upload(testFileName, testFile);

          testResults.tests.fileUpload = {
            success: !uploadError,
            error: uploadError?.message,
            uploadData,
            dealId,
            filePath: testFileName
          };

          // Test 5: Try to download the test file
          if (!uploadError) {
            console.log('Test 5: Testing file download...');
            const { data: downloadData, error: downloadError } = await supabase.storage
              .from('deal-documents')
              .download(testFileName);

            testResults.tests.fileDownload = {
              success: !downloadError,
              error: downloadError?.message,
              fileSize: downloadData?.size
            };

            // Clean up test file
            await supabase.storage
              .from('deal-documents')
              .remove([testFileName]);
          }
        } catch (uploadError: any) {
          testResults.tests.fileUpload = {
            success: false,
            error: uploadError.message
          };
        }
      } else if (user) {
        // If no accessible deals, try a simple upload test without deal structure
        console.log('Test 4b: Testing simple file upload (no deal structure)...');
        try {
          const testFileContent = 'This is a simple test file';
          const testFile = new Blob([testFileContent], { type: 'text/plain' });
          const testFileName = `test-simple-${Date.now()}.txt`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('deal-documents')
            .upload(testFileName, testFile);

          testResults.tests.simpleFileUpload = {
            success: !uploadError,
            error: uploadError?.message,
            uploadData,
            filePath: testFileName
          };

          // Test download if upload succeeded
          if (!uploadError) {
            const { data: downloadData, error: downloadError } = await supabase.storage
              .from('deal-documents')
              .download(testFileName);

            testResults.tests.simpleFileDownload = {
              success: !downloadError,
              error: downloadError?.message,
              fileSize: downloadData?.size
            };

            // Clean up
            await supabase.storage
              .from('deal-documents')
              .remove([testFileName]);
          }
        } catch (error: any) {
          testResults.tests.simpleFileUpload = {
            success: false,
            error: error.message
          };
        }
      }

      // Test 6: Check RLS policies
      console.log('Test 6: Checking database table access...');
      try {
        const { data: testData, error: tableError } = await supabase
          .from('deal_documents')
          .select('id')
          .limit(1);

        testResults.tests.tableAccess = {
          success: !tableError,
          error: tableError?.message,
          canRead: !!testData
        };
      } catch (tableError: any) {
        testResults.tests.tableAccess = {
          success: false,
          error: tableError.message
        };
      }

    } catch (error: any) {
      testResults.error = error.message;
    }

    setResults(testResults);
    setLoading(false);
  };

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (success === false) return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Storage Diagnostics
        </h2>
        <button
          onClick={runTests}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Running Tests...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Tested at: {new Date(results.timestamp).toLocaleString()}
          </div>

          {results.error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                Critical Error: {results.error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {Object.entries(results.tests || {}).map(([testName, result]: [string, any]) => (
              <div key={testName} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {getStatusIcon(result.success)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Error: {result.error}
                    </div>
                  )}
                  {result.userId && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      User ID: {result.userId}
                    </div>
                  )}
                  {result.buckets && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Buckets: {result.buckets.join(', ')}
                    </div>
                  )}
                  {result.fileSize && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Downloaded file size: {result.fileSize} bytes
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}