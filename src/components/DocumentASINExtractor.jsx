import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Label, Badge, Alert, AlertDescription } from './SimpleCard';
import { Loader2, FileText, Search, Copy, CheckCircle } from 'lucide-react';
import AmazonAnalyticsService from '../services/AmazonAnalyticsService';

const DocumentASINExtractor = ({ onASINsExtracted }) => {
  const [loading, setLoading] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [extractedASINs, setExtractedASINs] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [analyticsService] = useState(() => new AmazonAnalyticsService());

  const handleExtractASINs = async () => {
    if (!documentText.trim()) {
      setError('Please enter document text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const asins = await analyticsService.extractASINsFromDocuments(documentText);
      
      if (asins.length === 0) {
        setError('No ASINs found in the document. Please check that the text contains Amazon product ASINs.');
        return;
      }

      setExtractedASINs(asins);
      
      // Call the callback if provided
      if (onASINsExtracted) {
        onASINsExtracted(asins);
      }
    } catch (err) {
      console.error('Error extracting ASINs:', err);
      setError(err.message || 'Failed to extract ASINs from document');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyASINs = async () => {
    const asinText = extractedASINs.join(', ');
    try {
      await navigator.clipboard.writeText(asinText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy ASINs:', err);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Document ASIN Extractor</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Extract Amazon ASINs from business documents, CIMs, or any text using AI
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Option */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload Document (Optional)</Label>
          <input
            id="file-upload"
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500">
            Supported formats: TXT files. For PDF/DOC files, copy and paste the text below.
          </p>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="document-text">Document Text</Label>
          <textarea
            id="document-text"
            placeholder="Paste your business overview, CIM, product list, or any document text containing ASINs here..."
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">
            The AI will automatically identify and extract Amazon ASINs from the text
          </p>
        </div>

        {/* Extract Button */}
        <Button 
          onClick={handleExtractASINs} 
          disabled={loading || !documentText.trim()} 
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Extracting ASINs...' : 'Extract ASINs'}
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Extracted ASINs Display */}
        {extractedASINs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Extracted ASINs ({extractedASINs.length})</h4>
              <Button
                onClick={handleCopyASINs}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {copied ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-wrap gap-2">
                {extractedASINs.map((asin, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    {asin}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• Copy these ASINs to use in the Amazon Portfolio Analyzer</p>
              <p>• Each ASIN is a unique 10-character Amazon product identifier</p>
              <p>• Use these ASINs to analyze the seller's product portfolio</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {extractedASINs.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  const asinText = extractedASINs.join(', ');
                  window.open(`/deals/amazon-portfolio?asins=${encodeURIComponent(asinText)}`, '_blank');
                }}
                className="flex-1"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Analyze Portfolio
              </Button>
              <Button
                onClick={() => setExtractedASINs([])}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentASINExtractor;