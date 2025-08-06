import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Deal } from '../../types/deal';
import { Building2, DollarSign, TrendingUp, Package, Calendar, User, UserCheck, GripVertical, Edit3, Trash2, Save, X, ImageIcon } from 'lucide-react';
import { getFallbackImage } from '../../utils/imageUtils';

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  onEdit?: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDelete?: (dealId: string) => Promise<void>;
}

function DealCard({ deal, isDragging = false, onEdit, onDelete }: DealCardProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedDeal, setEditedDeal] = useState(deal);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 1: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatMultiple = (multiple?: number) => {
    if (!multiple) return 'N/A';
    return `${multiple.toFixed(1)}x`;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate when dragging, editing, or if clicked on action buttons
    if (sortableDragging || isDragging || isEditing) {
      return;
    }
    
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle') || target.closest('.action-button')) {
      e.stopPropagation();
      return;
    }
    
    navigate(`/deal/${deal.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (onEdit) {
      try {
        await onEdit(deal.id, {
          business_name: editedDeal.business_name,
          asking_price: editedDeal.asking_price,
          annual_revenue: editedDeal.annual_revenue,
          annual_profit: editedDeal.annual_profit,
          valuation_multiple: editedDeal.valuation_multiple,
          priority: editedDeal.priority,
          notes: editedDeal.notes
        });
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving deal:', error);
        alert('Failed to save deal. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setEditedDeal(deal);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await onDelete(deal.id);
      } catch (error) {
        console.error('Error deleting deal:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleFieldChange = (field: keyof Deal, value: any) => {
    setEditedDeal(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 
        hover:shadow-md transition-shadow duration-200 relative
        ${isDragging || sortableDragging ? 'shadow-lg rotate-2' : ''}
        ${isEditing ? 'border-blue-500 shadow-lg' : 'cursor-pointer'}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="action-button p-1 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600"
              title="Save changes"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="action-button p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-600"
              title="Cancel editing"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="action-button p-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 border border-blue-300"
                title="Edit deal"
                style={{ zIndex: 50 }}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="action-button p-1 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                title="Delete deal"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div
              {...attributes}
              {...listeners}
              className="drag-handle p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              title="Drag to move"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          </>
        )}
      </div>


      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-12">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editedDeal.business_name}
              onChange={(e) => handleFieldChange('business_name', e.target.value)}
              className="w-full text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
              placeholder="Business name"
            />
          ) : (
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {deal.business_name}
            </h4>
          )}
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Building2 className="w-3 h-3 mr-1" />
            <span className="truncate">{deal.amazon_category || 'Unknown Category'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <select
              value={editedDeal.priority || ''}
              onChange={(e) => handleFieldChange('priority', parseInt(e.target.value) || undefined)}
              className="text-xs bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-1 py-0.5"
            >
              <option value="">No Priority</option>
              <option value="1">P1</option>
              <option value="2">P2</option>
              <option value="3">P3</option>
              <option value="4">P4</option>
              <option value="5">P5</option>
            </select>
          ) : (
            deal.priority && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(deal.priority)}`}>
                P{deal.priority}
              </span>
            )
          )}
        </div>
      </div>

      {/* Product Image */}
      <div className="mb-3">
        {deal.image_url ? (
          <img
            src={deal.image_url}
            alt={deal.business_name}
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getFallbackImage();
            }}
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-3 h-3 mr-1" />
            <span>Asking Price</span>
          </div>
          {isEditing ? (
            <input
              type="number"
              value={editedDeal.asking_price || ''}
              onChange={(e) => handleFieldChange('asking_price', parseFloat(e.target.value) || undefined)}
              className="w-full text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
              placeholder="0"
            />
          ) : (
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(deal.asking_price)}
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Multiple</span>
          </div>
          {isEditing ? (
            <input
              type="number"
              step="0.1"
              value={editedDeal.valuation_multiple || ''}
              onChange={(e) => handleFieldChange('valuation_multiple', parseFloat(e.target.value) || undefined)}
              className="w-full text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
              placeholder="0.0"
            />
          ) : (
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatMultiple(deal.valuation_multiple)}
            </div>
          )}
        </div>
      </div>

      {/* Revenue & Profit */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded p-2 mb-3">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400">Revenue</span>
          {isEditing ? (
            <input
              type="number"
              value={editedDeal.annual_revenue || ''}
              onChange={(e) => handleFieldChange('annual_revenue', parseFloat(e.target.value) || undefined)}
              className="w-16 text-xs font-medium bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
              placeholder="0"
            />
          ) : (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(deal.annual_revenue)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 dark:text-gray-400">Profit</span>
          {isEditing ? (
            <input
              type="number"
              value={editedDeal.annual_profit || ''}
              onChange={(e) => handleFieldChange('annual_profit', parseFloat(e.target.value) || undefined)}
              className="w-16 text-xs font-medium bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
              placeholder="0"
            />
          ) : (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(deal.annual_profit)}
            </span>
          )}
        </div>
      </div>

      {/* Amazon Metrics */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center">
          <Package className="w-3 h-3 mr-1" />
          <span>{Array.isArray(deal.asin_list) ? deal.asin_list.length : 0} ASINs</span>
        </div>
        {deal.fba_percentage && (
          <div className="flex items-center">
            <span className="text-orange-600 dark:text-orange-400">{deal.fba_percentage}% FBA</span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
        {deal.seller_name && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
            <User className="w-3 h-3 mr-1" />
            <span className="truncate">{deal.seller_name}</span>
          </div>
        )}
        {deal.broker_name && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
            <UserCheck className="w-3 h-3 mr-1" />
            <span className="truncate">{deal.broker_name}</span>
            {deal.broker_company && (
              <span className="ml-1 text-gray-500">({deal.broker_company})</span>
            )}
          </div>
        )}
        {deal.created_at && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Added {new Date(deal.created_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DealCard;