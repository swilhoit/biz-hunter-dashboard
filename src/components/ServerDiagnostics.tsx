import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ServerStatus {
  success: boolean;
  serverStatus: string;
  timestamp: string;
  environment: string;
  port: string;
  environmentVariables: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    SCRAPER_API_KEY: string;
    OPENAI_API_KEY: string;
    NODE_ENV: string;
    PORT: string;
  };
  services: {
    supabase: string;
    scraperApi: string;
    openAi: string;
  };
  error?: string;
}

export default function ServerDiagnostics() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/server-status');
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
  }, []);

  const getStatusIcon = (statusText: string) => {
    if (statusText.includes('✅')) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (statusText.includes('❌')) return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Server Diagnostics</h1>
          </div>
          <button
            onClick={fetchServerStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">
                <strong>Connection Error:</strong> {error}
              </p>
            </div>
            <p className="text-sm text-red-600 mt-2">
              Make sure the backend server is running on port 3001
            </p>
          </div>
        )}

        {status && (
          <div className="space-y-6">
            {/* Server Status */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3">Server Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.serverStatus)}
                    <span>{status.serverStatus}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-mono text-sm">{status.environment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Port:</span>
                  <span className="font-mono text-sm">{status.port}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Check:</span>
                  <span className="text-sm">{new Date(status.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
              <div className="space-y-2">
                {Object.entries(status.environmentVariables).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{key}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(value)}
                      <span className="text-sm">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h2 className="text-lg font-semibold mb-3">External Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Supabase</span>
                    {getStatusIcon(status.services.supabase)}
                  </div>
                  <p className="text-sm text-gray-600">{status.services.supabase}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">ScraperAPI</span>
                    {getStatusIcon(status.services.scraperApi)}
                  </div>
                  <p className="text-sm text-gray-600">{status.services.scraperApi}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">OpenAI</span>
                    {getStatusIcon(status.services.openAi)}
                  </div>
                  <p className="text-sm text-gray-600">{status.services.openAi}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && !error && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}