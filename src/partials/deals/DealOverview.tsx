import React from 'react';
import { Deal } from '../../types/deal';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  User, 
  UserCheck, 
  Globe, 
  Package,
  Star,
  Clock,
  Target,
  ShoppingCart,
  Percent,
  CheckCircle,
  FileText,
  Activity,
  Users
} from 'lucide-react';
import BusinessValuation from '../../components/BusinessValuation';
import { formatCurrency, formatPercentage } from '../../utils/dealMetrics';

interface DealOverviewProps {
  deal: Deal;
}

function DealOverview({ deal }: DealOverviewProps) {

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      prospecting: 'bg-gray-100 text-gray-800',
      initial_contact: 'bg-blue-100 text-blue-800',
      loi_submitted: 'bg-yellow-100 text-yellow-800',
      due_diligence: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      under_contract: 'bg-indigo-100 text-indigo-800',
      closing: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asking Price</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(deal.asking_price)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Multiple</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {deal.valuation_multiple ? `${deal.valuation_multiple.toFixed(1)}x` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ASINs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Array.isArray(deal.asin_list) ? deal.asin_list.length : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {deal.priority ? `P${deal.priority}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Valuation */}
      <BusinessValuation deal={deal} />

      {/* Business Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Business Details</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Business Name</p>
                <p className="text-gray-900 dark:text-gray-100">{deal.business_name}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                  {deal.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date Listed</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(deal.date_listed)}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Business Age</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {deal.business_age ? `${Math.floor(deal.business_age / 12)} years` : 'N/A'}
                </p>
              </div>
            </div>

            {deal.industry && (
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Industry</p>
                  <p className="text-gray-900 dark:text-gray-100">{deal.industry}</p>
                  {deal.sub_industry && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deal.sub_industry}</p>
                  )}
                </div>
              </div>
            )}

            {(deal.city || deal.state) && (
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {[deal.city, deal.state, deal.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {deal.amazon_category && (
              <div className="flex items-center">
                <Package className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amazon Category</p>
                  <p className="text-gray-900 dark:text-gray-100">{deal.amazon_category}</p>
                  {deal.amazon_subcategory && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deal.amazon_subcategory}</p>
                  )}
                </div>
              </div>
            )}

            {deal.fba_percentage && (
              <div className="flex items-center">
                <Star className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">FBA Percentage</p>
                  <p className="text-gray-900 dark:text-gray-100">{deal.fba_percentage}%</p>
                </div>
              </div>
            )}

            {deal.employee_count && (
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Employees</p>
                  <p className="text-gray-900 dark:text-gray-100">{deal.employee_count}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>
          <div className="space-y-4">
            {deal.seller_name && (
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seller</p>
                  <p className="text-gray-900 dark:text-gray-100">{deal.seller_name}</p>
                  {deal.seller_email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deal.seller_email}</p>
                  )}
                  {deal.seller_phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deal.seller_phone}</p>
                  )}
                </div>
              </div>
            )}

            {deal.broker_name && (
              <div className="flex items-center">
                <UserCheck className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Broker</p>
                  <p className="text-gray-900 dark:text-gray-100">{deal.broker_name}</p>
                  {deal.broker_company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deal.broker_company}</p>
                  )}
                  {deal.broker_email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deal.broker_email}</p>
                  )}
                </div>
              </div>
            )}

            {deal.website_url && (
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Website</p>
                  <a 
                    href={deal.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {deal.website_url}
                  </a>
                </div>
              </div>
            )}

            {deal.amazon_store_url && (
              <div className="flex items-center">
                <Package className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amazon Store</p>
                  <a 
                    href={deal.amazon_store_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {deal.amazon_store_name || 'View Store'}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {deal.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notes</h3>
          <p className="text-gray-700 dark:text-gray-300">{deal.notes}</p>
        </div>
      )}

      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {deal.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empire Flippers Metrics Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Financial Metrics */}
          {(deal.ttm_revenue || deal.avg_monthly_revenue || deal.profit_margin) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Financial Performance</h4>
              {deal.ttm_revenue && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">TTM Revenue:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(deal.ttm_revenue)}</span>
                </div>
              )}
              {deal.ttm_profit && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">TTM Profit:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(deal.ttm_profit)}</span>
                </div>
              )}
              {deal.avg_monthly_revenue && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Monthly Revenue:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(deal.avg_monthly_revenue)}</span>
                </div>
              )}
              {deal.profit_margin && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPercentage(deal.profit_margin)}</span>
                </div>
              )}
              {deal.cogs_percentage && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">COGS %:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPercentage(deal.cogs_percentage)}</span>
                </div>
              )}
            </div>
          )}

          {/* Amazon Metrics */}
          {(deal.sku_count || deal.acos || deal.tacos || deal.brand_registry !== undefined) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amazon Metrics</h4>
              {deal.sku_count && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SKU Count:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.sku_count}</span>
                </div>
              )}
              {deal.parent_asin_count && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Parent ASINs:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.parent_asin_count}</span>
                </div>
              )}
              {deal.brand_registry !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Brand Registry:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.brand_registry ? 'Yes' : 'No'}</span>
                </div>
              )}
              {deal.acos && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ACoS:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPercentage(deal.acos)}</span>
                </div>
              )}
              {deal.tacos && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">TACoS:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPercentage(deal.tacos)}</span>
                </div>
              )}
              {deal.avg_retail_price && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Retail Price:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(deal.avg_retail_price)}</span>
                </div>
              )}
            </div>
          )}

          {/* Operations & Transfer */}
          {(deal.hours_per_week || deal.owner_involvement || deal.transfer_period_days) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Operations</h4>
              {deal.hours_per_week && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hours/Week:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.hours_per_week}</span>
                </div>
              )}
              {deal.owner_involvement && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Owner Involvement:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.owner_involvement}</span>
                </div>
              )}
              {deal.growth_trend && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Growth Trend:</span>
                  <span className={`text-sm font-medium ${
                    deal.growth_trend === 'increasing' ? 'text-green-600 dark:text-green-400' :
                    deal.growth_trend === 'declining' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {deal.growth_trend?.charAt(0).toUpperCase() + deal.growth_trend?.slice(1)}
                  </span>
                </div>
              )}
              {deal.transfer_period_days && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transfer Period:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.transfer_period_days} days</span>
                </div>
              )}
              {deal.training_included !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Training Included:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.training_included ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assets & Verification Section */}
      {(deal.assets_included || deal.verified_revenue !== undefined) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Assets & Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verification Status */}
            {(deal.verified_revenue !== undefined || deal.verified_profit !== undefined) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Verification Status</h4>
                <div className="space-y-2">
                  {deal.verified_revenue !== undefined && (
                    <div className="flex items-center">
                      <CheckCircle className={`w-4 h-4 mr-2 ${deal.verified_revenue ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Verified</span>
                    </div>
                  )}
                  {deal.verified_profit !== undefined && (
                    <div className="flex items-center">
                      <CheckCircle className={`w-4 h-4 mr-2 ${deal.verified_profit ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Profit Verified</span>
                    </div>
                  )}
                  {deal.verification_date && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Verified on: {formatDate(deal.verification_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assets Included */}
            {deal.assets_included && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Assets Included</h4>
                <div className="space-y-2">
                  {Object.entries(deal.assets_included).map(([key, value]) => {
                    if (key === 'other' && Array.isArray(value) && value.length > 0) {
                      return (
                        <div key={key} className="space-y-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Other Assets:</span>
                          {value.map((item, idx) => (
                            <div key={idx} className="flex items-center ml-4">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (typeof value === 'boolean' && value) {
                      return (
                        <div key={key} className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DealOverview;