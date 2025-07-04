import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload, Folder, Calendar, User, Trash2, Brain, Loader2 } from 'lucide-react';
import { filesAdapter } from '../../lib/database-adapter';
import FileViewerModal from '../../components/FileViewerModal';
import StorageTest from '../../components/StorageTest';
import { AIAnalysisService } from '../../services/AIAnalysisService';
import { useToast } from '../../contexts/ToastContext';

interface DealFilesProps {
  dealId: string;
}

function DealFiles({ dealId }: DealFilesProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const { showToast } = useToast();

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [dealId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const dealFiles = await filesAdapter.fetchDealFiles(dealId);
      setFiles(dealFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock file data - fallback for when no real files exist
  const mockFiles = [
    {
      id: '1',
      name: 'Financial_Statements_2023.pdf',
      category: 'financial_statements',
      size: '2.4 MB',
      uploaded_date: '2024-02-01',
      uploaded_by: 'John Smith',
      is_confidential: true,
    },
    {
      id: '2',
      name: 'Tax_Returns_2022_2023.pdf',
      category: 'tax_returns',
      size: '1.8 MB',
      uploaded_date: '2024-02-01',
      uploaded_by: 'John Smith',
      is_confidential: true,
    },
    {
      id: '3',
      name: 'Product_Catalog_Updated.xlsx',
      category: 'product_info',
      size: '856 KB',
      uploaded_date: '2024-02-03',
      uploaded_by: 'Sarah Johnson',
      is_confidential: false,
    },
    {
      id: '4',
      name: 'Amazon_Business_Report_Jan2024.pdf',
      category: 'analytics',
      size: '3.2 MB',
      uploaded_date: '2024-02-05',
      uploaded_by: 'Sarah Johnson',
      is_confidential: false,
    },
    {
      id: '5',
      name: 'Due_Diligence_Checklist.docx',
      category: 'due_diligence',
      size: '124 KB',
      uploaded_date: '2024-02-10',
      uploaded_by: 'Current User',
      is_confidential: false,
    },
  ];

  const fileCategories = [
    { id: 'financial_statements', name: 'Financial Statements', icon: '💰' },
    { id: 'tax_returns', name: 'Tax Returns', icon: '📊' },
    { id: 'bank_statements', name: 'Bank Statements', icon: '🏦' },
    { id: 'product_info', name: 'Product Information', icon: '📦' },
    { id: 'supplier_info', name: 'Supplier Information', icon: '🏭' },
    { id: 'legal_documents', name: 'Legal Documents', icon: '⚖️' },
    { id: 'due_diligence', name: 'Due Diligence', icon: '🔍' },
    { id: 'contracts', name: 'Contracts', icon: '📋' },
    { id: 'correspondence', name: 'Correspondence', icon: '💬' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'other', name: 'Other', icon: '📁' },
  ];

  const getFileIcon = (fileName: string | undefined) => {
    if (!fileName || typeof fileName !== 'string') {
      return '📄'; // Default icon for unknown files
    }
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'xlsx': case 'xls': return '📊';
      case 'docx': case 'doc': return '📝';
      case 'png': case 'jpg': case 'jpeg': return '🖼️';
      default: return '📄';
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = fileCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Other';
  };

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(fileList);
      const totalFiles = fileArray.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];
        
        const metadata = {
          category: 'other', // Default category, could be made selectable
          description: null,
          is_confidential: false
        };

        await filesAdapter.uploadFile(dealId, file, metadata);
        
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);
      }
      
      // Success - reload files
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
        loadFiles(); // Refresh file list
      }, 1000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setUploadProgress(null);
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingFileId(fileId);
    try {
      console.log('Attempting to delete file:', { fileId, fileName });
      
      const result = await filesAdapter.deleteFile(fileId);
      console.log('Delete result:', result);
      
      // Refresh the file list
      await loadFiles();
      
      // Show success message
      alert(`Successfully deleted "${fileName}"`);
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to delete file';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      
      alert(errorMessage);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleViewFile = (fileId: string, fileName: string) => {
    setSelectedFileId(fileId);
    setSelectedFileName(fileName);
    setViewerOpen(true);
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const { url } = await filesAdapter.getFileUrl(fileId);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const handleAnalyzeAllDocuments = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress('Starting AI analysis of all documents...');
      
      // Get deal data from database
      const { dealsAdapter } = await import('../../lib/database-adapter');
      const dealData = await dealsAdapter.fetchDealById(dealId);
      
      if (!dealData) {
        throw new Error('Deal not found');
      }

      // Create AIAnalysisService instance
      const aiService = new AIAnalysisService();
      
      // Run the analysis with progress callback
      const analysis = await aiService.generateDealAnalysis(
        dealData,
        (stage: string) => setAnalysisProgress(stage)
      );

      // Navigate to the Analysis tab with the results
      showToast('Analysis complete! Check the Analysis tab for results.', 'success');
      
      // Trigger a navigation to the Analysis tab
      // Since we're in a partial component, we'll dispatch a custom event
      window.dispatchEvent(new CustomEvent('navigate-to-analysis', { 
        detail: { dealId, analysis } 
      }));
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      showToast(`Analysis failed: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const displayFiles = files.length > 0 ? files : mockFiles;

  return (
    <div className="space-y-6">
      {/* Storage Diagnostics - Temporary */}
      <StorageTest />
      
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Document Repository</h3>
          <div className="flex space-x-2">
            {files.length > 0 && (
              <button 
                onClick={handleAnalyzeAllDocuments}
                disabled={isAnalyzing || isUploading}
                className="btn bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Brain className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
              </button>
            )}
            <button 
              onClick={() => document.querySelector('input[type="file"]')?.click()}
              disabled={isUploading}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
        
        <div 
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
          />
          
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {isUploading ? 'Uploading files...' : 'Drag and drop files here, or click to browse'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports PDF, Word (.docx), Excel (.xlsx/.xls), CSV, Text (.txt), and Images (PNG/JPG) • Max 50MB
          </p>
          
          {uploadProgress !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>{isUploading ? 'Uploading...' : 'Upload Complete!'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
            </div>
          )}
        </div>

        {/* AI Analysis Progress */}
        {isAnalyzing && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 mr-3 text-purple-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">AI Document Analysis in Progress</p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">{analysisProgress}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All Files */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading files...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Folder className="w-6 h-6 mr-3 text-gray-500" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                All Files
              </h4>
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {displayFiles.length}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {displayFiles.length > 0 ? (
              <div className="space-y-3">
                {displayFiles.map(file => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="text-2xl mr-3">{getFileIcon(file.file_name || file.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {file.file_name || file.name || 'Unknown File'}
                          </p>
                          {file.is_confidential && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                              Confidential
                            </span>
                          )}
                          {file.category && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              {getCategoryName(file.category)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            {file.uploaded_at || file.uploaded_date 
                              ? new Date(file.uploaded_at || file.uploaded_date).toLocaleDateString()
                              : 'Unknown date'
                            }
                          </span>
                          <span className="mx-2">•</span>
                          <User className="w-3 h-3 mr-1" />
                          <span>{file.uploaded_by || 'Unknown user'}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {file.file_size 
                              ? `${Math.round(file.file_size / 1024 / 1024 * 100) / 100} MB`
                              : file.size || 'Unknown size'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => handleViewFile(file.id, file.file_name || file.name || 'Unknown File')}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadFile(file.id, file.file_name || file.name || 'Unknown File')}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteFile(file.id, file.file_name || file.name || 'Unknown File')}
                        disabled={deletingFileId === file.id}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Delete file"
                      >
                        {deletingFileId === file.id ? (
                          <div className="w-4 h-4 animate-spin border-2 border-red-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No files uploaded yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Use the upload area above to add files
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">File Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayFiles.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {displayFiles.filter(f => f.is_confidential).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Confidential</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(displayFiles.reduce((sum, f) => sum + (parseFloat(f.size) || 0), 0) * 100) / 100} MB
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {new Set(displayFiles.map(f => f.uploaded_by)).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contributors</div>
          </div>
        </div>
      </div>
      
      {/* File Viewer Modal */}
      {selectedFileId && (
        <FileViewerModal
          fileId={selectedFileId}
          fileName={selectedFileName}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedFileId(null);
            setSelectedFileName('');
          }}
        />
      )}
    </div>
  );
}

export default DealFiles;