import React from 'react';
import { Building2, Package, DollarSign, TrendingUp, Edit2, Trash2, ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  amazon_store_url?: string;
  total_asins: number;
  total_monthly_revenue: number;
  total_monthly_profit: number;
  avg_profit_margin: number;
}

interface BrandCardProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (brandId: string) => void;
  onClick: (brandId: string) => void;
  isSelected?: boolean;
}

function BrandCard({ brand, onEdit, onDelete, onClick, isSelected = false }: BrandCardProps) {
  const navigate = useNavigate();
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(brand);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the brand "${brand.name}"? This will not delete the ASINs.`)) {
      onDelete(brand.id);
    }
  };
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/brand/${brand.id}`);
  };

  return (
    <div
      onClick={() => onClick(brand.id)}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all cursor-pointer
        ${isSelected 
          ? 'border-indigo-500 shadow-lg transform scale-[1.02]' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
      `}
    >
      <div className="p-6">
        {/* Header with logo and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {brand.logo_url ? (
              <img 
                src={brand.logo_url} 
                alt={brand.name} 
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {brand.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleViewDetails}
              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit brand"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Delete brand"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ASINs</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {brand.total_asins}
                </p>
              </div>
              <Package className="w-5 h-5 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(brand.total_monthly_revenue)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(brand.total_monthly_profit)}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Margin</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {brand.avg_profit_margin.toFixed(1)}%
                </p>
              </div>
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold text-orange-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        {(brand.website_url || brand.amazon_store_url) && (
          <div className="flex items-center space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {brand.website_url && (
              <a
                href={brand.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Website
              </a>
            )}
            {brand.amazon_store_url && (
              <a
                href={brand.amazon_store_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Amazon Store
              </a>
            )}
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-b-lg" />
      )}
    </div>
  );
}

export default BrandCard;