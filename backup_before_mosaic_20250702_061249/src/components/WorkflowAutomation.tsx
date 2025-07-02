import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import {
  Zap,
  Calendar,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  ArrowRight,
  Target,
  Bell,
  Filter,
  Search,
  RefreshCw,
  Settings
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger_stage: string;
  tasks: WorkflowTask[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  task_type: 'email' | 'call' | 'meeting' | 'document' | 'research' | 'followup';
  due_days_offset: number;
  assigned_to?: string;
  dependencies: string[];
  template_data?: any;
  order_index: number;
}

interface ActiveTask {
  id: string;
  deal_id: string;
  workflow_template_id: string;
  task_title: string;
  task_description: string;
  task_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assigned_to: string;
  due_date: string;
  completed_date?: string;
  created_at: string;
}

interface WorkflowAutomationProps {
  dealId?: string;
}

const WORKFLOW_TEMPLATES = [
  {
    name: 'New Deal Onboarding',
    description: 'Standard workflow for new deals entering the pipeline',
    trigger_stage: 'prospecting',
    tasks: [
      {
        title: 'Send initial inquiry email',
        description: 'Send first contact email to broker using template',
        task_type: 'email',
        due_days_offset: 0,
        order_index: 1
      },
      {
        title: 'Research business online',
        description: 'Research company website, social media, and online presence',
        task_type: 'research',
        due_days_offset: 1,
        order_index: 2
      },
      {
        title: 'Schedule initial call',
        description: 'Schedule discovery call with broker or seller',
        task_type: 'call',
        due_days_offset: 2,
        order_index: 3
      }
    ]
  },
  {
    name: 'Due Diligence Process',
    description: 'Comprehensive due diligence workflow',
    trigger_stage: 'due_diligence',
    tasks: [
      {
        title: 'Request financial documents',
        description: 'Request P&L, tax returns, and bank statements',
        task_type: 'email',
        due_days_offset: 0,
        order_index: 1
      },
      {
        title: 'Review financial documentation',
        description: 'Analyze provided financial documents',
        task_type: 'document',
        due_days_offset: 7,
        order_index: 2
      },
      {
        title: 'Conduct management interview',
        description: 'Interview key management personnel',
        task_type: 'meeting',
        due_days_offset: 10,
        order_index: 3
      },
      {
        title: 'Site visit',
        description: 'Visit business location if applicable',
        task_type: 'meeting',
        due_days_offset: 14,
        order_index: 4
      }
    ]
  },
  {
    name: 'LOI Submission',
    description: 'Letter of Intent preparation and submission',
    trigger_stage: 'loi',
    tasks: [
      {
        title: 'Prepare LOI document',
        description: 'Draft letter of intent with terms',
        task_type: 'document',
        due_days_offset: 0,
        order_index: 1
      },
      {
        title: 'Internal review',
        description: 'Review LOI with team and advisors',
        task_type: 'meeting',
        due_days_offset: 2,
        order_index: 2
      },
      {
        title: 'Submit LOI',
        description: 'Submit signed LOI to broker',
        task_type: 'email',
        due_days_offset: 3,
        order_index: 3
      }
    ]
  }
];

const TASK_TYPES = {
  email: { label: 'Email', icon: Calendar, color: 'text-blue-600' },
  call: { label: 'Phone Call', icon: User, color: 'text-green-600' },
  meeting: { label: 'Meeting', icon: Calendar, color: 'text-purple-600' },
  document: { label: 'Document', icon: CheckCircle, color: 'text-orange-600' },
  research: { label: 'Research', icon: Target, color: 'text-indigo-600' },
  followup: { label: 'Follow-up', icon: RefreshCw, color: 'text-pink-600' }
};

export default function WorkflowAutomation({ dealId }: WorkflowAutomationProps) {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWorkflows();
    fetchActiveTasks();
  }, [dealId]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchActiveTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('workflow_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActiveTasks(data || []);
    } catch (error) {
      console.error('Error fetching active tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeStandardWorkflows = async () => {
    try {
      const workflowInserts = WORKFLOW_TEMPLATES.map(template => ({
        name: template.name,
        description: template.description,
        trigger_stage: template.trigger_stage,
        tasks: template.tasks,
        is_active: true,
        created_by: user?.id
      }));

      const { error } = await supabase
        .from('workflow_templates')
        .insert(workflowInserts);

      if (error) throw error;
      fetchWorkflows();
    } catch (error) {
      console.error('Error initializing workflows:', error);
    }
  };

  const triggerWorkflow = async (workflowId: string, targetDealId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const taskInserts = workflow.tasks.map(task => ({
        deal_id: targetDealId,
        workflow_template_id: workflowId,
        task_title: task.title,
        task_description: task.description,
        task_type: task.task_type,
        assigned_to: task.assigned_to || user?.id,
        due_date: addDays(new Date(), task.due_days_offset).toISOString().split('T')[0],
        status: 'pending'
      }));

      const { error } = await supabase
        .from('workflow_tasks')
        .insert(taskInserts);

      if (error) throw error;
      
      // Log activity
      await supabase
        .from('deal_activities')
        .insert({
          deal_id: targetDealId,
          user_id: user?.id,
          activity_type: 'workflow',
          title: `Workflow triggered: ${workflow.name}`,
          description: `Automated workflow "${workflow.name}" started with ${workflow.tasks.length} tasks`
        });

      fetchActiveTasks();
    } catch (error) {
      console.error('Error triggering workflow:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: ActiveTask['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('workflow_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      fetchActiveTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTaskPriorityColor = (dueDate: string, status: string) => {
    if (status === 'completed') return 'text-green-600';
    
    const due = new Date(dueDate);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (isBefore(due, today)) return 'text-red-600'; // Overdue
    if (isBefore(due, tomorrow)) return 'text-orange-600'; // Due today
    return 'text-gray-600'; // Future
  };

  const filteredTasks = activeTasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterType !== 'all' && task.task_type !== filterType) return false;
    if (searchTerm && !task.task_title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.task_description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTaskStats = () => {
    const total = activeTasks.length;
    const completed = activeTasks.filter(t => t.status === 'completed').length;
    const pending = activeTasks.filter(t => t.status === 'pending').length;
    const overdue = activeTasks.filter(t => 
      t.status !== 'completed' && isBefore(new Date(t.due_date), new Date())
    ).length;
    
    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'tasks', label: 'Active Tasks', icon: CheckCircle },
    { id: 'workflows', label: 'Workflows', icon: Zap },
    { id: 'automation', label: 'Automation', icon: Settings }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Workflow Automation</h2>
            <p className="text-gray-600">Automated tasks and deal workflows</p>
          </div>
          <div className="flex items-center gap-2">
            {workflows.length === 0 ? (
              <button
                onClick={initializeStandardWorkflows}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Initialize Standard Workflows
              </button>
            ) : (
              <button
                onClick={() => setShowCreateWorkflow(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Workflow
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-semibold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={filteredTasks}
            onStatusChange={updateTaskStatus}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterType={filterType}
            setFilterType={setFilterType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
        {activeTab === 'workflows' && (
          <WorkflowsTab
            workflows={workflows}
            onTrigger={triggerWorkflow}
            dealId={dealId}
          />
        )}
        {activeTab === 'automation' && (
          <AutomationTab workflows={workflows} />
        )}
      </div>
    </div>
  );
}

function TasksTab({ 
  tasks, 
  onStatusChange, 
  filterStatus, 
  setFilterStatus,
  filterType,
  setFilterType,
  searchTerm,
  setSearchTerm 
}: any) {
  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {Object.entries(TASK_TYPES).map(([type, config]) => (
            <option key={type} value={type}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks</h3>
            <p className="text-gray-600">No workflow tasks found. Create workflows to generate automated tasks.</p>
          </div>
        ) : (
          tasks.map((task: ActiveTask) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange }: { task: ActiveTask; onStatusChange: (id: string, status: string) => void }) {
  const TaskIcon = TASK_TYPES[task.task_type]?.icon || CheckCircle;
  const isOverdue = task.status !== 'completed' && isBefore(new Date(task.due_date), new Date());
  const isDueToday = !isOverdue && format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50' : isDueToday ? 'border-orange-200 bg-orange-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <TaskIcon className={`w-5 h-5 mt-1 ${TASK_TYPES[task.task_type]?.color || 'text-gray-600'}`} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                {task.task_title}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{task.task_description}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                {isOverdue && <span className="text-red-600 font-medium">(Overdue)</span>}
                {isDueToday && <span className="text-orange-600 font-medium">(Due Today)</span>}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Assigned to you</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function WorkflowsTab({ workflows, onTrigger, dealId }: any) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow: WorkflowTemplate) => (
          <div key={workflow.id} className="border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{workflow.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {workflow.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-600">Trigger Stage:</span>
                <span className="ml-2 font-medium capitalize">{workflow.trigger_stage.replace('_', ' ')}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Tasks:</span>
                <span className="ml-2 font-medium">{workflow.tasks.length}</span>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {workflow.tasks.slice(0, 3).map((task, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span>{task.title}</span>
                </div>
              ))}
              {workflow.tasks.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{workflow.tasks.length - 3} more tasks
                </div>
              )}
            </div>
            
            {dealId && workflow.is_active && (
              <button
                onClick={() => onTrigger(workflow.id, dealId)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Trigger Workflow
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationTab({ workflows }: { workflows: WorkflowTemplate[] }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Automation Rules</h3>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Stage-Based Workflow Triggers</h4>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Automatically trigger workflows when deals move to specific stages
          </p>
          <div className="space-y-2">
            {workflows.filter(w => w.is_active).map(workflow => (
              <div key={workflow.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{workflow.name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  Triggers on: {workflow.trigger_stage.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Task Reminders</h4>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
          </div>
          <p className="text-sm text-gray-600">
            Send email reminders for overdue and upcoming tasks
          </p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Deal Scoring Updates</h4>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Planned</span>
          </div>
          <p className="text-sm text-gray-600">
            Automatically update deal scores based on activity and progress
          </p>
        </div>
      </div>
    </div>
  );
}