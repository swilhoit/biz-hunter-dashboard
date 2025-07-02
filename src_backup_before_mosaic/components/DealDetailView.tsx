import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  CheckSquare,
  BarChart3,
  Users,
  AlertTriangle,
  Target,
  Clock,
  Tag,
  ExternalLink,
  Share,
  MoreVertical,
  Save,
  X
} from 'lucide-react';
import DealDocumentRepository from './DealDocumentRepository';
import DealTimeline from './DealTimeline';
import DueDiligenceChecklist from './DueDiligenceChecklist';
import FinancialAnalysis from './FinancialAnalysis';
import CommunicationHub from './CommunicationHub';
import WorkflowAutomation from './WorkflowAutomation';

interface Deal {
  id: string;
  business_name: string;
  dba_names: string[];
  entity_type: string;
  asking_price: number;
  list_price: number;
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
  on_or_off_market: string;
  listing_url: string;
  website_url: string;
  amazon_category: string;
  amazon_store_link: string;
  monthly_sessions: number;
  conversion_rate: number;
  asin_list: any[];
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
  stage_updated_at: string;
  assigned_to: string;
  priority: string;
  score: number;
  status: string;
  substatus: string;
  next_action: string;
  next_action_date: string;
  created_by: string;
  team_id: string;
  tags: string[];
  custom_fields: any;
  created_at: string;
  updated_at: string;
}

interface DealDetailViewProps {
  dealId: string;
  onBack: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'financials', label: 'Financials', icon: BarChart3 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'due_diligence', label: 'Due Diligence', icon: CheckSquare },
  { id: 'workflow', label: 'Workflow', icon: Target },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'risks', label: 'Risks', icon: AlertTriangle },
  { id: 'timeline', label: 'Timeline', icon: Clock }
];

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

export default function DealDetailView({ dealId, onBack }: DealDetailViewProps) {
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<Partial<Deal>>({});

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) throw error;
      setDeal(data);
      setEditedDeal(data);
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDeal = async () => {
    try {
      const { error } = await supabase
        .from('deals')
        .update(editedDeal)
        .eq('id', dealId);

      if (error) throw error;

      setDeal({ ...deal, ...editedDeal } as Deal);
      setEditing(false);

      // Log activity
      await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          user_id: user?.id,
          activity_type: 'note',
          title: 'Deal updated',
          description: 'Deal information was updated'
        });
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Deal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{deal.business_name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPriorityColor(deal.priority)}`}>
                  {deal.priority}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600 capitalize">{deal.stage.replace('_', ' ')}</span>
                <span className="text-gray-500">•</span>
                <div className="flex items-center gap-1">
                  <Star className={`w-4 h-4 ${getScoreColor(deal.score)}`} />
                  <span className={`font-medium ${getScoreColor(deal.score)}`}>
                    {deal.score}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={saveDeal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Share className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Asking Price</div>
            <div className="text-xl font-semibold">{formatCurrency(deal.asking_price)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Annual Revenue</div>
            <div className="text-xl font-semibold">{formatCurrency(deal.annual_revenue)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">EBITDA</div>
            <div className="text-xl font-semibold">{formatCurrency(deal.ebitda)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Multiple</div>
            <div className="text-xl font-semibold">{deal.multiple}x</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8 px-6">
          {TABS.map(tab => (
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

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab deal={deal} editing={editing} editedDeal={editedDeal} setEditedDeal={setEditedDeal} />
        )}
        {activeTab === 'financials' && (
          <FinancialAnalysis 
            dealId={dealId} 
            dealName={deal.business_name}
            currentAskingPrice={deal.asking_price}
            currentRevenue={deal.annual_revenue}
            currentEbitda={deal.ebitda}
          />
        )}
        {activeTab === 'documents' && (
          <DealDocumentRepository dealId={dealId} dealName={deal.business_name} />
        )}
        {activeTab === 'communications' && (
          <CommunicationHub 
            dealId={dealId} 
            dealName={deal.business_name}
            brokerEmail={deal.broker_email}
            brokerPhone={deal.broker_phone}
            brokerName={deal.broker_name}
          />
        )}
        {activeTab === 'due_diligence' && (
          <DueDiligenceChecklist dealId={dealId} dealName={deal.business_name} />
        )}
        {activeTab === 'workflow' && (
          <WorkflowAutomation dealId={dealId} />
        )}
        {activeTab === 'team' && (
          <TeamTab dealId={dealId} />
        )}
        {activeTab === 'risks' && (
          <RisksTab dealId={dealId} />
        )}
        {activeTab === 'timeline' && (
          <DealTimeline dealId={dealId} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ 
  deal, 
  editing, 
  editedDeal, 
  setEditedDeal 
}: { 
  deal: Deal; 
  editing: boolean; 
  editedDeal: Partial<Deal>; 
  setEditedDeal: (deal: Partial<Deal>) => void; 
}) {
  return (
    <div className="p-6 space-y-8">
      {/* Business Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedDeal.business_name || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, business_name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-900">{deal.business_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedDeal.industry || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, industry: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-900">{deal.industry}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Age</label>
                <p className="text-gray-900">{deal.business_age} years</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                <p className="text-gray-900">{deal.employee_count} employees</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h4>
            <p className="text-gray-600">{deal.city}, {deal.state}, {deal.country}</p>
          </div>

          {/* Online Presence */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Online Presence
            </h4>
            <div className="space-y-2">
              {deal.website_url && (
                <a
                  href={deal.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              )}
              {deal.amazon_store_link && (
                <a
                  href={deal.amazon_store_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  Amazon Store
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span>{deal.broker_name}</span>
              </div>
              {deal.broker_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${deal.broker_email}`} className="text-blue-600 hover:text-blue-800">
                    {deal.broker_email}
                  </a>
                </div>
              )}
              {deal.broker_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${deal.broker_phone}`} className="text-blue-600 hover:text-blue-800">
                    {deal.broker_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pipeline Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                {editing ? (
                  <select
                    value={editedDeal.stage || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, stage: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {STAGES.map(stage => (
                      <option key={stage} value={stage}>
                        {stage.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{deal.stage.replace('_', ' ')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                {editing ? (
                  <select
                    value={editedDeal.priority || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, priority: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {PRIORITIES.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{deal.priority}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
                {editing ? (
                  <textarea
                    value={editedDeal.next_action || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, next_action: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-900">{deal.next_action}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {deal.tags?.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function FinancialsTab({ dealId }: { dealId: string }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Financial Analysis</h3>
      <p className="text-gray-600">Financial data and analysis tools will be implemented here.</p>
    </div>
  );
}


function DueDiligenceTab({ dealId }: { dealId: string }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Due Diligence</h3>
      <p className="text-gray-600">Due diligence checklist and tracking will be implemented here.</p>
    </div>
  );
}

function TeamTab({ dealId }: { dealId: string }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Team Collaboration</h3>
      <p className="text-gray-600">Team member management and collaboration tools will be implemented here.</p>
    </div>
  );
}

function RisksTab({ dealId }: { dealId: string }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
      <p className="text-gray-600">Risk identification and mitigation tracking will be implemented here.</p>
    </div>
  );
}