import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Building2, DollarSign, TrendingUp, Package, Calendar, User, UserCheck, GripVertical } from 'lucide-react';

function DealCard({ deal, isDragging = false }) {
  const navigate = useNavigate();
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 1: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatMultiple = (multiple) => {
    if (!multiple) return 'N/A';
    return `${multiple.toFixed(1)}x`;
  };

  const handleClick = (e) => {
    // Don't navigate when dragging or if clicked on drag handle
    if (sortableDragging || isDragging) return;
    
    const target = e.target;
    if (target.closest('.drag-handle')) {
      e.stopPropagation();
      return;
    }
    
    navigate(`/deals/${deal.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 cursor-pointer
        hover:shadow-md transition-shadow duration-200 relative
        ${isDragging || sortableDragging ? 'shadow-lg rotate-2' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {deal.business_name}
          </h4>
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Building2 className="w-3 h-3 mr-1" />
            <span className="truncate">{deal.amazon_category || 'Unknown Category'}</span>
          </div>
        </div>
        {deal.priority && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(deal.priority)}`}>
            P{deal.priority}
          </span>
        )}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-3 h-3 mr-1" />
            <span>Asking Price</span>
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.asking_price)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Multiple</span>
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatMultiple(deal.valuation_multiple)}
          </div>
        </div>
      </div>

      {/* Revenue & Profit */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded p-2 mb-3">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400">Revenue</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.annual_revenue)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 dark:text-gray-400">Profit</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(deal.annual_profit)}
          </span>
        </div>
      </div>

      {/* Amazon Metrics */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center">
          <Package className="w-3 h-3 mr-1" />
          <span>{deal.asins_count || 0} ASINs</span>
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
        {deal.date_listed && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Listed {new Date(deal.date_listed).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DealCard;