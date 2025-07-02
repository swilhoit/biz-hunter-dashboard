import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Download,
  Save,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Building2,
  Tag,
  User,
  Target,
  RotateCcw,
  BookmarkPlus
} from 'lucide-react';

interface SearchFilters {
  query: string;
  stage: string[];
  priority: string[];
  score_range: [number, number];
  asking_price_range: [number, number];
  revenue_range: [number, number];
  multiple_range: [number, number];
  business_age_range: [number, number];
  employee_count_range: [number, number];
  industry: string[];
  sub_industry: string[];
  source: string[];
  country: string[];
  state: string[];
  city: string[];
  broker_name: string;
  tags: string[];
  date_created_range: [string, string];
  date_updated_range: [string, string];
  assigned_to: string[];
  next_action_overdue: boolean;
  has_documents: boolean;
  has_communications: boolean;
  custom_fields: Record<string, any>;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  is_default: boolean;
  created_at: string;
}

interface AdvancedSearchProps {
  onResults: (results: any[]) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  stage: [],
  priority: [],
  score_range: [0, 100],
  asking_price_range: [0, 10000000],
  revenue_range: [0, 10000000],
  multiple_range: [0, 20],
  business_age_range: [0, 50],
  employee_count_range: [0, 1000],
  industry: [],
  sub_industry: [],
  source: [],
  country: [],
  state: [],
  city: [],
  broker_name: '',
  tags: [],
  date_created_range: ['', ''],
  date_updated_range: ['', ''],
  assigned_to: [],
  next_action_overdue: false,
  has_documents: false,
  has_communications: false,
  custom_fields: {}
};

