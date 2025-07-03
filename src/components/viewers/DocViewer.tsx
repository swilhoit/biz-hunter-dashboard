import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { Loader2, AlertCircle, Search, ZoomIn, ZoomOut } from 'lucide-react';

interface DocViewerProps {
  blob: Blob;
}

export default function DocViewer({ blob }: DocViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);

  useEffect(() => {
    loadDocument();
  }, [blob]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await blob.arrayBuffer();
      
      // Use mammoth to extract text and basic formatting from DOCX
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('Document conversion warnings:', result.messages);
      }
      
      setContent(result.value);
    } catch (err: any) {
      console.error('Error loading document:', err);
      
      // Fallback: try to read as plain text
      try {
        const text = await blob.text();
        setContent(`<pre>${text}</pre>`);
      } catch (textErr) {
        setError('Failed to load document. The file might be corrupted or in an unsupported format.');
      }
    } finally {
      setLoading(false);
    }
  };

  const highlightSearchTerm = (html: string, term: string): string => {
    if (!term.trim()) return html;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return html.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(10, Math.min(24, fontSize + delta));
    setFontSize(newSize);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
        <span className="text-gray-600 dark:text-gray-400">Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertCircle className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Failed to load document</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <button
          onClick={loadDocument}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const displayContent = highlightSearchTerm(content, searchTerm);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Document Viewer
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Font size controls */}
          <div className="flex items-center space-x-1 border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => changeFontSize(-2)}
              disabled={fontSize <= 10}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-x border-gray-300 dark:border-gray-600 min-w-[50px] text-center">
              {fontSize}px
            </span>
            
            <button
              onClick={() => changeFontSize(2)}
              disabled={fontSize >= 24}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-8">
          <div
            className="prose prose-gray dark:prose-invert max-w-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>
      </div>
      
      {/* Search results info */}
      {searchTerm.trim() && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {displayContent.includes('<mark') 
              ? `Search results highlighted for "${searchTerm}"`
              : `No matches found for "${searchTerm}"`
            }
          </p>
        </div>
      )}
    </div>
  );
}