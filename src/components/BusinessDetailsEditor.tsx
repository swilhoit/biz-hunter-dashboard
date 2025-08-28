import React, { useState } from 'react';
import { 
  Building2, Globe, Users, DollarSign, TrendingUp, 
  Shield, Brain, Plus, X, Save, Loader2, ChevronDown, ChevronUp,
  Facebook, Instagram, Linkedin, Twitter, Youtube, Hash,
  MapPin, Package, Briefcase, Star, AlertCircle, Sparkles, FileText
} from 'lucide-react';
import { ExtendedDeal, AIExtractionRequest } from '../types/deal-extended';
// @ts-ignore - JavaScript module
import { dealsAdapter } from '../lib/database-adapter';

interface BusinessDetailsEditorProps {
  deal: ExtendedDeal;
  onUpdate: (updates: Partial<ExtendedDeal>) => Promise<void>;
  onAIExtract?: (request: AIExtractionRequest) => Promise<void>;
}

export default function BusinessDetailsEditor({ deal, onUpdate, onAIExtract }: BusinessDetailsEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('identity');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formData, setFormData] = useState<Partial<ExtendedDeal>>(deal);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['identity']));
  const [showExtractDialog, setShowExtractDialog] = useState(false);
  const [extractSource, setExtractSource] = useState<'website' | 'documents'>('website');
  const [websiteUrl, setWebsiteUrl] = useState(deal.website_url || '');
  const [extractionProgress, setExtractionProgress] = useState<string>('');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving business details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIExtract = async () => {
    if (!onAIExtract) return;
    
    setIsExtracting(true);
    try {
      if (extractSource === 'website') {
        // Extract from website URL
        if (!websiteUrl) {
          alert('Please enter a website URL');
          setIsExtracting(false);
          return;
        }
        
        await onAIExtract({
          deal_id: deal.id,
          extraction_type: 'full',
          override_existing: false,
          website_url: websiteUrl,
          progress_callback: (stage: string) => setExtractionProgress(stage)
        } as any);
      } else {
        // Extract from documents
        await onAIExtract({
          deal_id: deal.id,
          extraction_type: 'full',
          override_existing: false,
          progress_callback: (stage: string) => setExtractionProgress(stage)
        });
      }
      
      setShowExtractDialog(false);
      setExtractionProgress('');
      // Refresh form data after extraction
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error extracting with AI:', error);
      setExtractionProgress('');
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  const calculateCompleteness = (): number => {
    let score = 0;
    let totalFields = 0;
    let filledFields = 0;

    // Helper function to check if a field has meaningful data
    const hasValue = (value: any): boolean => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    };

    // Critical fields (weighted 2x)
    const criticalFields = ['business_name', 'asking_price', 'annual_revenue', 'annual_profit'];
    criticalFields.forEach(field => {
      totalFields += 2;
      if (hasValue(formData[field as keyof ExtendedDeal])) filledFields += 2;
    });

    // Important fields
    const importantFields = [
      'brand_name', 'website_url', 'employee_count', 'gross_margin',
      'customer_retention_rate', 'market_size', 'revenue_model'
    ];
    importantFields.forEach(field => {
      totalFields += 1;
      if (hasValue(formData[field as keyof ExtendedDeal])) filledFields += 1;
    });

    // JSON fields - check for actual content
    if (formData.social_media && typeof formData.social_media === 'object') {
      const hasSocialLinks = Object.values(formData.social_media).some(url => hasValue(url));
      if (hasSocialLinks) filledFields += 1;
    }
    totalFields += 1;

    if (Array.isArray(formData.marketing_channels) && formData.marketing_channels.length > 0) {
      filledFields += 1;
    }
    totalFields += 1;

    score = Math.round((filledFields / totalFields) * 100);
    return score;
  };

  const completenessScore = calculateCompleteness();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Business Details
            </h3>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">Completeness:</div>
              <div className="flex items-center space-x-1">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      completenessScore >= 80 ? 'bg-green-500' : 
                      completenessScore >= 60 ? 'bg-yellow-500' : 
                      completenessScore >= 40 ? 'bg-orange-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${completenessScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{completenessScore}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onAIExtract && (
              <button
                onClick={() => setShowExtractDialog(true)}
                disabled={isExtracting}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>AI Auto-Fill</span>
              </button>
            )}
            
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Extraction Dialog */}
      {showExtractDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                AI Auto-Fill Business Details
              </h3>
              <button
                onClick={() => setShowExtractDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Choose extraction source:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExtractSource('website')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      extractSource === 'website'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Website</div>
                    <div className="text-xs text-gray-500 mt-1">Extract from business website</div>
                  </button>
                  
                  <button
                    onClick={() => setExtractSource('documents')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      extractSource === 'documents'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Documents</div>
                    <div className="text-xs text-gray-500 mt-1">Extract from uploaded files</div>
                  </button>
                </div>
              </div>
              
              {extractSource === 'website' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the business website to extract company information
                  </p>
                </div>
              )}
              
              {extractSource === 'documents' && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    AI will analyze all uploaded documents to extract business information.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Make sure you've uploaded relevant documents in the Documents tab.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowExtractDialog(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIExtract}
                  disabled={isExtracting || (extractSource === 'website' && !websiteUrl)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{extractionProgress || 'Extracting...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Start Extraction</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Progress indicator */}
              {isExtracting && extractionProgress && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      {extractionProgress}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* Business Identity Section */}
        <Section
          title="Business Identity"
          icon={<Building2 className="h-4 w-4" />}
          expanded={expandedSections.has('identity')}
          onToggle={() => toggleSection('identity')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <InputField
              label="Brand Name"
              value={formData.brand_name || ''}
              onChange={(value) => setFormData({...formData, brand_name: value})}
              disabled={!isEditing}
            />
            <InputField
              label="Website URL"
              value={formData.website_url || ''}
              onChange={(value) => setFormData({...formData, website_url: value})}
              disabled={!isEditing}
              type="url"
            />
            <InputField
              label="Legal Entity Type"
              value={formData.legal_entity_type || ''}
              onChange={(value) => setFormData({...formData, legal_entity_type: value})}
              disabled={!isEditing}
              placeholder="LLC, Corp, Partnership..."
            />
            <InputField
              label="Founding Year"
              value={formData.founding_year?.toString() || ''}
              onChange={(value) => setFormData({...formData, founding_year: parseInt(value) || undefined})}
              disabled={!isEditing}
              type="number"
            />
            <InputField
              label="EIN/Tax ID"
              value={formData.ein_tax_id || ''}
              onChange={(value) => setFormData({...formData, ein_tax_id: value})}
              disabled={!isEditing}
            />
            <InputField
              label="Domain Authority"
              value={formData.domain_authority?.toString() || ''}
              onChange={(value) => setFormData({...formData, domain_authority: parseInt(value) || undefined})}
              disabled={!isEditing}
              type="number"
              min="0"
              max="100"
            />
          </div>
        </Section>

        {/* Digital Presence Section */}
        <Section
          title="Digital Presence"
          icon={<Globe className="h-4 w-4" />}
          expanded={expandedSections.has('digital')}
          onToggle={() => toggleSection('digital')}
        >
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Social Media</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SocialMediaInput
                platform="facebook"
                icon={<Facebook className="h-4 w-4" />}
                value={formData.social_media?.facebook || ''}
                onChange={(value) => setFormData({
                  ...formData,
                  social_media: {...formData.social_media, facebook: value}
                })}
                disabled={!isEditing}
              />
              <SocialMediaInput
                platform="instagram"
                icon={<Instagram className="h-4 w-4" />}
                value={formData.social_media?.instagram || ''}
                onChange={(value) => setFormData({
                  ...formData,
                  social_media: {...formData.social_media, instagram: value}
                })}
                disabled={!isEditing}
              />
              <SocialMediaInput
                platform="linkedin"
                icon={<Linkedin className="h-4 w-4" />}
                value={formData.social_media?.linkedin || ''}
                onChange={(value) => setFormData({
                  ...formData,
                  social_media: {...formData.social_media, linkedin: value}
                })}
                disabled={!isEditing}
              />
              <SocialMediaInput
                platform="youtube"
                icon={<Youtube className="h-4 w-4" />}
                value={formData.social_media?.youtube || ''}
                onChange={(value) => setFormData({
                  ...formData,
                  social_media: {...formData.social_media, youtube: value}
                })}
                disabled={!isEditing}
              />
            </div>

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-3">Online Reviews</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReviewPlatformInput
                platform="Google"
                rating={formData.online_reviews?.google?.rating || 0}
                count={formData.online_reviews?.google?.count || 0}
                onRatingChange={(rating) => setFormData({
                  ...formData,
                  online_reviews: {
                    ...formData.online_reviews,
                    google: {...formData.online_reviews?.google, rating, count: formData.online_reviews?.google?.count || 0}
                  }
                })}
                onCountChange={(count) => setFormData({
                  ...formData,
                  online_reviews: {
                    ...formData.online_reviews,
                    google: {...formData.online_reviews?.google, count, rating: formData.online_reviews?.google?.rating || 0}
                  }
                })}
                disabled={!isEditing}
              />
              <ReviewPlatformInput
                platform="Yelp"
                rating={formData.online_reviews?.yelp?.rating || 0}
                count={formData.online_reviews?.yelp?.count || 0}
                onRatingChange={(rating) => setFormData({
                  ...formData,
                  online_reviews: {
                    ...formData.online_reviews,
                    yelp: {...formData.online_reviews?.yelp, rating, count: formData.online_reviews?.yelp?.count || 0}
                  }
                })}
                onCountChange={(count) => setFormData({
                  ...formData,
                  online_reviews: {
                    ...formData.online_reviews,
                    yelp: {...formData.online_reviews?.yelp, count, rating: formData.online_reviews?.yelp?.rating || 0}
                  }
                })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </Section>

        {/* Marketing & Sales Section */}
        <Section
          title="Marketing & Sales"
          icon={<TrendingUp className="h-4 w-4" />}
          expanded={expandedSections.has('marketing')}
          onToggle={() => toggleSection('marketing')}
        >
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marketing Channels
                </label>
                <MultiSelect
                  options={['SEO', 'PPC', 'Social Media', 'Email', 'Content Marketing', 'Affiliate', 'Direct Sales', 'Influencer']}
                  selected={formData.marketing_channels || []}
                  onChange={(channels) => setFormData({...formData, marketing_channels: channels})}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sales Channels
                </label>
                <MultiSelect
                  options={['Online', 'Retail', 'Wholesale', 'B2B', 'B2C', 'Marketplace', 'Subscription', 'Direct to Consumer']}
                  selected={formData.sales_channels || []}
                  onChange={(channels) => setFormData({...formData, sales_channels: channels})}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Revenue Model
              </label>
              <select
                value={formData.revenue_model || ''}
                onChange={(e) => setFormData({...formData, revenue_model: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              >
                <option value="">Select revenue model</option>
                <option value="Subscription">Subscription</option>
                <option value="One-time">One-time</option>
                <option value="Recurring">Recurring</option>
                <option value="Transaction">Transaction</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Financial Metrics Section */}
        <Section
          title="Financial Metrics"
          icon={<DollarSign className="h-4 w-4" />}
          expanded={expandedSections.has('financial')}
          onToggle={() => toggleSection('financial')}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <InputField
              label="Gross Margin (%)"
              value={formData.gross_margin?.toString() || ''}
              onChange={(value) => setFormData({...formData, gross_margin: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              step="0.01"
            />
            <InputField
              label="Customer Acquisition Cost"
              value={formData.customer_acquisition_cost?.toString() || ''}
              onChange={(value) => setFormData({...formData, customer_acquisition_cost: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              prefix="$"
            />
            <InputField
              label="Customer Lifetime Value"
              value={formData.customer_lifetime_value?.toString() || ''}
              onChange={(value) => setFormData({...formData, customer_lifetime_value: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              prefix="$"
            />
            <InputField
              label="Monthly Burn Rate"
              value={formData.monthly_burn_rate?.toString() || ''}
              onChange={(value) => setFormData({...formData, monthly_burn_rate: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              prefix="$"
            />
            <InputField
              label="Cash on Hand"
              value={formData.cash_on_hand?.toString() || ''}
              onChange={(value) => setFormData({...formData, cash_on_hand: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              prefix="$"
            />
            <InputField
              label="Total Debt"
              value={formData.total_debt?.toString() || ''}
              onChange={(value) => setFormData({...formData, total_debt: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              prefix="$"
            />
          </div>
        </Section>

        {/* Team Section */}
        <Section
          title="Team & Human Resources"
          icon={<Users className="h-4 w-4" />}
          expanded={expandedSections.has('team')}
          onToggle={() => toggleSection('team')}
        >
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InputField
                label="Employee Count"
                value={formData.employee_count?.toString() || ''}
                onChange={(value) => setFormData({...formData, employee_count: parseInt(value) || undefined})}
                disabled={!isEditing}
                type="number"
              />
              <InputField
                label="Contractors Count"
                value={formData.contractors_count?.toString() || ''}
                onChange={(value) => setFormData({...formData, contractors_count: parseInt(value) || undefined})}
                disabled={!isEditing}
                type="number"
              />
            </div>
            
            {/* Key Employees would be a more complex component */}
          </div>
        </Section>

        {/* Customer Metrics Section */}
        <Section
          title="Customer Metrics"
          icon={<Star className="h-4 w-4" />}
          expanded={expandedSections.has('customers')}
          onToggle={() => toggleSection('customers')}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <InputField
              label="Total Customers"
              value={formData.total_customers?.toString() || ''}
              onChange={(value) => setFormData({...formData, total_customers: parseInt(value) || undefined})}
              disabled={!isEditing}
              type="number"
            />
            <InputField
              label="Customer Retention Rate (%)"
              value={formData.customer_retention_rate?.toString() || ''}
              onChange={(value) => setFormData({...formData, customer_retention_rate: parseFloat(value) || undefined})}
              disabled={!isEditing}
              type="number"
              step="0.01"
            />
            <InputField
              label="Net Promoter Score"
              value={formData.net_promoter_score?.toString() || ''}
              onChange={(value) => setFormData({...formData, net_promoter_score: parseInt(value) || undefined})}
              disabled={!isEditing}
              type="number"
              min="-100"
              max="100"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

// Helper Components

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, icon, expanded, onToggle, children }: SectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expanded && children}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  prefix?: string;
  min?: string;
  max?: string;
  step?: string;
}

function InputField({ label, value, onChange, disabled, type = 'text', placeholder, prefix, ...props }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 ${prefix ? 'pl-8' : ''} border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-800`}
          {...props}
        />
      </div>
    </div>
  );
}

interface SocialMediaInputProps {
  platform: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function SocialMediaInput({ platform, icon, value, onChange, disabled }: SocialMediaInputProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 min-w-[100px]">
        {icon}
        <span className="text-sm capitalize">{platform}</span>
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`${platform} URL`}
        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 disabled:bg-gray-50"
      />
    </div>
  );
}

interface ReviewPlatformInputProps {
  platform: string;
  rating: number;
  count: number;
  onRatingChange: (rating: number) => void;
  onCountChange: (count: number) => void;
  disabled?: boolean;
}

function ReviewPlatformInput({ platform, rating, count, onRatingChange, onCountChange, disabled }: ReviewPlatformInputProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{platform}</div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <input
            type="number"
            value={rating}
            onChange={(e) => onRatingChange(parseFloat(e.target.value))}
            disabled={disabled}
            step="0.1"
            min="0"
            max="5"
            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Hash className="h-4 w-4 text-gray-500" />
          <input
            type="number"
            value={count}
            onChange={(e) => onCountChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
          />
          <span className="text-xs text-gray-500">reviews</span>
        </div>
      </div>
    </div>
  );
}

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

function MultiSelect({ options, selected, onChange, disabled }: MultiSelectProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option}
          onClick={() => !disabled && toggleOption(option)}
          disabled={disabled}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            selected.includes(option)
              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}