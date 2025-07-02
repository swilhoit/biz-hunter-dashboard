import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import {
  Folder,
  File,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Tag,
  Calendar,
  User,
  FileText,
  Image,
  FileSpreadsheet,
  Archive,
  AlertTriangle,
  Clock,
  Lock,
  Share,
  Plus,
  Grid3X3,
  List,
  MoreVertical,
  FolderOpen
} from 'lucide-react';

interface Document {
  id: string;
  deal_id: string;
  category: string;
  subcategory: string;
  document_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  year?: number;
  month?: number;
  uploaded_by: string;
  uploaded_at: string;
  tags: string[];
  is_confidential: boolean;
  expiry_date?: string;
  metadata: any;
}

interface DealDocumentRepositoryProps {
  dealId: string;
  dealName: string;
}

const DOCUMENT_CATEGORIES = [
  {
    id: 'financials',
    name: 'Financials',
    icon: FileSpreadsheet,
    color: 'text-green-600',
    subcategories: ['P&L', 'Balance Sheet', 'Cash Flow', 'Tax Returns', 'Bank Statements', 'Projections']
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: FileText,
    color: 'text-blue-600',
    subcategories: ['Contracts', 'Leases', 'NDAs', 'Purchase Agreement', 'Due Diligence', 'Compliance']
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Folder,
    color: 'text-purple-600',
    subcategories: ['Processes', 'Org Chart', 'Employee Records', 'Systems', 'Inventory', 'Suppliers']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: Image,
    color: 'text-pink-600',
    subcategories: ['Brand Assets', 'Website', 'Analytics', 'Customer Data', 'Marketing Materials', 'SEO']
  },
  {
    id: 'correspondence',
    name: 'Correspondence',
    icon: File,
    color: 'text-orange-600',
    subcategories: ['Emails', 'Letters', 'Meeting Notes', 'Call Logs', 'LOI', 'Negotiations']
  }
];

const VALID_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv'
];

export default function DealDocumentRepository({ dealId, dealName }: DealDocumentRepositoryProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [dealId, selectedCategory, searchTerm]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId)
        .order('uploaded_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.ilike('document_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    for (const file of acceptedFiles) {
      if (!VALID_FILE_TYPES.includes(file.type)) {
        alert(`File type ${file.type} is not supported`);
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${dealId}/${Date.now()}_${file.name}`;
        const filePath = `${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('deal-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: insertError } = await supabase
          .from('deal_documents')
          .insert({
            deal_id: dealId,
            category: 'uncategorized',
            subcategory: '',
            document_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user?.id,
            tags: [],
            is_confidential: true,
            metadata: {
              original_name: file.name,
              upload_source: 'drag_drop'
            }
          });

        if (insertError) throw insertError;

      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    fetchDocuments();
  }, [dealId, user?.id, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.document_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const previewDocument = async (document: Document) => {
    if (document.file_type.startsWith('image/')) {
      try {
        const { data } = await supabase.storage
          .from('deal-documents')
          .getPublicUrl(document.file_path);
        
        setDocumentPreview(data.publicUrl);
        setSelectedDocument(document);
      } catch (error) {
        console.error('Error getting preview:', error);
      }
    }
  };

  const deleteDocument = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.document_name}"?`)) {
      return;
    }

    try {
      // Delete from storage
      await supabase.storage
        .from('deal-documents')
        .remove([document.file_path]);

      // Delete from database
      const { error } = await supabase
        .from('deal_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const updateDocumentCategory = async (documentId: string, category: string, subcategory: string) => {
    try {
      const { error } = await supabase
        .from('deal_documents')
        .update({ category, subcategory })
        .eq('id', documentId);

      if (error) throw error;
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document category:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const categorizedDocuments = DOCUMENT_CATEGORIES.map(category => ({
    ...category,
    documents: documents.filter(doc => doc.category === category.id)
  }));

  const uncategorizedDocuments = documents.filter(doc => !DOCUMENT_CATEGORIES.some(cat => cat.id === doc.category));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Document Repository</h2>
            <p className="text-gray-600">{dealName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {DOCUMENT_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        {...getRootProps()}
        className={`m-6 p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {uploading ? (
          <div className="text-blue-600">Uploading files...</div>
        ) : isDragActive ? (
          <div className="text-blue-600">Drop files here to upload</div>
        ) : (
          <div>
            <div className="text-gray-600 mb-2">Drag & drop files here, or click to select</div>
            <div className="text-sm text-gray-500">
              Supports PDF, Word, Excel, Images, Text files (max 50MB)
            </div>
          </div>
        )}
      </div>

      {/* Document Categories */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedCategory === 'all' ? (
          <div className="space-y-8">
            {/* Uncategorized Documents */}
            {uncategorizedDocuments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-medium text-yellow-800">Uncategorized</h3>
                  <span className="text-sm text-gray-500">({uncategorizedDocuments.length})</span>
                </div>
                <DocumentGrid documents={uncategorizedDocuments} viewMode={viewMode} />
              </div>
            )}

            {/* Categorized Documents */}
            {categorizedDocuments.map(category => (
              category.documents.length > 0 && (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <category.icon className={`w-5 h-5 ${category.color}`} />
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    <span className="text-sm text-gray-500">({category.documents.length})</span>
                  </div>
                  <DocumentGrid documents={category.documents} viewMode={viewMode} />
                </div>
              )
            ))}
          </div>
        ) : (
          <DocumentGrid documents={documents} viewMode={viewMode} />
        )}
      </div>

      {/* Document Actions Modal */}
      {selectedDocument && (
        <DocumentActionsModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDownload={() => downloadDocument(selectedDocument)}
          onDelete={() => deleteDocument(selectedDocument)}
          onUpdateCategory={updateDocumentCategory}
        />
      )}
    </div>
  );
}

function DocumentGrid({ 
  documents, 
  viewMode 
}: { 
  documents: Document[]; 
  viewMode: 'grid' | 'list';
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No documents found</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map(document => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map(document => (
        <DocumentListItem key={document.id} document={document} />
      ))}
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  const FileIcon = getFileIcon(document.file_type);
  
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <FileIcon className="w-8 h-8 text-blue-600" />
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {document.document_name}
      </h4>
      
      <div className="space-y-1 text-sm text-gray-500">
        <div>{formatFileSize(document.file_size)}</div>
        <div>{format(new Date(document.uploaded_at), 'MMM d, yyyy')}</div>
        {document.category && (
          <div className="capitalize">{document.category}</div>
        )}
      </div>
      
      {document.is_confidential && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <Lock className="w-3 h-3" />
          <span>Confidential</span>
        </div>
      )}
      
      {document.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {document.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              {tag}
            </span>
          ))}
          {document.tags.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              +{document.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentListItem({ document }: { document: Document }) {
  const FileIcon = getFileIcon(document.file_type);
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <FileIcon className="w-6 h-6 text-blue-600" />
        <div>
          <h4 className="font-medium text-gray-900">{document.document_name}</h4>
          <div className="text-sm text-gray-500">
            {formatFileSize(document.file_size)} • {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
            {document.category && ` • ${document.category}`}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {document.is_confidential && (
          <Lock className="w-4 h-4 text-red-600" />
        )}
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

function DocumentActionsModal({ 
  document, 
  onClose, 
  onDownload, 
  onDelete, 
  onUpdateCategory 
}: {
  document: Document;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onUpdateCategory: (documentId: string, category: string, subcategory: string) => void;
}) {
  const [category, setCategory] = useState(document.category);
  const [subcategory, setSubcategory] = useState(document.subcategory);

  const handleSave = () => {
    onUpdateCategory(document.id, category, subcategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Document Actions</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subcategory</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter subcategory"
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('pdf')) return FileText;
  return File;
};