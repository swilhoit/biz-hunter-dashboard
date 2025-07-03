import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, AlertCircle, FileText, Table, Image } from 'lucide-react';
import { filesAdapter } from '../lib/database-adapter';
import PDFViewer from './viewers/PDFViewer';
import CSVExcelViewer from './viewers/CSVExcelViewer';
import DocViewer from './viewers/DocViewer';
import ImageViewer from './viewers/ImageViewer';

interface FileViewerModalProps {
  fileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FileData {
  blob: Blob;
  fileName: string;
  fileType: string;
}

export default function FileViewerModal({ fileId, fileName, isOpen, onClose }: FileViewerModalProps) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileId) {
      loadFile();
    }
    return () => {
      // Cleanup object URL
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [isOpen, fileId]);

  const loadFile = async () => {
    setLoading(true);
    setError(null);
    setFileData(null);

    try {
      const data = await filesAdapter.getFileBlob(fileId);
      setFileData(data);
      
      // Create download URL
      const url = URL.createObjectURL(data.blob);
      setDownloadUrl(url);
    } catch (err: any) {
      console.error('Error loading file:', err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl && fileData) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'csv':
      case 'xls':
      case 'xlsx':
        return <Table className="w-5 h-5 text-green-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderFileViewer = () => {
    if (!fileData) return null;

    const extension = getFileExtension(fileData.fileName);
    
    switch (extension) {
      case 'pdf':
        return <PDFViewer blob={fileData.blob} />;
      case 'csv':
      case 'xls':
      case 'xlsx':
        return <CSVExcelViewer blob={fileData.blob} fileName={fileData.fileName} />;
      case 'doc':
      case 'docx':
        return <DocViewer blob={fileData.blob} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <ImageViewer blob={fileData.blob} fileName={fileData.fileName} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Preview not available</p>
            <p className="text-sm">Use the download button to view this file</p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {getFileIcon(fileName)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {fileName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                File Viewer
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {downloadUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading file...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Failed to load file</p>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
              <button
                onClick={loadFile}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && fileData && (
            <div className="h-full overflow-auto">
              {renderFileViewer()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}