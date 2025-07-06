import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload, Folder, Calendar, User, Trash2, Brain, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { filesAdapter, dealsAdapter } from '../../lib/database-adapter';
import FileViewerModal from '../../components/FileViewerModal';
import { AIAnalysisService, DocumentAnalysisService } from '../../services/AIAnalysisService';
import { DocumentIntelligenceService } from '../../services/DocumentIntelligenceService';
import { FinancialDocumentService } from '../../services/FinancialDocumentService';
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
  const [autoFillResults, setAutoFillResults] = useState<any>(null);
  const [showAutoFillSummary, setShowAutoFillSummary] = useState(false);
  const { showToast } = useToast();

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [dealId]);

  // Helper function to apply analysis results to deal form
  const applyAnalysisToForm = async (analysis: any) => {
    try {
      // Get current deal data
      const currentDeal = await dealsAdapter.fetchDealById(dealId);
      if (!currentDeal) return null;

      const updates: any = {};
      let fieldsUpdated: string[] = [];

      // Basic Information - only update if empty or minimal data
      if (analysis.businessName && (!currentDeal.business_name || currentDeal.business_name.length < 3)) {
        updates.business_name = analysis.businessName;
        fieldsUpdated.push('Business Name');
      }
      if (analysis.description && (!currentDeal.description || currentDeal.description.length < 10)) {
        updates.description = analysis.description;
        fieldsUpdated.push('Description');
      }
      
      // Financial Information - only update if zero or empty
      if (analysis.askingPrice && (!currentDeal.asking_price || currentDeal.asking_price === 0)) {
        updates.asking_price = analysis.askingPrice;
        fieldsUpdated.push('Asking Price');
      }
      if (analysis.annualRevenue && (!currentDeal.annual_revenue || currentDeal.annual_revenue === 0)) {
        updates.annual_revenue = analysis.annualRevenue;
        fieldsUpdated.push('Annual Revenue');
      }
      if (analysis.annualProfit && (!currentDeal.annual_profit || currentDeal.annual_profit === 0)) {
        updates.annual_profit = analysis.annualProfit;
        fieldsUpdated.push('Annual Profit');
      }
      if (analysis.monthlyRevenue && (!currentDeal.monthly_revenue || currentDeal.monthly_revenue === 0)) {
        updates.monthly_revenue = analysis.monthlyRevenue;
        fieldsUpdated.push('Monthly Revenue');
      }
      if (analysis.monthlyProfit && (!currentDeal.monthly_profit || currentDeal.monthly_profit === 0)) {
        updates.monthly_profit = analysis.monthlyProfit;
        fieldsUpdated.push('Monthly Profit');
      }
      if (analysis.valuationMultiple && (!currentDeal.valuation_multiple || currentDeal.valuation_multiple === 0)) {
        updates.valuation_multiple = analysis.valuationMultiple;
        fieldsUpdated.push('Valuation Multiple');
      }

      // Business Details
      if (analysis.businessAge && (!currentDeal.business_age || currentDeal.business_age === 0)) {
        updates.business_age = analysis.businessAge;
        fieldsUpdated.push('Business Age');
      }
      if (analysis.industry && (!currentDeal.industry || currentDeal.industry === 'Unknown')) {
        updates.industry = analysis.industry;
        fieldsUpdated.push('Industry');
      }
      if (analysis.location && (!currentDeal.seller_location)) {
        updates.seller_location = analysis.location;
        fieldsUpdated.push('Location');
      }

      // Amazon-specific data
      if (analysis.amazonCategory && (!currentDeal.amazon_category)) {
        updates.amazon_category = analysis.amazonCategory;
        fieldsUpdated.push('Amazon Category');
      }
      if (analysis.amazonStoreUrl && (!currentDeal.amazon_store_url)) {
        updates.amazon_store_url = analysis.amazonStoreUrl;
        fieldsUpdated.push('Amazon Store URL');
      }
      if (analysis.fbaPercentage && (!currentDeal.fba_percentage || currentDeal.fba_percentage === 0)) {
        updates.fba_percentage = analysis.fbaPercentage;
        fieldsUpdated.push('FBA Percentage');
      }

      // Contact information
      if (analysis.sellerName && (!currentDeal.seller_name || currentDeal.seller_name === 'Unknown')) {
        updates.seller_name = analysis.sellerName;
        fieldsUpdated.push('Seller Name');
      }
      if (analysis.sellerEmail && (!currentDeal.seller_email)) {
        updates.seller_email = analysis.sellerEmail;
        fieldsUpdated.push('Seller Email');
      }
      if (analysis.brokerName && (!currentDeal.broker_name)) {
        updates.broker_name = analysis.brokerName;
        fieldsUpdated.push('Broker Name');
      }

      // Apply updates if any fields were found
      if (Object.keys(updates).length > 0) {
        await dealsAdapter.updateDeal(dealId, updates);
        return {
          fieldsUpdated,
          updates,
          totalFields: Object.keys(updates).length
        };
      }

      return null;
    } catch (error) {
      console.error('Error applying analysis to form:', error);
      return null;
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      console.log('Loading files for deal:', dealId);
      const dealFiles = await filesAdapter.fetchDealFiles(dealId);
      console.log('Loaded files:', dealFiles);
      setFiles(dealFiles || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };


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
    setAutoFillResults(null);

    try {
      const fileArray = Array.from(fileList);
      const totalFiles = fileArray.length;
      
      // Step 1: Upload files
      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];
        
        const metadata = {
          category: 'other', // Default category, could be made selectable
          description: null,
          is_confidential: false
        };

        await filesAdapter.uploadFile(dealId, file, metadata);
        
        const progress = Math.round(((i + 1) / totalFiles) * 50); // First 50% for upload
        setUploadProgress(progress);
      }
      
      // Step 2: Analyze uploaded files for auto-fill
      setIsAnalyzing(true);
      setAnalysisProgress('Starting document analysis...');
      setUploadProgress(60);
      
      let allAutoFillResults: any[] = [];
      let totalFieldsUpdated = 0;
      let allUpdatedFields: string[] = [];
      
      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];
        
        try {
          setAnalysisProgress(`Analyzing ${file.name}...`);
          
          // Check if file type is supported for analysis
          const supportedTypes = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', '.csv', '.png', '.jpg', '.jpeg'];
          const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
          
          if (supportedTypes.includes(fileExtension)) {
            const analysis = await DocumentAnalysisService.analyzeDocument(
              file,
              (progress: string) => {
                setAnalysisProgress(`${file.name}: ${progress}`);
              }
            );
            
            if (analysis) {
              // Apply analysis to deal form
              const autoFillResult = await applyAnalysisToForm(analysis);
              
              if (autoFillResult) {
                allAutoFillResults.push({
                  fileName: file.name,
                  ...autoFillResult
                });
                totalFieldsUpdated += autoFillResult.totalFields;
                allUpdatedFields.push(...autoFillResult.fieldsUpdated);
              }
            }
          } else {
            console.log(`Skipping analysis for unsupported file type: ${file.name}`);
          }
          
          const progress = 60 + Math.round(((i + 1) / totalFiles) * 35); // 60-95% for analysis
          setUploadProgress(progress);
          
        } catch (analysisError) {
          console.error(`Analysis error for ${file.name}:`, analysisError);
          
          // Provide user-friendly error feedback
          const errorType = analysisError.message?.includes('vision') || analysisError.message?.includes('MIME type') 
            ? 'AI_VISION_ERROR'
            : analysisError.message?.includes('PDF')
            ? 'PDF_PROCESSING_ERROR' 
            : 'ANALYSIS_ERROR';
            
          switch (errorType) {
            case 'AI_VISION_ERROR':
              console.log(`⚠️ AI analysis unavailable for ${file.name} (vision API issue) - document saved successfully`);
              break;
            case 'PDF_PROCESSING_ERROR':
              console.log(`⚠️ PDF text extraction failed for ${file.name} - document saved successfully, analysis skipped`);
              break;
            default:
              console.log(`⚠️ AI analysis failed for ${file.name} - document saved successfully, analysis skipped`);
          }
          
          // Still count this as a processed file, just with no auto-fill results
          // This ensures the document is saved even though analysis failed
        }
      }
      
      // Step 3: Show results and cleanup
      setUploadProgress(100);
      
      // Always refresh files first
      await loadFiles();
      
      // Show results summary
      if (allAutoFillResults.length > 0) {
        setAutoFillResults({
          files: allAutoFillResults,
          totalFieldsUpdated,
          uniqueFields: [...new Set(allUpdatedFields)]
        });
        setShowAutoFillSummary(true);
        
        showToast(
          `Success! Uploaded ${totalFiles} file(s) and auto-filled ${totalFieldsUpdated} field(s)`,
          'success'
        );
      } else {
        const analysisFailedCount = totalFiles - allAutoFillResults.length;
        if (analysisFailedCount > 0) {
          showToast(
            `Uploaded ${totalFiles} file(s) successfully! (AI analysis failed for ${analysisFailedCount} file(s) but documents were saved)`,
            'success'
          );
        } else {
          showToast(`Uploaded ${totalFiles} file(s) successfully`, 'success');
        }
      }
      
      // Cleanup UI state
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
        setIsAnalyzing(false);
        setAnalysisProgress('');
        
        // Dispatch event to refresh deal data in parent component
        window.dispatchEvent(new CustomEvent('deal-updated', { detail: { dealId } }));
      }, 1500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setUploadProgress(null);
      setIsUploading(false);
      setIsAnalyzing(false);
      setAnalysisProgress('');
      showToast(`Upload failed: ${error.message}`, 'error');
      
      // Still try to refresh files in case some uploaded successfully
      loadFiles();
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
      // Use server endpoint for download
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/files/download/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      showToast(`Failed to download file: ${error.message}`, 'error');
    }
  };

  const handleAnalyzeAllDocuments = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress('Starting document intelligence extraction...');
      
      // Create Document Intelligence Service
      const docIntelligence = new DocumentIntelligenceService();
      
      // Process each document with intelligence extraction
      const totalFiles = files.length;
      let processedCount = 0;
      
      for (const file of files) {
        processedCount++;
        setAnalysisProgress(`Processing document ${processedCount}/${totalFiles}: ${file.file_name}...`);
        
        try {
          await docIntelligence.processDocument(
            file.id,
            dealId,
            (stage: string) => setAnalysisProgress(`[${processedCount}/${totalFiles}] ${stage}`)
          );
        } catch (error) {
          console.error(`Failed to process ${file.file_name}:`, error);
          // Continue with other documents
        }
      }
      
      // Now run comprehensive analysis using cached extractions
      setAnalysisProgress('Running comprehensive AI analysis...');
      
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
      showToast('Document intelligence extraction and analysis complete!', 'success');
      
      // Trigger a navigation to the Analysis tab
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

  const displayFiles = files;

  return (
    <div className="space-y-6">
      
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
                        onClick={async () => {
                          const docIntelligence = new DocumentIntelligenceService();
                          try {
                            showToast(`Extracting intelligence from ${file.file_name}...`, 'info');
                            await docIntelligence.processDocument(file.id, dealId);
                            showToast(`Successfully extracted insights from ${file.file_name}`, 'success');
                          } catch (error: any) {
                            showToast(`Failed to extract from ${file.file_name}: ${error.message}`, 'error');
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        title="Extract Intelligence"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      {(file.category === 'financial_statements' || 
                        file.category === 'tax_returns' || 
                        file.category === 'bank_statements' ||
                        file.file_name?.toLowerCase().includes('financ') ||
                        file.file_name?.toLowerCase().includes('p&l') ||
                        file.file_name?.toLowerCase().includes('profit')) && (
                        <button
                          onClick={async () => {
                            const financialService = new FinancialDocumentService();
                            try {
                              setAnalysisProgress(`Processing financial document: ${file.file_name}...`);
                              setIsAnalyzing(true);
                              
                              const extraction = await financialService.processFinancialDocument(
                                file.id,
                                dealId,
                                (stage: string) => setAnalysisProgress(stage)
                              );
                              
                              showToast(`Financial data extracted from ${file.file_name}!`, 'success');
                              
                              // Navigate to finance tab with the extraction
                              window.dispatchEvent(new CustomEvent('navigate-to-finance', { 
                                detail: { dealId, extraction } 
                              }));
                              
                            } catch (error: any) {
                              showToast(`Failed to extract financials: ${error.message}`, 'error');
                            } finally {
                              setIsAnalyzing(false);
                              setAnalysisProgress('');
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Extract Financial Data"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
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
      
      {/* Auto-Fill Summary Modal */}
      {showAutoFillSummary && autoFillResults && autoFillResults.files && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Auto-Fill Complete!
                  </h3>
                </div>
                <button
                  onClick={() => setShowAutoFillSummary(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  Successfully analyzed {autoFillResults.files?.length || 0} document(s) and auto-filled {autoFillResults.totalFieldsUpdated || 0} field(s)
                </p>
              </div>
              
              <div className="space-y-4">
                {autoFillResults.uniqueFields && autoFillResults.uniqueFields.length > 0 && (
                  <>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Updated Fields:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {autoFillResults.uniqueFields.map((field: string, index: number) => (
                        <div key={index} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{field}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {autoFillResults.files && autoFillResults.files.length > 0 && (
                  <>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">Files Analyzed:</h4>
                    <div className="space-y-2">
                      {autoFillResults.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.fileName || 'Unknown file'}</span>
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                            <span className="text-sm text-green-600">{file.totalFields || 0} fields</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAutoFillSummary(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowAutoFillSummary(false);
                    // Navigate to deal overview to see updated fields
                    window.dispatchEvent(new CustomEvent('navigate-to-overview', { detail: { dealId } }));
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  View Updated Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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