const STAGES = [
  'prospecting',
  'qualified_leads',
  'first_contact',
  'due_diligence',
  'loi',
  'under_contract',
  'closed_won',
  'closed_lost'
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const INDUSTRIES = [
  'ecommerce',
  'saas',
  'services',
  'manufacturing',
  'retail',
  'healthcare',
  'finance',
  'technology',
  'real_estate',
  'hospitality',
  'education',
  'food_beverage',
  'automotive',
  'other'
];

const SOURCES = [
  'bizbuysell',
  'bizquest',
  'quietlight',
  'empireflippers',
  'flippa',
  'exitadviser',
  'direct',
  'referral',
  'broker',
  'other'
];

export default function AdvancedSearch({ 
  onResults, 
  onFiltersChange, 
  initialFilters = {} 
}: AdvancedSearchProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [availableOptions, setAvailableOptions] = useState({
    brokers: [],
    countries: [],
    states: [],
    cities: [],
    tags: [],
    users: []
  });

  useEffect(() => {
    fetchSavedSearches();
    fetchAvailableOptions();
  }, []);

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const fetchSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const fetchAvailableOptions = async () => {
    try {
      // Get unique values for filter dropdowns
      const [brokersRes, locationsRes, tagsRes, usersRes] = await Promise.all([
        supabase.from('deals').select('broker_name').not('broker_name', 'is', null),
        supabase.from('deals').select('country, state, city').not('country', 'is', null),
        supabase.from('deals').select('tags').not('tags', 'is', null),
        supabase.from('auth.users').select('id, email')
      ]);

      const brokers = [...new Set(brokersRes.data?.map(d => d.broker_name).filter(Boolean))];
      const countries = [...new Set(locationsRes.data?.map(d => d.country).filter(Boolean))];
      const states = [...new Set(locationsRes.data?.map(d => d.state).filter(Boolean))];
      const cities = [...new Set(locationsRes.data?.map(d => d.city).filter(Boolean))];
      const allTags = locationsRes.data?.flatMap(d => d.tags || []) || [];
      const tags = [...new Set(allTags)];

      setAvailableOptions({
        brokers: brokers.sort(),
        countries: countries.sort(),
        states: states.sort(),
        cities: cities.sort(),
        tags: tags.sort(),
        users: usersRes.data || []
      });
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const buildSearchQuery = () => {
    let query = supabase
      .from('deals')
      .select(`
        *,
        deal_documents(count),
        deal_communications(count)
      `);

    // Text search
    if (filters.query) {
      query = query.or(`business_name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,broker_name.ilike.%${filters.query}%`);
    }

    // Stage filter
    if (filters.stage.length > 0) {
      query = query.in('stage', filters.stage);
    }

    // Priority filter
    if (filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }

    // Score range
    if (filters.score_range[0] > 0 || filters.score_range[1] < 100) {
      query = query.gte('score', filters.score_range[0]).lte('score', filters.score_range[1]);
    }

    // Price ranges
    if (filters.asking_price_range[0] > 0 || filters.asking_price_range[1] < 10000000) {
      query = query.gte('asking_price', filters.asking_price_range[0]).lte('asking_price', filters.asking_price_range[1]);
    }

    if (filters.revenue_range[0] > 0 || filters.revenue_range[1] < 10000000) {
      query = query.gte('annual_revenue', filters.revenue_range[0]).lte('annual_revenue', filters.revenue_range[1]);
    }

    if (filters.multiple_range[0] > 0 || filters.multiple_range[1] < 20) {
      query = query.gte('multiple', filters.multiple_range[0]).lte('multiple', filters.multiple_range[1]);
    }

    // Business characteristics
    if (filters.business_age_range[0] > 0 || filters.business_age_range[1] < 50) {
      query = query.gte('business_age', filters.business_age_range[0]).lte('business_age', filters.business_age_range[1]);
    }

    if (filters.employee_count_range[0] > 0 || filters.employee_count_range[1] < 1000) {
      query = query.gte('employee_count', filters.employee_count_range[0]).lte('employee_count', filters.employee_count_range[1]);
    }

    // Industry filters
    if (filters.industry.length > 0) {
      query = query.in('industry', filters.industry);
    }

    if (filters.sub_industry.length > 0) {
      query = query.in('sub_industry', filters.sub_industry);
    }

    // Source filter
    if (filters.source.length > 0) {
      query = query.in('source', filters.source);
    }

    // Location filters
    if (filters.country.length > 0) {
      query = query.in('country', filters.country);
    }

    if (filters.state.length > 0) {
      query = query.in('state', filters.state);
    }

    if (filters.city.length > 0) {
      query = query.in('city', filters.city);
    }

    // Broker filter
    if (filters.broker_name) {
      query = query.ilike('broker_name', `%${filters.broker_name}%`);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Date ranges
    if (filters.date_created_range[0]) {
      query = query.gte('created_at', filters.date_created_range[0]);
    }
    if (filters.date_created_range[1]) {
      query = query.lte('created_at', filters.date_created_range[1]);
    }

    if (filters.date_updated_range[0]) {
      query = query.gte('updated_at', filters.date_updated_range[0]);
    }
    if (filters.date_updated_range[1]) {
      query = query.lte('updated_at', filters.date_updated_range[1]);
    }

    // Assignment filter
    if (filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to);
    }

    // Overdue next action
    if (filters.next_action_overdue) {
      query = query.lt('next_action_date', new Date().toISOString().split('T')[0]);
    }

    return query;
  };

  const executeSearch = async () => {
    setLoading(true);
    try {
      const query = buildSearchQuery();
      const { data, error } = await query;

      if (error) throw error;

      // Apply client-side filters for complex conditions
      let results = data || [];

      // Filter by documents/communications
      if (filters.has_documents) {
        results = results.filter(deal => deal.deal_documents?.[0]?.count > 0);
      }

      if (filters.has_communications) {
        results = results.filter(deal => deal.deal_communications?.[0]?.count > 0);
      }

      setSearchResults(results);
      onResults(results);
    } catch (error) {
      console.error('Error executing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const saveSearch = async (name: string, isDefault = false) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          name,
          filters,
          is_default: isDefault,
          created_by: user?.id
        });

      if (error) throw error;
      fetchSavedSearches();
      setShowSaveModal(false);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
  };

  const exportResults = () => {
    const csvContent = searchResults.map(deal => ({
      business_name: deal.business_name,
      asking_price: deal.asking_price,
      annual_revenue: deal.annual_revenue,
      stage: deal.stage,
      priority: deal.priority,
      score: deal.score,
      industry: deal.industry,
      source: deal.source,
      broker_name: deal.broker_name,
      created_at: deal.created_at
    }));

    const csv = [
      Object.keys(csvContent[0] || {}).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal_search_results_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.stage.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.score_range[0] > 0 || filters.score_range[1] < 100) count++;
    if (filters.asking_price_range[0] > 0 || filters.asking_price_range[1] < 10000000) count++;
    if (filters.revenue_range[0] > 0 || filters.revenue_range[1] < 10000000) count++;
    if (filters.industry.length > 0) count++;
    if (filters.source.length > 0) count++;
    if (filters.country.length > 0) count++;
    if (filters.broker_name) count++;
    if (filters.tags.length > 0) count++;
    if (filters.next_action_overdue) count++;
    if (filters.has_documents) count++;
    if (filters.has_communications) count++;
    return count;
  };

  return (
    <div className="bg-white border rounded-lg">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search deals by name, description, or broker..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 ${
              getActiveFilterCount() > 0 ? 'border-blue-500 text-blue-600' : ''
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs">
                {getActiveFilterCount()}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={executeSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1">
            <span className="text-sm text-gray-600">
              {searchResults.length > 0 && `${searchResults.length} results found`}
            </span>
          </div>
          
          {savedSearches.length > 0 && (
            <select
              onChange={(e) => {
                const search = savedSearches.find(s => s.id === e.target.value);
                if (search) loadSavedSearch(search);
              }}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="">Load Saved Search...</option>
              {savedSearches.map(search => (
                <option key={search.id} value={search.id}>
                  {search.name}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => setShowSaveModal(true)}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
          >
            <BookmarkPlus className="w-3 h-3" />
            Save Search
          </button>
          
          <button
            onClick={resetFilters}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          
          {searchResults.length > 0 && (
            <button
              onClick={exportResults}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Deal Stage & Priority */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Deal Status</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2">Stage</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {STAGES.map(stage => (
                    <label key={stage} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.stage.includes(stage)}
                        onChange={() => toggleArrayFilter('stage', stage)}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm capitalize">{stage.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <div className="space-y-1">
                  {PRIORITIES.map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={() => toggleArrayFilter('priority', priority)}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Financial Metrics</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Deal Score: {filters.score_range[0]} - {filters.score_range[1]}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.score_range[0]}
                    onChange={(e) => updateFilter('score_range', [parseInt(e.target.value), filters.score_range[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.score_range[1]}
                    onChange={(e) => updateFilter('score_range', [filters.score_range[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Asking Price: ${filters.asking_price_range[0].toLocaleString()} - ${filters.asking_price_range[1].toLocaleString()}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.asking_price_range[0]}
                    onChange={(e) => updateFilter('asking_price_range', [parseInt(e.target.value) || 0, filters.asking_price_range[1]])}
                    className="w-24 px-2 py-1 border rounded text-sm"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.asking_price_range[1]}
                    onChange={(e) => updateFilter('asking_price_range', [filters.asking_price_range[0], parseInt(e.target.value) || 10000000])}
                    className="w-24 px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Annual Revenue: ${filters.revenue_range[0].toLocaleString()} - ${filters.revenue_range[1].toLocaleString()}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.revenue_range[0]}
                    onChange={(e) => updateFilter('revenue_range', [parseInt(e.target.value) || 0, filters.revenue_range[1]])}
                    className="w-24 px-2 py-1 border rounded text-sm"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.revenue_range[1]}
                    onChange={(e) => updateFilter('revenue_range', [filters.revenue_range[0], parseInt(e.target.value) || 10000000])}
                    className="w-24 px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Business Details</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {INDUSTRIES.map(industry => (
                    <label key={industry} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.industry.includes(industry)}
                        onChange={() => toggleArrayFilter('industry', industry)}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm capitalize">{industry.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Source</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {SOURCES.map(source => (
                    <label key={source} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.source.includes(source)}
                        onChange={() => toggleArrayFilter('source', source)}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm capitalize">{source}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <select
                  multiple
                  value={filters.country}
                  onChange={(e) => updateFilter('country', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full border rounded px-3 py-2 text-sm"
                  size={4}
                >
                  {availableOptions.countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Broker Name</label>
                <input
                  type="text"
                  value={filters.broker_name}
                  onChange={(e) => updateFilter('broker_name', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Search broker..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date Created</label>
                <div className="space-y-1">
                  <input
                    type="date"
                    value={filters.date_created_range[0]}
                    onChange={(e) => updateFilter('date_created_range', [e.target.value, filters.date_created_range[1]])}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={filters.date_created_range[1]}
                    onChange={(e) => updateFilter('date_created_range', [filters.date_created_range[0], e.target.value])}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.next_action_overdue}
                    onChange={(e) => updateFilter('next_action_overdue', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  <span className="text-sm">Overdue next action</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.has_documents}
                    onChange={(e) => updateFilter('has_documents', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  <span className="text-sm">Has documents</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.has_communications}
                    onChange={(e) => updateFilter('has_communications', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  <span className="text-sm">Has communications</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <SaveSearchModal
          onSave={saveSearch}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

function SaveSearchModal({ 
  onSave, 
  onClose 
}: {
  onSave: (name: string, isDefault: boolean) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), isDefault);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Save Search</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter search name..."
              autoFocus
            />
          </div>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 mr-2"
            />
            <span className="text-sm">Set as default search</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Save Search
          </button>
        </div>
      </div>
    </div>
  );
}