import React from 'react';
import { FileText, Download, Eye, Upload, Folder, Calendar, User } from 'lucide-react';

interface DealFilesProps {
  dealId: string;
}

function DealFiles({ dealId }: DealFilesProps) {
  // Mock file data - in real app this would come from API
  const files = [
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

  const getFileIcon = (fileName: string) => {
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

  const groupedFiles = fileCategories.reduce((acc, category) => {
    acc[category.id] = files.filter(file => file.category === category.id);
    return acc;
  }, {} as Record<string, typeof files>);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Document Repository</h3>
          <button className="btn bg-indigo-600 text-white hover:bg-indigo-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </button>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports PDF, Excel, Word, and image files (Max 10MB)
          </p>
          <button className="mt-4 btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
            Choose Files
          </button>
        </div>
      </div>

      {/* Files by Category */}
      <div className="space-y-4">
        {fileCategories.map(category => {
          const categoryFiles = groupedFiles[category.id];
          if (!categoryFiles || categoryFiles.length === 0) return null;

          return (
            <div 
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {category.name}
                  </h4>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    {categoryFiles.length}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {categoryFiles.map(file => (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <span className="text-2xl mr-3">{getFileIcon(file.name)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            {file.is_confidential && (
                              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                                Confidential
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{new Date(file.uploaded_date).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <User className="w-3 h-3 mr-1" />
                            <span>{file.uploaded_by}</span>
                            <span className="mx-2">•</span>
                            <span>{file.size}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* File Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">File Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{files.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {files.filter(f => f.is_confidential).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Confidential</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(files.reduce((sum, f) => sum + parseFloat(f.size), 0) * 100) / 100} MB
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {new Set(files.map(f => f.uploaded_by)).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contributors</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealFiles;