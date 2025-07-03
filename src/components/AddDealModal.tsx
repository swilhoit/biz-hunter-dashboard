import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, AlertCircle, Brain, Save, CheckCircle, DollarSign, Building, Globe, Calendar, Phone, Mail, User, Tag } from 'lucide-react';
import { Deal, DealStatus, DealSource } from '../types/deal';
import { dealsAdapter, filesAdapter } from '../lib/database-adapter';
import { DocumentAnalysisService, DocumentAnalysis } from '../services/AIAnalysisService';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

interface FileAnalysis {
  id: string;
  fileName: string;
  analysis: DocumentAnalysis;
  status: 'analyzing' | 'completed' | 'error';
  error?: string;
}

const initialDealData: Partial<Deal> = {
  business_name: '',
  description: '',
  status: 'prospecting',
  source: 'other',
  asking_price: 0,
  annual_revenue: 0,
  annual_profit: 0,
  monthly_revenue: 0,
  monthly_profit: 0,
  valuation_multiple: 0,
  ebitda: 0,
  sde: 0,
  business_age: 0,
  employee_count: 0,
  inventory_value: 0,
  date_listed: '',
  listing_url: '',
  website_url: '',
  city: '',
  state: '',
  country: 'USA',
  industry: '',
  sub_industry: '',
  niche_keywords: [],
  seller_name: '',
  seller_email: '',
  seller_phone: '',
  broker_name: '',
  broker_email: '',
  broker_phone: '',
  broker_company: '',
  amazon_store_name: '',
  amazon_category: '',
  amazon_subcategory: '',
  amazon_store_url: '',
  seller_account_health: '',
  fba_percentage: 0,
  monthly_sessions: 0,
  conversion_rate: 0,
  brand_names: [],
  notes: '',
  tags: []
};

export default function AddDealModal({ isOpen, onClose, onDealCreated }: AddDealModalProps) {
  const [dealData, setDealData] = useState<Partial<Deal>>(initialDealData);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileAnalyses, setFileAnalyses] = useState<FileAnalysis[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<FileAnalysis | null>(null);

  const dealStatuses: { value: DealStatus; label: string }[] = [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'initial_contact', label: 'Initial Contact' },
    { value: 'loi_submitted', label: 'LOI Submitted' },
    { value: 'due_diligence', label: 'Due Diligence' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'under_contract', label: 'Under Contract' },
    { value: 'closing', label: 'Closing' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  const dealSources: { value: DealSource; label: string }[] = [
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'broker', label: 'Broker' },
    { value: 'direct_outreach', label: 'Direct Outreach' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: keyof Deal, value: any) => {
    setDealData(prev => ({ ...prev, [field]: value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    console.log('Starting file upload for', files.length, 'files');
    setUploadedFiles(prev => [...prev, ...files]);
    setIsAnalyzing(true);

    const newAnalyses: FileAnalysis[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      analysis: { confidence: 0, keyFindings: [] },
      status: 'analyzing'
    }));

    setFileAnalyses(prev => [...prev, ...newAnalyses]);

    // Analyze each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const analysisId = newAnalyses[i].id;
      console.log(`Analyzing file ${i + 1}/${files.length}: ${file.name}`);

      try {
        const analysis = await DocumentAnalysisService.analyzeDocument(file);
        console.log('Analysis result for', file.name, ':', analysis);
        
        setFileAnalyses(prev => prev.map(fa => 
          fa.id === analysisId
            ? { ...fa, analysis, status: 'completed' }
            : fa
        ));
      } catch (error: any) {
        console.error('Analysis error for', file.name, ':', error);
        setFileAnalyses(prev => prev.map(fa => 
          fa.id === analysisId
            ? { ...fa, status: 'error', error: error.message }
            : fa
        ));
      }
    }

    setIsAnalyzing(false);
    console.log('File analysis complete');
  };

  const applyAnalysisToForm = (analysis: DocumentAnalysis) => {
    const updates: Partial<Deal> = {};

    // Basic Information
    if (analysis.businessName && !dealData.business_name) {
      updates.business_name = analysis.businessName;
    }
    if (analysis.description && !dealData.description) {
      updates.description = analysis.description;
    }
    
    // Financial Information
    if (analysis.askingPrice && !dealData.asking_price) {
      updates.asking_price = analysis.askingPrice;
    }
    if (analysis.annualRevenue && !dealData.annual_revenue) {
      updates.annual_revenue = analysis.annualRevenue;
    }
    if (analysis.annualProfit && !dealData.annual_profit) {
      updates.annual_profit = analysis.annualProfit;
    }
    if (analysis.monthlyRevenue && !dealData.monthly_revenue) {
      updates.monthly_revenue = analysis.monthlyRevenue;
    }
    if (analysis.monthlyProfit && !dealData.monthly_profit) {
      updates.monthly_profit = analysis.monthlyProfit;
    }
    if (analysis.valuationMultiple && !dealData.valuation_multiple) {
      updates.valuation_multiple = analysis.valuationMultiple;
    }

    // Business Details
    if (analysis.businessAge && !dealData.business_age) {
      updates.business_age = analysis.businessAge;
    }
    if (analysis.dateListed && !dealData.date_listed) {
      updates.date_listed = analysis.dateListed;
    }
    if (analysis.industry && !dealData.industry) {
      updates.industry = analysis.industry;
    }
    if (analysis.location) {
      // Parse location into city/state if possible
      const locationParts = analysis.location.split(',').map(s => s.trim());
      if (locationParts.length >= 2 && !dealData.city) {
        updates.city = locationParts[0];
        updates.state = locationParts[1];
      }
    }
    if (analysis.listingUrl && !dealData.listing_url) {
      updates.listing_url = analysis.listingUrl;
    }
    if (analysis.websiteUrl && !dealData.website_url) {
      updates.website_url = analysis.websiteUrl;
    }
    // Additional business details from nested structures
    if (analysis.additionalInfo?.employeeCount && !dealData.employee_count) {
      updates.employee_count = analysis.additionalInfo.employeeCount;
    }
    if (analysis.additionalInfo?.inventoryValue && !dealData.inventory_value) {
      updates.inventory_value = analysis.additionalInfo.inventoryValue;
    }
    if (analysis.amazonInfo?.storeName && !dealData.amazon_store_name) {
      updates.amazon_store_name = analysis.amazonInfo.storeName;
    }
    if (analysis.amazonInfo?.subcategory && !dealData.amazon_subcategory) {
      updates.amazon_subcategory = analysis.amazonInfo.subcategory;
    }
    if (analysis.amazonInfo?.storeUrl && !dealData.amazon_store_url) {
      updates.amazon_store_url = analysis.amazonInfo.storeUrl;
    }
    if (analysis.amazonInfo?.fbaPercentage && !dealData.fba_percentage) {
      updates.fba_percentage = analysis.amazonInfo.fbaPercentage;
    }
    if (analysis.amazonInfo?.accountHealth && !dealData.seller_account_health) {
      updates.seller_account_health = analysis.amazonInfo.accountHealth;
    }
    if (analysis.amazonInfo?.category && !dealData.amazon_category) {
      updates.amazon_category = analysis.amazonInfo.category;
    }

    // Contact Information
    if (analysis.brokerInfo?.name && !dealData.broker_name) {
      updates.broker_name = analysis.brokerInfo.name;
    }
    if (analysis.brokerInfo?.company && !dealData.broker_company) {
      updates.broker_company = analysis.brokerInfo.company;
    }
    if (analysis.brokerInfo?.email && !dealData.broker_email) {
      updates.broker_email = analysis.brokerInfo.email;
    }
    if (analysis.brokerInfo?.phone && !dealData.broker_phone) {
      updates.broker_phone = analysis.brokerInfo.phone;
    }
    if (analysis.sellerInfo?.name && !dealData.seller_name) {
      updates.seller_name = analysis.sellerInfo.name;
    }
    if (analysis.sellerInfo?.email && !dealData.seller_email) {
      updates.seller_email = analysis.sellerInfo.email;
    }
    if (analysis.sellerInfo?.phone && !dealData.seller_phone) {
      updates.seller_phone = analysis.sellerInfo.phone;
    }

    // Amazon Information (consolidated with above mapping)

    // Additional Information to Notes
    const additionalNotes: string[] = [];
    
    if (analysis.additionalInfo?.inventoryValue) {
      additionalNotes.push(`Inventory Value: $${analysis.additionalInfo.inventoryValue.toLocaleString()}`);
    }
    if (analysis.additionalInfo?.employeeCount) {
      additionalNotes.push(`Employees: ${analysis.additionalInfo.employeeCount}`);
    }
    if (analysis.additionalInfo?.reasonForSelling) {
      additionalNotes.push(`Reason for Selling: ${analysis.additionalInfo.reasonForSelling}`);
    }
    if (analysis.additionalInfo?.growthOpportunities) {
      additionalNotes.push(`Growth Opportunities: ${analysis.additionalInfo.growthOpportunities}`);
    }
    if (analysis.additionalInfo?.includesRealEstate !== null) {
      additionalNotes.push(`Includes Real Estate: ${analysis.additionalInfo.includesRealEstate ? 'Yes' : 'No'}`);
    }
    if (analysis.additionalInfo?.trainingProvided !== null) {
      additionalNotes.push(`Training Provided: ${analysis.additionalInfo.trainingProvided ? 'Yes' : 'No'}`);
    }
    if (analysis.amazonInfo?.asinCount) {
      additionalNotes.push(`Number of ASINs: ${analysis.amazonInfo.asinCount}`);
    }
    if (analysis.amazonInfo?.topProducts && analysis.amazonInfo.topProducts.length > 0) {
      additionalNotes.push(`Top Products: ${analysis.amazonInfo.topProducts.join(', ')}`);
    }

    if (additionalNotes.length > 0 && !dealData.notes) {
      updates.notes = '--- AI Extracted Information ---\n' + additionalNotes.join('\n');
    }

    setDealData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!dealData.business_name) {
      alert('Please enter a business name');
      return;
    }

    setIsSaving(true);
    try {
      // Create the deal
      const createdDeal = await dealsAdapter.createDeal(dealData);
      
      // Upload files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await filesAdapter.uploadFile(createdDeal.id, file, {
            category: 'other',
            description: 'Added with manual deal creation',
            is_confidential: false
          });
        }
      }

      // Fetch the complete deal data to return
      const completeDeal = await dealsAdapter.fetchDealById(createdDeal.id);
      if (completeDeal) {
        onDealCreated(completeDeal);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error creating deal:', error);
      alert(`Failed to create deal: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setDealData(initialDealData);
    setUploadedFiles([]);
    setFileAnalyses([]);
    setIsAnalyzing(false);
    setShowAnalysisModal(false);
    setCurrentAnalysis(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Add New Deal
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* File Upload Section */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Smart Document Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload business documents and our AI will automatically extract key information like business name, 
                financial data, contact details, and Amazon metrics to populate your deal form.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Best Results:</strong> Plain text files (.txt) work best. For PDF/Word/Excel files, 
                  consider copying the content and saving as .txt for optimal AI analysis.
                </p>
              </div>
              
              <div 
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                } ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isAnalyzing}
                  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
                />
                
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {isAnalyzing ? 'AI analyzing documents...' : 'Drop documents here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports .txt, .pdf, .doc/.docx, .xls/.xlsx • Best results with plain text files
                </p>
              </div>

              {/* File Analysis Results */}
              {fileAnalyses.length > 0 && (
                <div className="mt-4">
                  {/* Overall Quality Summary */}
                  {fileAnalyses.some(f => f.status === 'completed') && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Document Analysis Summary
                        </span>
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          {fileAnalyses.filter(f => f.status === 'completed' && f.analysis.confidence >= 40).length} of {fileAnalyses.filter(f => f.status === 'completed').length} documents have sufficient data
                        </span>
                      </div>
                      {fileAnalyses.filter(f => f.status === 'completed' && f.analysis.confidence < 40).length > 0 && (
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          ⚠️ Some documents had insufficient business information - consider uploading business listings, financial statements, or broker teasers for better results.
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                  {fileAnalyses.map(analysis => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {analysis.fileName}
                        </span>
                        {analysis.status === 'analyzing' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {analysis.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {analysis.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      {analysis.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              analysis.analysis.confidence >= 70 ? 'bg-green-100 text-green-800' :
                              analysis.analysis.confidence >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {analysis.analysis.confidence}% confidence
                            </span>
                            {analysis.analysis.confidence < 40 && (
                              <span className="text-xs text-red-600" title="Insufficient data extracted">
                                ⚠️ Low Quality
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setCurrentAnalysis(analysis);
                                setShowAnalysisModal(true);
                              }}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => applyAnalysisToForm(analysis.analysis)}
                              disabled={analysis.analysis.confidence < 30}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                analysis.analysis.confidence < 30 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                              title={analysis.analysis.confidence < 30 ? 'Not enough data to apply' : 'Apply extracted data to form'}
                            >
                              {analysis.analysis.confidence < 30 ? 'Insufficient Data' : 'Apply to Form'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            {/* Manual Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={dealData.business_name || ''}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter business name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={dealData.status || 'prospecting'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    >
                      {dealStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Source
                    </label>
                    <select
                      value={dealData.source || 'other'}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    >
                      {dealSources.map(source => (
                        <option key={source.value} value={source.value}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={dealData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter business description..."
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Financial Information
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Asking Price ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.asking_price || ''}
                      onChange={(e) => handleInputChange('asking_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business Age (years)
                    </label>
                    <input
                      type="number"
                      value={dealData.business_age || ''}
                      onChange={(e) => handleInputChange('business_age', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Annual Revenue ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.annual_revenue || ''}
                      onChange={(e) => handleInputChange('annual_revenue', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Annual Profit ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.annual_profit || ''}
                      onChange={(e) => handleInputChange('annual_profit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      EBITDA ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.ebitda || ''}
                      onChange={(e) => handleInputChange('ebitda', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SDE ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.sde || ''}
                      onChange={(e) => handleInputChange('sde', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Revenue ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.monthly_revenue || ''}
                      onChange={(e) => handleInputChange('monthly_revenue', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Profit ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.monthly_profit || ''}
                      onChange={(e) => handleInputChange('monthly_profit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee Count
                    </label>
                    <input
                      type="number"
                      value={dealData.employee_count || ''}
                      onChange={(e) => handleInputChange('employee_count', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Inventory Value ($)
                    </label>
                    <input
                      type="number"
                      value={dealData.inventory_value || ''}
                      onChange={(e) => handleInputChange('inventory_value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Business & Industry Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-indigo-600" />
                  Business & Industry
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={dealData.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., E-commerce, SaaS, Manufacturing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sub-Industry
                    </label>
                    <input
                      type="text"
                      value={dealData.sub_industry || ''}
                      onChange={(e) => handleInputChange('sub_industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., Pet Supplies, B2B Software"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={dealData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={dealData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={dealData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={dealData.website_url || ''}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="https://company-website.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Listing URL
                  </label>
                  <input
                    type="url"
                    value={dealData.listing_url || ''}
                    onChange={(e) => handleInputChange('listing_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="https://marketplace-listing.com"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Contact Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seller Name
                  </label>
                  <input
                    type="text"
                    value={dealData.seller_name || ''}
                    onChange={(e) => handleInputChange('seller_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter seller name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Seller Email
                    </label>
                    <input
                      type="email"
                      value={dealData.seller_email || ''}
                      onChange={(e) => handleInputChange('seller_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="seller@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Seller Phone
                    </label>
                    <input
                      type="tel"
                      value={dealData.seller_phone || ''}
                      onChange={(e) => handleInputChange('seller_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Broker Name
                  </label>
                  <input
                    type="text"
                    value={dealData.broker_name || ''}
                    onChange={(e) => handleInputChange('broker_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter broker name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Broker Company
                  </label>
                  <input
                    type="text"
                    value={dealData.broker_company || ''}
                    onChange={(e) => handleInputChange('broker_company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter broker company"
                  />
                </div>
              </div>

              {/* Amazon Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-orange-600" />
                  Amazon Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amazon Store URL
                  </label>
                  <input
                    type="url"
                    value={dealData.amazon_store_url || ''}
                    onChange={(e) => handleInputChange('amazon_store_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="https://amazon.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amazon Store Name
                  </label>
                  <input
                    type="text"
                    value={dealData.amazon_store_name || ''}
                    onChange={(e) => handleInputChange('amazon_store_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Amazon store name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amazon Category
                    </label>
                    <input
                      type="text"
                      value={dealData.amazon_category || ''}
                      onChange={(e) => handleInputChange('amazon_category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amazon Subcategory
                    </label>
                    <input
                      type="text"
                      value={dealData.amazon_subcategory || ''}
                      onChange={(e) => handleInputChange('amazon_subcategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., Kitchen & Dining"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      FBA Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={dealData.fba_percentage || ''}
                      onChange={(e) => handleInputChange('fba_percentage', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Seller Account Health
                    </label>
                    <select
                      value={dealData.seller_account_health || ''}
                      onChange={(e) => handleInputChange('seller_account_health', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Select account health</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Sessions
                    </label>
                    <input
                      type="number"
                      value={dealData.monthly_sessions || ''}
                      onChange={(e) => handleInputChange('monthly_sessions', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Conversion Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={dealData.conversion_rate || ''}
                      onChange={(e) => handleInputChange('conversion_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={dealData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Add any additional notes about this deal..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !dealData.business_name}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Creating...' : 'Create Deal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Detail Modal */}
      {showAnalysisModal && currentAnalysis && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Analysis Results: {currentAnalysis.fileName}
              </h3>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {/* Quality Assessment Header */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Quality:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentAnalysis.analysis.confidence >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      currentAnalysis.analysis.confidence >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {currentAnalysis.analysis.confidence}% confidence
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentAnalysis.analysis.confidence >= 70 ? 'bg-green-500' :
                        currentAnalysis.analysis.confidence >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${currentAnalysis.analysis.confidence}%` }}
                    ></div>
                  </div>
                  {currentAnalysis.analysis.confidence < 40 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      ⚠️ Low confidence - document may not contain sufficient business information
                    </p>
                  )}
                </div>
                
                {currentAnalysis.analysis.keyFindings && currentAnalysis.analysis.keyFindings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Extraction Results:</h4>
                    <ul className="space-y-2 text-sm">
                      {currentAnalysis.analysis.keyFindings.map((finding, index) => (
                        <li key={index} className={`flex items-start ${
                          finding.includes('✅') ? 'text-green-700 dark:text-green-400' :
                          finding.includes('⚠️') ? 'text-yellow-700 dark:text-yellow-400' :
                          finding.includes('❌') ? 'text-red-700 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          <span className="mr-2">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.entries(currentAnalysis.analysis)
                  .filter(([key, value]) => key !== 'confidence' && key !== 'keyFindings' && value)
                  .map(([key, value]) => (
                    <div key={key} className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  applyAnalysisToForm(currentAnalysis.analysis);
                  setShowAnalysisModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply to Form
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}