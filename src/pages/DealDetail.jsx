import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../partials/Header';
import Footer from '../partials/Footer';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Package,
  Star,
  Users,
  Globe,
  Loader2,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Brain,
  Database,
  BarChart3
} from 'lucide-react';
import { dealsAdapter } from '../lib/database-adapter';
import { auth } from '../lib/firebase';
import DealTasks from '../partials/deals/DealTasks';
import DealFiles from '../partials/deals/DealFiles';
import DealAnalysis from '../partials/deals/DealAnalysis';
import DealFinancials from '../partials/deals/DealFinancials';
import BusinessDetailsEditor from '../components/BusinessDetailsEditor';
import { BusinessDataExtractor } from '../services/BusinessDataExtractor';

function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    loadDeal();
  }, [id]);
  
  const loadDeal = async () => {
    try {
      setIsLoading(true);
      const result = await dealsAdapter.getDeal(id);
      
      if (result.error) {
        throw result.error;
      }
      
      setDeal(result.data);
    } catch (error) {
      console.error('Error loading deal:', error);
      showError('Failed to load deal details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusChange = async (newStatus) => {
    try {
      const result = await dealsAdapter.updateDeal(id, { status: newStatus });
      
      if (result.error) {
        throw result.error;
      }
      
      setDeal({ ...deal, status: newStatus });
      showSuccess(`Deal status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update deal status');
    }
  };
  
  const calculateCompleteness = (dealData) => {
    let totalPoints = 0;
    let earnedPoints = 0;

    // Helper function to check if a field has meaningful data
    const hasValue = (value) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number') return value > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    };

    // Helper to check complex objects
    const hasComplexValue = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      return Object.values(obj).some(v => hasValue(v));
    };

    // Critical Business Info (30 points total - these are essential)
    const criticalFields = {
      'business_name': 5,
      'asking_price': 5,
      'annual_revenue': 5,
      'annual_profit': 5,
      'industry': 3,
      'location': 3,
      'description': 4
    };
    
    Object.entries(criticalFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Financial Details (25 points)
    const financialFields = {
      'monthly_revenue': 2,
      'monthly_profit': 2,
      'ebitda': 3,
      'sde': 3,
      'gross_margin': 3,
      'valuation_multiple': 2,
      'inventory_value': 2,
      'customer_acquisition_cost': 2,
      'customer_lifetime_value': 2,
      'monthly_burn_rate': 1,
      'cash_on_hand': 1,
      'accounts_receivable': 1,
      'total_debt': 1
    };
    
    Object.entries(financialFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Business Identity & Digital Presence (15 points)
    const digitalFields = {
      'website_url': 3,
      'brand_name': 2,
      'domain_authority': 1,
      'founding_year': 1,
      'year_established': 1,
      'legal_entity_type': 1,
      'ein_tax_id': 1
    };
    
    Object.entries(digitalFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Social Media & Online Presence (5 points)
    totalPoints += 5;
    if (hasComplexValue(dealData.social_media)) {
      const socialCount = Object.values(dealData.social_media || {}).filter(hasValue).length;
      earnedPoints += Math.min(5, socialCount); // Cap at 5 points
    }

    // Online Reviews (5 points)
    totalPoints += 5;
    if (hasComplexValue(dealData.online_reviews)) {
      earnedPoints += 5;
    }

    // Operations & Team (15 points)
    const operationsFields = {
      'employee_count': 3,
      'contractors_count': 1,
      'revenue_model': 2,
      'support_training': 1,
      'reason_for_sale': 2,
      'seller_financing_available': 1,
      'seller_involvement_required': 1
    };
    
    Object.entries(operationsFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Arrays - check if populated (4 points each, 20 total)
    const arrayFields = [
      'marketing_channels',
      'sales_channels',
      'physical_locations',
      'key_assets',
      'technology_stack'
    ];
    
    arrayFields.forEach(field => {
      totalPoints += 4;
      if (Array.isArray(dealData[field]) && dealData[field].length > 0) {
        earnedPoints += 4;
      }
    });

    // Complex Objects (5 points each, 15 total)
    const complexFields = [
      'key_employees',
      'competitors',
      'licenses_permits'
    ];
    
    complexFields.forEach(field => {
      totalPoints += 5;
      if (Array.isArray(dealData[field]) && dealData[field].length > 0) {
        earnedPoints += 5;
      }
    });

    // Customer Metrics (10 points)
    const customerFields = {
      'total_customers': 2,
      'customer_retention_rate': 2,
      'customer_churn_rate': 1,
      'net_promoter_score': 1,
      'average_order_value': 1,
      'purchase_frequency': 1,
      'monthly_active_users': 1,
      'customer_satisfaction_score': 1
    };
    
    Object.entries(customerFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Market Analysis (10 points)
    const marketFields = {
      'market_size': 2,
      'market_growth_rate': 2,
      'market_share': 2,
      'total_addressable_market': 2,
      'serviceable_addressable_market': 1,
      'serviceable_obtainable_market': 1
    };
    
    Object.entries(marketFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Legal & Compliance (5 points)
    const legalFields = {
      'intellectual_property': 2,
      'pending_litigation': 1,
      'compliance_issues': 2
    };
    
    Object.entries(legalFields).forEach(([field, points]) => {
      totalPoints += points;
      if (hasValue(dealData[field])) earnedPoints += points;
    });

    // Calculate percentage (total should be ~150 points)
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    
    // Apply a more realistic curve - most deals will have 5-30% completion
    // unless they're really well documented
    if (percentage > 80) return percentage; // Exceptional documentation
    if (percentage > 60) return Math.round(percentage * 0.8); // Very good
    if (percentage > 40) return Math.round(percentage * 0.6); // Good
    if (percentage > 20) return Math.round(percentage * 0.4); // Basic
    return Math.round(percentage * 0.3); // Minimal
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return;
    }
    
    try {
      // In a real app, you'd implement the delete function in database-adapter
      showSuccess('Deal deleted successfully');
      navigate('/deals');
    } catch (error) {
      console.error('Error deleting deal:', error);
      showError('Failed to delete deal');
    }
  };
  
  const formatCurrency = (amount) => {
    if (!amount) return 'TBD';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };
  
  const formatMultiple = (multiple) => {
    return multiple ? `${multiple.toFixed(1)}x` : 'TBD';
  };
  
  const getStatusColor = (status) => {
    const colors = {
      prospecting: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      initial_contact: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      analysis: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      loi_submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      due_diligence: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      under_contract: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      closing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed_won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed_lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      on_hold: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status] || colors.prospecting;
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      prospecting: 'Prospecting',
      initial_contact: 'Initial Contact',
      analysis: 'Analysis',
      loi_submitted: 'LOI Submitted',
      due_diligence: 'Due Diligence',
      negotiation: 'Negotiation',
      under_contract: 'Under Contract',
      closing: 'Closing',
      closed_won: 'Closed Won',
      closed_lost: 'Closed Lost',
      on_hold: 'On Hold'
    };
    return labels[status] || status;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <Header />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-stone-100 mb-2">
                    Loading deal details...
                  </h3>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!deal) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <Header />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Deal not found
                </h3>
                <p className="text-gray-600 dark:text-stone-400 mb-4">
                  The deal you're looking for doesn't exist or has been removed.
                </p>
                <button 
                  onClick={() => navigate('/deals')}
                  className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Back to Pipeline
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <Header />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/deals')}
                    className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-stone-100 font-bold">
                      {deal.business_name}
                    </h1>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(deal.status)}`}>
                        {getStatusLabel(deal.status)}
                      </span>
                      {deal.priority && deal.priority >= 4 && (
                        <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {deal.listing_url && (
                    <a
                      href={deal.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-stone-700 dark:text-stone-200"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Listing
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-stone-700 mb-8">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: Building2 },
                  { id: 'financials', label: 'Financials', icon: BarChart3 },
                  { id: 'details', label: 'Business Details', icon: Database },
                  { id: 'analysis', label: 'AI Analysis', icon: Brain },
                  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
                  { id: 'documents', label: 'Documents', icon: FileText },
                  { id: 'notes', label: 'Notes', icon: Edit }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                        ${activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-stone-400 dark:hover:text-stone-200'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Data Completeness Alert */}
                  {(() => {
                    const completeness = calculateCompleteness(deal);
                    const isLow = completeness < 40;
                    const isMedium = completeness >= 40 && completeness < 70;
                    const isHigh = completeness >= 70;
                    
                    return (
                      <div className={`rounded-lg p-4 border ${
                        isHigh ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                        isMedium ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                        'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Database className={`h-5 w-5 ${
                              isHigh ? 'text-green-600' :
                              isMedium ? 'text-yellow-600' :
                              'text-orange-600'
                            }`} />
                            <div>
                              <h3 className={`font-medium ${
                                isHigh ? 'text-green-900 dark:text-green-100' :
                                isMedium ? 'text-yellow-900 dark:text-yellow-100' :
                                'text-orange-900 dark:text-orange-100'
                              }`}>
                                Data Completeness: {completeness}%
                              </h3>
                              <p className={`text-sm mt-1 ${
                                isHigh ? 'text-green-700 dark:text-green-300' :
                                isMedium ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-orange-700 dark:text-orange-300'
                              }`}>
                                {isHigh ? 'Excellent data quality for AI analysis' :
                                 isMedium ? 'Good data, but adding more details will improve analysis' :
                                 'Limited data available - add more details for better insights'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('details')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              isHigh ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-200' :
                              isMedium ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-200' :
                              'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-800 dark:text-orange-200'
                            }`}
                          >
                            {isHigh ? 'View Details' : 'Add Details'}
                          </button>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isHigh ? 'bg-green-500' :
                                isMedium ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${completeness}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Key Metrics */}
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-6">Key Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                        <div className="flex items-center text-green-700 dark:text-green-300 mb-2">
                          <DollarSign className="w-5 h-5 mr-2" />
                          <span className="font-medium">Asking Price</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {formatCurrency(deal.asking_price)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
                        <div className="flex items-center text-blue-700 dark:text-blue-300 mb-2">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          <span className="font-medium">Multiple</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {formatMultiple(deal.valuation_multiple || deal.multiple)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                        <div className="flex items-center text-purple-700 dark:text-purple-300 mb-2">
                          <DollarSign className="w-5 h-5 mr-2" />
                          <span className="font-medium">Annual Revenue</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {formatCurrency(deal.annual_revenue)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4">
                        <div className="flex items-center text-orange-700 dark:text-orange-300 mb-2">
                          <DollarSign className="w-5 h-5 mr-2" />
                          <span className="font-medium">Annual Profit</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {formatCurrency(deal.annual_profit)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Business Details */}
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-6">Business Details</h2>
                    <div className="space-y-4">
                      {deal.description && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400 mb-2">Description</h3>
                          <p className="text-gray-900 dark:text-stone-100">{deal.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        {deal.industry && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">Industry</h3>
                            <p className="text-gray-900 dark:text-stone-100">{deal.industry}</p>
                          </div>
                        )}
                        
                        {deal.business_age_years && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">Business Age</h3>
                            <p className="text-gray-900 dark:text-stone-100">{deal.business_age_years} years</p>
                          </div>
                        )}
                        
                        {deal.employee_count && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">Employees</h3>
                            <p className="text-gray-900 dark:text-stone-100">{deal.employee_count}</p>
                          </div>
                        )}
                        
                        {(deal.city || deal.state) && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-stone-400">Location</h3>
                            <p className="text-gray-900 dark:text-stone-100">
                              {[deal.city, deal.state].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="space-y-8">
                  
                  {/* Status Change */}
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">Update Status</h3>
                    <select
                      value={deal.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full rounded-md border-gray-300 dark:border-stone-600 dark:bg-stone-700"
                    >
                      <option value="prospecting">Prospecting</option>
                      <option value="initial_contact">Initial Contact</option>
                      <option value="analysis">Analysis</option>
                      <option value="loi_submitted">LOI Submitted</option>
                      <option value="due_diligence">Due Diligence</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="under_contract">Under Contract</option>
                      <option value="closing">Closing</option>
                      <option value="closed_won">Closed Won</option>
                      <option value="closed_lost">Closed Lost</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  
                  {/* Contact Information */}
                  {(deal.seller_name || deal.broker_name) && (
                    <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">Contacts</h3>
                      <div className="space-y-3">
                        {deal.seller_name && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-stone-400">Seller</p>
                            <p className="text-gray-900 dark:text-stone-100">{deal.seller_name}</p>
                            {deal.seller_email && (
                              <p className="text-sm text-gray-600 dark:text-stone-400">{deal.seller_email}</p>
                            )}
                          </div>
                        )}
                        
                        {deal.broker_name && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-stone-400">Broker</p>
                            <p className="text-gray-900 dark:text-stone-100">{deal.broker_name}</p>
                            {deal.broker_company && (
                              <p className="text-sm text-gray-600 dark:text-stone-400">{deal.broker_company}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Important Dates */}
                  <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-stone-100 mb-4">Timeline</h3>
                    <div className="space-y-3">
                      {deal.date_listed && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-stone-400">Listed</p>
                          <p className="text-gray-900 dark:text-stone-100">
                            {new Date(deal.date_listed).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {deal.first_contact_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-stone-400">First Contact</p>
                          <p className="text-gray-900 dark:text-stone-100">
                            {new Date(deal.first_contact_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {deal.loi_submitted_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-stone-400">LOI Submitted</p>
                          <p className="text-gray-900 dark:text-stone-100">
                            {new Date(deal.loi_submitted_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'financials' && deal && (
              <DealFinancials deal={deal} />
            )}
            
            {activeTab === 'details' && deal && (
              <BusinessDetailsEditor 
                deal={deal}
                onUpdate={async (updates) => {
                  try {
                    const result = await dealsAdapter.updateDeal(id, updates);
                    if (result.error) throw result.error;
                    setDeal({...deal, ...updates});
                    showSuccess('Business details updated successfully');
                  } catch (error) {
                    console.error('Error updating business details:', error);
                    showError('Failed to update business details');
                  }
                }}
                onAIExtract={async (request) => {
                  try {
                    const extractor = new BusinessDataExtractor();
                    // Use the new extract method that handles both website and documents
                    // The request already includes progress_callback from BusinessDetailsEditor
                    const result = await extractor.extract(request);
                    if (result.success) {
                      const updateResult = await dealsAdapter.updateDeal(id, result.extracted_fields);
                      if (updateResult.error) throw updateResult.error;
                      setDeal({...deal, ...result.extracted_fields});
                      const source = request.website_url ? 'website' : 'documents';
                      showSuccess(`Extracted ${Object.keys(result.extracted_fields).length} fields from ${source}`);
                      if (result.warnings && result.warnings.length > 0) {
                        console.warn('AI extraction warnings:', result.warnings);
                      }
                    } else {
                      throw new Error(result.errors?.join(', ') || 'AI extraction failed');
                    }
                  } catch (error) {
                    console.error('Error with AI extraction:', error);
                    showError('Failed to extract data with AI');
                  }
                }}
              />
            )}
            
            {activeTab === 'analysis' && deal && (
              <DealAnalysis deal={deal} />
            )}
            
            {activeTab === 'tasks' && (
              <DealTasks dealId={id} />
            )}
            
            {activeTab === 'documents' && (
              <DealFiles dealId={id} />
            )}
            
            {activeTab === 'notes' && (
              <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-6">Notes</h2>
                <textarea
                  className="w-full h-64 rounded-md border-gray-300 dark:border-stone-600 dark:bg-stone-700"
                  placeholder="Add your notes here..."
                  value={deal.notes || ''}
                  onChange={(e) => {
                    // In a real app, you'd save this to the database
                    setDeal({ ...deal, notes: e.target.value });
                  }}
                />
              </div>
            )}
            
            {/* Delete Deal Section - Bottom of Page */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-stone-700">
              <div className="flex justify-center">
                <button
                  onClick={handleDelete}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Deal
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default DealDetail;