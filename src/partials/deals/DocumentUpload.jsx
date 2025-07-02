import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { filesAdapter } from '../../lib/database-adapter';

function DocumentUpload({ selectedDeal, dealId, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('financial_statements');
  const [selectedDealId, setSelectedDealId] = useState(dealId || 'deal-1');
  const [tags, setTags] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  
  const documentTypes = [
    { value: 'financial_statements', label: 'Financial Statements' },
    { value: 'tax_returns', label: 'Tax Returns' },
    { value: 'bank_statements', label: 'Bank Statements' },
    { value: 'product_info', label: 'Product Information' },
    { value: 'supplier_info', label: 'Supplier Information' },
    { value: 'legal_documents', label: 'Legal Documents' },
    { value: 'due_diligence', label: 'Due Diligence' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'other', label: 'Other' }
  ];

  // Load recent uploads for this deal
  useEffect(() => {
    if (dealId) {
      loadRecentUploads();
    }
  }, [dealId]);

  const loadRecentUploads = async () => {
    try {
      const files = await filesAdapter.fetchDealFiles(selectedDealId);
      // Sort by creation date and take the 3 most recent
      const sortedFiles = files
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      setRecentUploads(sortedFiles);
    } catch (error) {
      console.error('Error loading recent uploads:', error);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Please use PDF, DOC, XLS, PNG, or JPG files.`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 50MB limit.`);
    }
    
    return true;
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      const totalFiles = fileArray.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i];
        
        // Validate file
        validateFile(file);
        
        const metadata = {
          category: documentType,
          description: tags ? `Tags: ${tags}` : null,
          is_confidential: false
        };

        // Upload file using the database adapter
        await filesAdapter.uploadFile(selectedDealId, file, metadata);
        
        // Update progress
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);
      }
      
      // Success - reset form and reload recent uploads
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
        setTags('');
        loadRecentUploads(); // Refresh recent uploads
        if (onUploadSuccess) {
          onUploadSuccess(); // Notify parent component
        }
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setUploadProgress(null);
      setIsUploading(false);
    }
  };

  return (
    <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Upload Documents</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Drag & drop files or click to browse
        </p>
      </header>
      
      <div className="p-5">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
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
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
          
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drop files here or <span className="text-violet-500 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PDF, DOC, XLS, PNG, JPG up to 50MB
            </p>
          </div>
        </div>
        
        {/* Upload Progress */}
        {uploadProgress !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{isUploading ? 'Uploading...' : 'Upload Complete!'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
            </div>
          </div>
        )}
        
        {/* Document Type Selector */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Type
          </label>
          <select 
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            disabled={isUploading}
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        {/* Deal Assignment */}
        {selectedDeal === 'all' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign to Deal
            </label>
            <select 
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              disabled={isUploading}
            >
              <option value="deal-1">Kitchen Gadgets Pro</option>
              <option value="deal-2">SmartHome Essentials</option>
              <option value="deal-3">Pet Supplies Direct</option>
            </select>
          </div>
        )}
        
        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (optional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags separated by commas"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            disabled={isUploading}
          />
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 space-y-2">
          <button 
            onClick={() => document.querySelector('input[type="file"]').click()}
            disabled={isUploading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Select Files to Upload'}
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Or drag and drop files above
          </div>
        </div>
        
        {/* Recent Uploads */}
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Uploads</div>
          <div className="space-y-2">
            {recentUploads.length > 0 ? (
              recentUploads.map((file, index) => {
                const timeAgo = new Date(file.created_at) 
                  ? new Intl.RelativeTimeFormat('en').format(
                      Math.floor((new Date(file.created_at) - new Date()) / (1000 * 60 * 60)),
                      'hour'
                    )
                  : 'Recently';
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {file.file_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {timeAgo} • {file.category?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
                      uploaded
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent uploads
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;