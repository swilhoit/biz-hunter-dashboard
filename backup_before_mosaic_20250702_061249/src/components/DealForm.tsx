import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  X,
  Save,
  Plus,
  Trash2,
  DollarSign,
  Building2,
  MapPin,
  Globe,
  Calendar,
  User,
  Tag,
  AlertCircle,
  FileText,
  Calculator,
  Target
} from 'lucide-react';

interface DealFormProps {
  dealId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface DealFormData {
  business_name: string;
  dba_names: string[];
  entity_type: string;
  asking_price: number;
  annual_revenue: number;
  annual_profit: number;
  ebitda: number;
  sde: number;
  multiple: number;
  business_age: number;
  employee_count: number;
  inventory_value: number;
  date_listed: string;
  date_established: string;
  on_or_off_market: 'on' | 'off' | 'pocket';
  listing_url: string;
  website_url: string;
  amazon_category: string;
  amazon_store_link: string;
  monthly_sessions: number;
  conversion_rate: number;
  brand_names: string[];
  city: string;
  state: string;
  country: string;
  industry: string;
  sub_industry: string;
  niche_keywords: string[];
  source: string;
  broker_name: string;
  broker_email: string;
  broker_phone: string;
  listing_id_on_source: string;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  score: number;
  next_action: string;
  next_action_date: string;
  tags: string[];
}

const INITIAL_FORM_DATA: DealFormData = {
  business_name: '',
  dba_names: [],
  entity_type: '',
  asking_price: 0,
  annual_revenue: 0,
  annual_profit: 0,
  ebitda: 0,
  sde: 0,
  multiple: 0,
  business_age: 0,
  employee_count: 0,
  inventory_value: 0,
  date_listed: '',
  date_established: '',
  on_or_off_market: 'on',
  listing_url: '',
  website_url: '',
  amazon_category: '',
  amazon_store_link: '',
  monthly_sessions: 0,
  conversion_rate: 0,
  brand_names: [],
  city: '',
  state: '',
  country: 'USA',
  industry: '',
  sub_industry: '',
  niche_keywords: [],
  source: '',
  broker_name: '',
  broker_email: '',
  broker_phone: '',
  listing_id_on_source: '',
  stage: 'prospecting',
  priority: 'medium',
  score: 50,
  next_action: '',
  next_action_date: '',
  tags: []
};

const STAGES = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'qualified_leads', label: 'Qualified Leads' },
  { value: 'first_contact', label: 'First Contact' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'loi', label: 'LOI' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
];

const INDUSTRIES = [
  'E-commerce', 'SaaS', 'Services', 'Manufacturing', 'Retail', 'Healthcare',
  'Education', 'Real Estate', 'Finance', 'Technology', 'Food & Beverage', 'Other'
];

const SOURCES = [
  'Empire Flippers', 'Flippa', 'BizBuySell', 'Quiet Light', 'FE International',
  'Motion Invest', 'Direct Outreach', 'Broker Network', 'Referral', 'Other'
];

