import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Deal } from '../types/deal';

interface DealEditModalProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Deal>) => Promise<void>;
}

function DealEditModal({ deal, isOpen, onClose, onSave }: DealEditModalProps) {
  console.log('DealEditModal rendered, isOpen:', isOpen, 'deal:', deal);
  
  // Early return if no deal
  if (!deal) {
    console.error('DealEditModal: No deal provided!');
    return null;
  }
  
  // Initialize state with empty values if deal is not provided
  const [editedDeal, setEditedDeal] = useState<Partial<Deal>>({
    business_name: deal?.business_name || '',
    asking_price: deal?.asking_price || 0,
    annual_revenue: deal?.annual_revenue || 0,
    annual_profit: deal?.annual_profit || 0,
    valuation_multiple: deal?.valuation_multiple || 0,
    priority: deal?.priority || 1,
    status: deal?.status || 'prospecting',
    amazon_category: deal?.amazon_category || '',
    seller_name: deal?.seller_name || '',
    seller_email: deal?.seller_email || '',
    seller_phone: deal?.seller_phone || '',
    broker_name: deal?.broker_name || '',
    broker_company: deal?.broker_company || '',
    broker_email: deal?.broker_email || '',
    website_url: deal?.website_url || '',
    amazon_store_url: deal?.amazon_store_url || '',
    amazon_store_name: deal?.amazon_store_name || '',
    fba_percentage: deal?.fba_percentage || 0,
    notes: deal?.notes || '',
    tags: deal?.tags || []
  });
  const [saving, setSaving] = useState(false);

  // Update state when deal prop changes
  useEffect(() => {
    if (deal && isOpen) {
      setEditedDeal({
        business_name: deal.business_name || '',
        asking_price: deal.asking_price || 0,
        annual_revenue: deal.annual_revenue || 0,
        annual_profit: deal.annual_profit || 0,
        valuation_multiple: deal.valuation_multiple || 0,
        priority: deal.priority || 1,
        status: deal.status || 'prospecting',
        amazon_category: deal.amazon_category || '',
        seller_name: deal.seller_name || '',
        seller_email: deal.seller_email || '',
        seller_phone: deal.seller_phone || '',
        broker_name: deal.broker_name || '',
        broker_company: deal.broker_company || '',
        broker_email: deal.broker_email || '',
        website_url: deal.website_url || '',
        amazon_store_url: deal.amazon_store_url || '',
        amazon_store_name: deal.amazon_store_name || '',
        fba_percentage: deal.fba_percentage || 0,
        notes: deal.notes || '',
        tags: deal.tags || []
      });
    }
  }, [deal, isOpen]);

  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Modal is open, rendering content');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(editedDeal);
      onClose();
    } catch (error) {
      console.error('Failed to save deal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Deal, value: any) => {
    setEditedDeal(prev => ({ ...prev, [field]: value }));
  };

  // Test with a simple modal first
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Deal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={editedDeal.business_name || ''}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className="form-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={editedDeal.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="form-input w-full"
              >
                <option value="prospecting">Prospecting</option>
                <option value="initial_contact">Initial Contact</option>
                <option value="loi_submitted">LOI Submitted</option>
                <option value="due_diligence">Due Diligence</option>
                <option value="negotiation">Negotiation</option>
                <option value="under_contract">Under Contract</option>
                <option value="closing">Closing</option>
              </select>
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asking Price
              </label>
              <input
                type="number"
                value={editedDeal.asking_price || ''}
                onChange={(e) => handleChange('asking_price', parseFloat(e.target.value))}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Annual Revenue
              </label>
              <input
                type="number"
                value={editedDeal.annual_revenue || ''}
                onChange={(e) => handleChange('annual_revenue', parseFloat(e.target.value))}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Annual Profit
              </label>
              <input
                type="number"
                value={editedDeal.annual_profit || ''}
                onChange={(e) => handleChange('annual_profit', parseFloat(e.target.value))}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valuation Multiple
              </label>
              <input
                type="number"
                step="0.1"
                value={editedDeal.valuation_multiple || ''}
                onChange={(e) => handleChange('valuation_multiple', parseFloat(e.target.value))}
                className="form-input w-full"
              />
            </div>
          </div>

          {/* Amazon Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amazon Category
              </label>
              <input
                type="text"
                value={editedDeal.amazon_category || ''}
                onChange={(e) => handleChange('amazon_category', e.target.value)}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                FBA Percentage
              </label>
              <input
                type="number"
                value={editedDeal.fba_percentage || ''}
                onChange={(e) => handleChange('fba_percentage', parseInt(e.target.value))}
                className="form-input w-full"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Seller Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={editedDeal.seller_name || ''}
                  onChange={(e) => handleChange('seller_name', e.target.value)}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seller Email
                </label>
                <input
                  type="email"
                  value={editedDeal.seller_email || ''}
                  onChange={(e) => handleChange('seller_email', e.target.value)}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seller Phone
                </label>
                <input
                  type="tel"
                  value={editedDeal.seller_phone || ''}
                  onChange={(e) => handleChange('seller_phone', e.target.value)}
                  className="form-input w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Broker Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Broker Name
                </label>
                <input
                  type="text"
                  value={editedDeal.broker_name || ''}
                  onChange={(e) => handleChange('broker_name', e.target.value)}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Broker Company
                </label>
                <input
                  type="text"
                  value={editedDeal.broker_company || ''}
                  onChange={(e) => handleChange('broker_company', e.target.value)}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Broker Email
                </label>
                <input
                  type="email"
                  value={editedDeal.broker_email || ''}
                  onChange={(e) => handleChange('broker_email', e.target.value)}
                  className="form-input w-full"
                />
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={editedDeal.website_url || ''}
                onChange={(e) => handleChange('website_url', e.target.value)}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amazon Store URL
              </label>
              <input
                type="url"
                value={editedDeal.amazon_store_url || ''}
                onChange={(e) => handleChange('amazon_store_url', e.target.value)}
                className="form-input w-full"
              />
            </div>
          </div>

          {/* Priority and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={editedDeal.priority || ''}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                className="form-input w-full"
              >
                <option value="">No Priority</option>
                <option value="1">P1 - Low</option>
                <option value="2">P2 - Medium</option>
                <option value="3">P3 - High</option>
                <option value="4">P4 - Very High</option>
                <option value="5">P5 - Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editedDeal.tags?.join(', ') || ''}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                className="form-input w-full"
                placeholder="amazon, fba, high-margin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={editedDeal.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="form-input w-full"
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DealEditModal;