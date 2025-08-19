import React, { useState } from 'react';
import { RailwayAPIWrapper } from '../services/RailwayAPIWrapper';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function RailwayDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setDiagnostics(null);

    try {
      const wrapper = RailwayAPIWrapper.getInstance();
      const results = await wrapper.runDiagnostics();
      setDiagnostics(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          Railway API Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Running Diagnostics...' : 'Run API Diagnostics'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {diagnostics && (
            <div className="space-y-4">
              {/* Environment Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Environment</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Railway Environment:</span>
                    <span className={diagnostics.environment.isRailway ? 'text-green-600' : 'text-gray-600'}>
                      {diagnostics.environment.isRailway ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ScraperAPI Key:</span>
                    <span className={diagnostics.environment.hasScraperKey ? 'text-green-600' : 'text-red-600'}>
                      {diagnostics.environment.hasScraperKey ? diagnostics.environment.scraperKeyPrefix : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>OpenAI Key:</span>
                    <span className={diagnostics.environment.hasOpenAIKey ? 'text-green-600' : 'text-red-600'}>
                      {diagnostics.environment.hasOpenAIKey ? diagnostics.environment.openAIKeyPrefix : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* API Tests Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">API Tests</h3>
                <div className="space-y-2">
                  {/* ScraperAPI Test */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">ScraperAPI</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(diagnostics.tests.scraperAPI?.success)}
                      <span className="text-sm">
                        {diagnostics.tests.scraperAPI?.success 
                          ? `Success (Status: ${diagnostics.tests.scraperAPI.status})`
                          : diagnostics.tests.scraperAPI?.error || 'Failed'}
                      </span>
                    </div>
                  </div>

                  {/* OpenAI Test */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">OpenAI API</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(diagnostics.tests.openAI?.success)}
                      <span className="text-sm">
                        {diagnostics.tests.openAI?.success 
                          ? `Success: "${diagnostics.tests.openAI.response}"`
                          : diagnostics.tests.openAI?.error || 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {(!diagnostics.environment.hasScraperKey || !diagnostics.environment.hasOpenAIKey || 
                !diagnostics.tests.scraperAPI?.success || !diagnostics.tests.openAI?.success) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {!diagnostics.environment.hasScraperKey && (
                        <li>Set SCRAPER_API_KEY in Railway environment variables</li>
                      )}
                      {!diagnostics.environment.hasOpenAIKey && (
                        <li>Set VITE_OPENAI_API_KEY in Railway environment variables</li>
                      )}
                      {diagnostics.environment.hasScraperKey && !diagnostics.tests.scraperAPI?.success && (
                        <li>Check ScraperAPI key validity and account status</li>
                      )}
                      {diagnostics.environment.hasOpenAIKey && !diagnostics.tests.openAI?.success && (
                        <li>Check OpenAI API key validity and permissions</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}