export default function DealForm({ dealId, isOpen, onClose, onSave }: DealFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DealFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (dealId) {
        fetchDeal();
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
    }
  }, [isOpen, dealId]);

  const fetchDeal = async () => {
    if (!dealId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) throw error;
      
      setFormData({
        ...data,
        date_listed: data.date_listed || '',
        date_established: data.date_established || '',
        next_action_date: data.next_action_date || '',
        dba_names: data.dba_names || [],
        brand_names: data.brand_names || [],
        niche_keywords: data.niche_keywords || [],
        tags: data.tags || []
      });
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }

    if (formData.asking_price < 0) {
      newErrors.asking_price = 'Asking price must be positive';
    }

    if (formData.annual_revenue < 0) {
      newErrors.annual_revenue = 'Annual revenue must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMetrics = () => {
    if (formData.asking_price > 0 && formData.annual_revenue > 0) {
      const multiple = formData.asking_price / formData.annual_revenue;
      setFormData(prev => ({ ...prev, multiple: Math.round(multiple * 100) / 100 }));
    }

    if (formData.annual_revenue > 0 && formData.ebitda > 0) {
      const profitMargin = (formData.ebitda / formData.annual_revenue) * 100;
      // Auto-calculate score based on multiple factors
      let score = 50; // Base score
      
      if (multiple && multiple < 3) score += 20;
      else if (multiple && multiple < 4) score += 10;
      else if (multiple && multiple > 5) score -= 10;
      
      if (profitMargin > 30) score += 15;
      else if (profitMargin > 20) score += 10;
      else if (profitMargin < 10) score -= 10;
      
      if (formData.business_age > 5) score += 10;
      else if (formData.business_age < 2) score -= 5;
      
      score = Math.max(0, Math.min(100, score));
      setFormData(prev => ({ ...prev, score }));
    }
  };

  useEffect(() => {
    calculateMetrics();
  }, [formData.asking_price, formData.annual_revenue, formData.ebitda, formData.business_age]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dealData = {
        ...formData,
        created_by: user?.id,
        assigned_to: user?.id,
        date_listed: formData.date_listed || null,
        date_established: formData.date_established || null,
        next_action_date: formData.next_action_date || null
      };

      if (dealId) {
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', dealId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('deals')
          .insert(dealData);
        
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Failed to save deal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (field: keyof DealFormData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof DealFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'financial', label: 'Financials', icon: DollarSign },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'pipeline', label: 'Pipeline', icon: Target }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {dealId ? 'Edit Deal' : 'Create New Deal'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <BasicInfoTab formData={formData} setFormData={setFormData} errors={errors} />
            )}
            {activeTab === 'financial' && (
              <FinancialTab formData={formData} setFormData={setFormData} errors={errors} />
            )}
            {activeTab === 'details' && (
              <DetailsTab 
                formData={formData} 
                setFormData={setFormData} 
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                errors={errors} 
              />
            )}
            {activeTab === 'pipeline' && (
              <PipelineTab formData={formData} setFormData={setFormData} errors={errors} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calculator className="w-4 h-4" />
              <span>Score: {formData.score}/100</span>
              {formData.multiple > 0 && (
                <>
                  <span>•</span>
                  <span>Multiple: {formData.multiple}x</span>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {dealId ? 'Update Deal' : 'Create Deal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function BasicInfoTab({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Business Name *</label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            className={`w-full border rounded-lg px-3 py-2 ${errors.business_name ? 'border-red-500' : ''}`}
            placeholder="Enter business name"
          />
          {errors.business_name && (
            <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Entity Type</label>
          <select
            value={formData.entity_type}
            onChange={(e) => setFormData(prev => ({ ...prev, entity_type: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select entity type</option>
            <option value="LLC">LLC</option>
            <option value="Corporation">Corporation</option>
            <option value="Partnership">Partnership</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Industry *</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            className={`w-full border rounded-lg px-3 py-2 ${errors.industry ? 'border-red-500' : ''}`}
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sub-Industry</label>
          <input
            type="text"
            value={formData.sub_industry}
            onChange={(e) => setFormData(prev => ({ ...prev, sub_industry: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g., Kitchen Gadgets, Pet Supplies"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Business Age (years)</label>
          <input
            type="number"
            value={formData.business_age}
            onChange={(e) => setFormData(prev => ({ ...prev, business_age: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Employee Count</label>
          <input
            type="number"
            value={formData.employee_count}
            onChange={(e) => setFormData(prev => ({ ...prev, employee_count: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Business location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">State</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="State/Province"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Website URL</label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Listing URL</label>
          <input
            type="url"
            value={formData.listing_url}
            onChange={(e) => setFormData(prev => ({ ...prev, listing_url: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="https://marketplace.com/listing"
          />
        </div>
      </div>
    </div>
  );
}

function FinancialTab({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Asking Price</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={formData.asking_price}
              onChange={(e) => setFormData(prev => ({ ...prev, asking_price: parseFloat(e.target.value) || 0 }))}
              className={`w-full border rounded-lg pl-10 pr-3 py-2 ${errors.asking_price ? 'border-red-500' : ''}`}
              min="0"
              step="1000"
            />
          </div>
          {errors.asking_price && (
            <p className="text-red-500 text-sm mt-1">{errors.asking_price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Annual Revenue</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={formData.annual_revenue}
              onChange={(e) => setFormData(prev => ({ ...prev, annual_revenue: parseFloat(e.target.value) || 0 }))}
              className={`w-full border rounded-lg pl-10 pr-3 py-2 ${errors.annual_revenue ? 'border-red-500' : ''}`}
              min="0"
              step="1000"
            />
          </div>
          {errors.annual_revenue && (
            <p className="text-red-500 text-sm mt-1">{errors.annual_revenue}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Annual Profit</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={formData.annual_profit}
              onChange={(e) => setFormData(prev => ({ ...prev, annual_profit: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg pl-10 pr-3 py-2"
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">EBITDA</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={formData.ebitda}
              onChange={(e) => setFormData(prev => ({ ...prev, ebitda: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg pl-10 pr-3 py-2"
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">SDE (Seller's Discretionary Earnings)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={formData.sde}
              onChange={(e) => setFormData(prev => ({ ...prev, sde: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg pl-10 pr-3 py-2"
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Multiple (Auto-calculated)</label>
          <input
            type="number"
            value={formData.multiple}
            readOnly
            className="w-full border rounded-lg px-3 py-2 bg-gray-50"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Inventory Value</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={formData.inventory_value}
              onChange={(e) => setFormData(prev => ({ ...prev, inventory_value: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg pl-10 pr-3 py-2"
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Monthly Sessions</label>
          <input
            type="number"
            value={formData.monthly_sessions}
            onChange={(e) => setFormData(prev => ({ ...prev, monthly_sessions: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Conversion Rate (%)</label>
          <input
            type="number"
            value={formData.conversion_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, conversion_rate: parseFloat(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
            max="100"
            step="0.1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Date Listed</label>
          <input
            type="date"
            value={formData.date_listed}
            onChange={(e) => setFormData(prev => ({ ...prev, date_listed: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date Established</label>
          <input
            type="date"
            value={formData.date_established}
            onChange={(e) => setFormData(prev => ({ ...prev, date_established: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ formData, setFormData, addArrayItem, removeArrayItem, errors }: any) {
  const [newDbaName, setNewDbaName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newTag, setNewTag] = useState('');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Source</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select source</option>
            {SOURCES.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Market Status</label>
          <select
            value={formData.on_or_off_market}
            onChange={(e) => setFormData(prev => ({ ...prev, on_or_off_market: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="on">On Market</option>
            <option value="off">Off Market</option>
            <option value="pocket">Pocket Listing</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amazon Category</label>
          <input
            type="text"
            value={formData.amazon_category}
            onChange={(e) => setFormData(prev => ({ ...prev, amazon_category: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g., Home & Kitchen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amazon Store Link</label>
          <input
            type="url"
            value={formData.amazon_store_link}
            onChange={(e) => setFormData(prev => ({ ...prev, amazon_store_link: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="https://amazon.com/stores/..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Broker Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Broker Name</label>
            <input
              type="text"
              value={formData.broker_name}
              onChange={(e) => setFormData(prev => ({ ...prev, broker_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Broker Email</label>
            <input
              type="email"
              value={formData.broker_email}
              onChange={(e) => setFormData(prev => ({ ...prev, broker_email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Broker Phone</label>
            <input
              type="tel"
              value={formData.broker_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, broker_phone: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* DBA Names */}
      <ArrayFieldEditor
        title="DBA Names"
        items={formData.dba_names}
        newValue={newDbaName}
        setNewValue={setNewDbaName}
        onAdd={() => {
          addArrayItem('dba_names', newDbaName);
          setNewDbaName('');
        }}
        onRemove={(index) => removeArrayItem('dba_names', index)}
        placeholder="Add DBA name"
      />

      {/* Brand Names */}
      <ArrayFieldEditor
        title="Brand Names"
        items={formData.brand_names}
        newValue={newBrandName}
        setNewValue={setNewBrandName}
        onAdd={() => {
          addArrayItem('brand_names', newBrandName);
          setNewBrandName('');
        }}
        onRemove={(index) => removeArrayItem('brand_names', index)}
        placeholder="Add brand name"
      />

      {/* Keywords */}
      <ArrayFieldEditor
        title="Niche Keywords"
        items={formData.niche_keywords}
        newValue={newKeyword}
        setNewValue={setNewKeyword}
        onAdd={() => {
          addArrayItem('niche_keywords', newKeyword);
          setNewKeyword('');
        }}
        onRemove={(index) => removeArrayItem('niche_keywords', index)}
        placeholder="Add keyword"
      />

      {/* Tags */}
      <ArrayFieldEditor
        title="Tags"
        items={formData.tags}
        newValue={newTag}
        setNewValue={setNewTag}
        onAdd={() => {
          addArrayItem('tags', newTag);
          setNewTag('');
        }}
        onRemove={(index) => removeArrayItem('tags', index)}
        placeholder="Add tag"
      />
    </div>
  );
}

function PipelineTab({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Pipeline Stage</label>
          <select
            value={formData.stage}
            onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          >
            {STAGES.map(stage => (
              <option key={stage.value} value={stage.value}>{stage.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          >
            {PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Deal Score (0-100)</label>
          <input
            type="number"
            value={formData.score}
            onChange={(e) => setFormData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Next Action Date</label>
          <input
            type="date"
            value={formData.next_action_date}
            onChange={(e) => setFormData(prev => ({ ...prev, next_action_date: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Next Action</label>
        <textarea
          value={formData.next_action}
          onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2"
          rows={3}
          placeholder="Describe the next action to take for this deal..."
        />
      </div>
    </div>
  );
}

function ArrayFieldEditor({ title, items, newValue, setNewValue, onAdd, onRemove, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{title}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder={placeholder}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item: string, index: number) => (
          <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
            <span className="text-sm">{item}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}