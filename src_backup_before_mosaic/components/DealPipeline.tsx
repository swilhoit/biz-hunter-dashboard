import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { 
  ChevronRight, 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  AlertCircle,
  Search,
  Filter,
  Plus,
  MoreVertical,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import DealForm from './DealForm';

interface Deal {
  id: string;
  business_name: string;
  asking_price: number;
  annual_revenue: number;
  multiple: number;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  score: number;
  next_action: string;
  next_action_date: string;
  stage_updated_at: string;
  industry: string;
  source: string;
  created_at: string;
}

interface StageColumn {
  id: string;
  title: string;
  deals: Deal[];
  color: string;
  value: number;
  count: number;
}

const PIPELINE_STAGES = [
  { id: 'prospecting', title: 'Prospecting', color: 'bg-gray-500' },
  { id: 'qualified_leads', title: 'Qualified Leads', color: 'bg-blue-500' },
  { id: 'first_contact', title: 'First Contact', color: 'bg-indigo-500' },
  { id: 'due_diligence', title: 'Due Diligence', color: 'bg-purple-500' },
  { id: 'loi', title: 'LOI', color: 'bg-pink-500' },
  { id: 'under_contract', title: 'Under Contract', color: 'bg-orange-500' },
  { id: 'closed_won', title: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed_lost', title: 'Closed Lost', color: 'bg-red-500' }
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function DealPipeline() {
  const { user } = useAuth();
  const [stages, setStages] = useState<StageColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showDealForm, setShowDealForm] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user, searchTerm, filterIndustry, filterPriority]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deals')
        .select('*')
        .order('score', { ascending: false });

      if (searchTerm) {
        query = query.ilike('business_name', `%${searchTerm}%`);
      }
      if (filterIndustry) {
        query = query.eq('industry', filterIndustry);
      }
      if (filterPriority) {
        query = query.eq('priority', filterPriority);
      }

      const { data: deals, error } = await query;

      if (error) throw error;

      // Organize deals by stage
      const stageColumns: StageColumn[] = PIPELINE_STAGES.map(stage => {
        const stageDeals = deals?.filter(deal => deal.stage === stage.id) || [];
        const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.asking_price || 0), 0);
        
        return {
          id: stage.id,
          title: stage.title,
          deals: stageDeals,
          color: stage.color,
          value: totalValue,
          count: stageDeals.length
        };
      });

      setStages(stageColumns);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same stage
      return;
    }

    // Update deal stage
    const { error } = await supabase
      .from('deals')
      .update({ 
        stage: destination.droppableId,
        stage_updated_at: new Date().toISOString()
      })
      .eq('id', draggableId);

    if (error) {
      console.error('Error updating deal stage:', error);
      return;
    }

    // Record activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: draggableId,
        user_id: user?.id,
        activity_type: 'stage_change',
        title: `Stage changed from ${source.droppableId} to ${destination.droppableId}`,
        description: `Deal moved from ${source.droppableId} to ${destination.droppableId}`
      });

    // Update local state
    const newStages = [...stages];
    const sourceStage = newStages.find(s => s.id === source.droppableId);
    const destStage = newStages.find(s => s.id === destination.droppableId);
    
    if (sourceStage && destStage) {
      const deal = sourceStage.deals.find(d => d.id === draggableId);
      if (deal) {
        sourceStage.deals = sourceStage.deals.filter(d => d.id !== draggableId);
        deal.stage = destination.droppableId;
        destStage.deals.push(deal);
        setStages(newStages);
      }
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

  const getDaysInStage = (stageUpdatedAt: string) => {
    const days = Math.floor((Date.now() - new Date(stageUpdatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Deal Pipeline</h1>
          <button 
            onClick={() => setShowDealForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Industries</option>
            <option value="ecommerce">E-commerce</option>
            <option value="saas">SaaS</option>
            <option value="services">Services</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Pipeline Metrics */}
        <div className="flex gap-4 mt-4">
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Total Pipeline Value:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(stages.reduce((sum, stage) => sum + stage.value, 0))}
            </span>
          </div>
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Total Deals:</span>
            <span className="ml-2 font-semibold">
              {stages.reduce((sum, stage) => sum + stage.count, 0)}
            </span>
          </div>
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Avg Deal Size:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                stages.reduce((sum, stage) => sum + stage.value, 0) / 
                Math.max(stages.reduce((sum, stage) => sum + stage.count, 0), 1)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-4 min-w-max h-full">
            {stages.map((stage) => (
              <div key={stage.id} className="w-80 flex flex-col bg-gray-50 rounded-lg">
                {/* Stage Header */}
                <div className={`p-4 rounded-t-lg text-white ${stage.color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{stage.title}</h3>
                      <div className="mt-1 text-sm opacity-90">
                        {stage.count} deals · {formatCurrency(stage.value)}
                      </div>
                    </div>
                    <button className="p-1 hover:bg-white/20 rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Deals List */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 overflow-y-auto ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {stage.deals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
                                {/* Deal Header */}
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900 line-clamp-1">
                                    {deal.business_name}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`text-lg font-bold ${getScoreColor(deal.score)}`}>
                                      {deal.score}
                                    </div>
                                    <Star className={`w-4 h-4 ${getScoreColor(deal.score)}`} />
                                  </div>
                                </div>

                                {/* Deal Details */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Asking Price:</span>
                                    <span className="font-medium">{formatCurrency(deal.asking_price)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Revenue:</span>
                                    <span className="font-medium">{formatCurrency(deal.annual_revenue)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Multiple:</span>
                                    <span className="font-medium">{deal.multiple}x</span>
                                  </div>
                                </div>

                                {/* Tags */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[deal.priority]}`}>
                                    {deal.priority}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    {deal.industry}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    {deal.source}
                                  </span>
                                </div>

                                {/* Next Action */}
                                {deal.next_action && (
                                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                                    <div className="flex items-center gap-1 text-yellow-800">
                                      <AlertCircle className="w-3 h-3" />
                                      <span className="font-medium">Next Action:</span>
                                    </div>
                                    <div className="mt-1 text-yellow-700">{deal.next_action}</div>
                                    {deal.next_action_date && (
                                      <div className="mt-1 text-yellow-600">
                                        Due: {format(new Date(deal.next_action_date), 'MMM d')}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Time in Stage */}
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{getDaysInStage(deal.stage_updated_at)}d in stage</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>You</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Deal Form Modal */}
      <DealForm
        dealId={editingDealId}
        isOpen={showDealForm}
        onClose={() => {
          setShowDealForm(false);
          setEditingDealId(undefined);
        }}
        onSave={() => {
          fetchDeals();
          setShowDealForm(false);
          setEditingDealId(undefined);
        }}
      />
    </div>
  );
}