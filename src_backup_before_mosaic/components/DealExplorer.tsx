import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  Grid,
  List,
  Star,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  User,
  Eye,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Bookmark,
  Share,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Target,
  Tag,
  ExternalLink
} from 'lucide-react';
import AdvancedSearch from './AdvancedSearch';
import DealDetailView from './DealDetailView';

interface Deal {
  id: string;
  business_name: string;
  asking_price: number;
  annual_revenue: number;
  ebitda: number;
  multiple: number;
  stage: string;
  priority: string;
  score: number;
  industry: string;
  sub_industry: string;
  source: string;
  broker_name: string;
  broker_email: string;
  city: string;
  state: string;
  country: string;
  business_age: number;
  employee_count: number;
  website_url: string;
  listing_url: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface DealExplorerProps {
  onDealSelect?: (dealId: string) => void;
  showFilters?: boolean;
  embedded?: boolean;
}

const SORT_OPTIONS = [
  { value: 'score-desc', label: 'Score (High to Low)', field: 'score', order: 'desc' },
  { value: 'score-asc', label: 'Score (Low to High)', field: 'score', order: 'asc' },
  { value: 'price-desc', label: 'Price (High to Low)', field: 'asking_price', order: 'desc' },
  { value: 'price-asc', label: 'Price (Low to High)', field: 'asking_price', order: 'asc' },
  { value: 'revenue-desc', label: 'Revenue (High to Low)', field: 'annual_revenue', order: 'desc' },
  { value: 'revenue-asc', label: 'Revenue (Low to High)', field: 'annual_revenue', order: 'asc' },
  { value: 'multiple-asc', label: 'Multiple (Low to High)', field: 'multiple', order: 'asc' },
  { value: 'multiple-desc', label: 'Multiple (High to Low)', field: 'multiple', order: 'desc' },
  { value: 'created-desc', label: 'Newest First', field: 'created_at', order: 'desc' },
  { value: 'created-asc', label: 'Oldest First', field: 'created_at', order: 'asc' },
  { value: 'updated-desc', label: 'Recently Updated', field: 'updated_at', order: 'desc' }
];

const VIEW_MODES = [
  { value: 'grid', icon: Grid, label: 'Grid View' },
  { value: 'list', icon: List, label: 'List View' }
];

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

export default function DealExplorer({ 
  onDealSelect, 
  showFilters = true, 
  embedded = false 
}: DealExplorerProps) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('score-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Deal[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (!isSearchActive) {
      fetchDeals();
    }
  }, [sortBy, isSearchActive]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const sortOption = SORT_OPTIONS.find(opt => opt.value === sortBy);
      if (!sortOption) return;

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order(sortOption.field, { ascending: sortOption.order === 'asc' });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (results: Deal[]) => {
    setSearchResults(results);
    setIsSearchActive(results.length > 0);
    setCurrentPage(1);
  };

  const handleDealClick = (dealId: string) => {
    if (embedded && onDealSelect) {
      onDealSelect(dealId);
    } else {
      setSelectedDeal(dealId);
    }
  };

  const displayDeals = isSearchActive ? searchResults : deals;
  const totalItems = displayDeals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDeals = displayDeals.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedDeal) {
    return (
      <DealDetailView
        dealId={selectedDeal}
        onBack={() => setSelectedDeal(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      {!embedded && (
        <div className="bg-white border-b p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Deal Explorer</h1>
              <p className="text-gray-600">
                {isSearchActive 
                  ? `${searchResults.length} search results`
                  : `Browse and filter ${deals.length} deals`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 ${
                  showAdvancedSearch ? 'border-blue-500 text-blue-600' : ''
                }`}
              >
                <Search className="w-4 h-4" />
                Advanced Search
              </button>
            </div>
          </div>

          {/* Advanced Search */}
          {showAdvancedSearch && (
            <div className="mb-6">
              <AdvancedSearch
                onResults={handleSearchResults}
                onFiltersChange={() => {}}
              />
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value as 'grid' | 'list')}
                  className={`p-2 flex items-center gap-2 ${
                    viewMode === mode.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={mode.label}
                >
                  <mode.icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Items per page */}
            <div className="flex items-center gap-2 text-sm">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(count => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} deals
          </div>
        </div>
      </div>

      {/* Deal Grid/List */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentDeals.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deals Found</h3>
            <p className="text-gray-600">
              {isSearchActive 
                ? 'Try adjusting your search filters to find more deals.'
                : 'No deals available at the moment.'
              }
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentDeals.map(deal => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClick={() => handleDealClick(deal.id)}
                    formatCurrency={formatCurrency}
                    getScoreColor={getScoreColor}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentDeals.map(deal => (
                  <DealListItem
                    key={deal.id}
                    deal={deal}
                    onClick={() => handleDealClick(deal.id)}
                    formatCurrency={formatCurrency}
                    getScoreColor={getScoreColor}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DealCard({ 
  deal, 
  onClick, 
  formatCurrency, 
  getScoreColor, 
  getPriorityColor 
}: {
  deal: Deal;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  getScoreColor: (score: number) => string;
  getPriorityColor: (priority: string) => string;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {deal.business_name}
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(deal.score)}`}>
            {deal.score}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-3 h-3" />
          <span className="capitalize">{deal.industry}</span>
          <span>•</span>
          <MapPin className="w-3 h-3" />
          <span>{deal.city}, {deal.state}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Asking Price</span>
            <span className="font-semibold">{formatCurrency(deal.asking_price)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Revenue</span>
            <span className="font-semibold">{formatCurrency(deal.annual_revenue)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Multiple</span>
            <span className="font-semibold">{deal.multiple}x</span>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
            {deal.priority}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            {deal.stage.replace('_', ' ')}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            {deal.source}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{deal.broker_name}</span>
          </div>
          <span>{format(new Date(deal.created_at), 'MMM d')}</span>
        </div>
      </div>
    </div>
  );
}

function DealListItem({ 
  deal, 
  onClick, 
  formatCurrency, 
  getScoreColor, 
  getPriorityColor 
}: {
  deal: Deal;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  getScoreColor: (score: number) => string;
  getPriorityColor: (priority: string) => string;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border hover:shadow-sm transition-shadow cursor-pointer p-6"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg text-gray-900">
              {deal.business_name}
            </h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(deal.score)}`}>
              {deal.score}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
              {deal.priority}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span className="capitalize">{deal.industry}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{deal.city}, {deal.state}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{deal.broker_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(deal.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {deal.stage.replace('_', ' ')}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {deal.source}
            </span>
            {deal.tags && deal.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {tag}
              </span>
            ))}
            {deal.tags && deal.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                +{deal.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-8 text-right">
          <div>
            <div className="text-sm text-gray-600">Asking Price</div>
            <div className="font-semibold text-lg">{formatCurrency(deal.asking_price)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Revenue</div>
            <div className="font-semibold text-lg">{formatCurrency(deal.annual_revenue)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Multiple</div>
            <div className="font-semibold text-lg">{deal.multiple}x</div>
          </div>
        </div>
      </div>
    </div>
  );
}