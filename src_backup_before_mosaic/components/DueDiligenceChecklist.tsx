import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  Shield,
  Building2,
  TrendingUp,
  Edit,
  Trash2,
  Save,
  X,
  Filter,
  Search
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  deal_id: string;
  category: string;
  item: string;
  status: 'pending' | 'in_progress' | 'completed' | 'na' | 'issue';
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  notes?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface DueDiligenceChecklistProps {
  dealId: string;
  dealName: string;
}

const DD_CATEGORIES = [
  {
    id: 'financial',
    name: 'Financial Due Diligence',
    icon: DollarSign,
    color: 'text-green-600',
    items: [
      'Review 3 years of P&L statements',
      'Verify bank statements',
      'Review tax returns',
      'Analyze cash flow statements',
      'Verify accounts receivable',
      'Review accounts payable',
      'Assess inventory valuation',
      'Review fixed assets',
      'Analyze financial ratios',
      'Review budget vs actual',
      'Assess working capital needs',
      'Review any debt obligations'
    ]
  },
  {
    id: 'legal',
    name: 'Legal Due Diligence',
    icon: Shield,
    color: 'text-blue-600',
    items: [
      'Review corporate structure',
      'Verify business licenses',
      'Review contracts and agreements',
      'Check intellectual property rights',
      'Review employment agreements',
      'Assess litigation history',
      'Review insurance policies',
      'Check regulatory compliance',
      'Review lease agreements',
      'Verify permits and approvals',
      'Review NDAs and confidentiality',
      'Assess environmental compliance'
    ]
  },
  {
    id: 'operational',
    name: 'Operational Due Diligence',
    icon: Building2,
    color: 'text-purple-600',
    items: [
      'Review organizational structure',
      'Assess key personnel',
      'Review operations manual',
      'Analyze supplier relationships',
      'Review customer base',
      'Assess technology systems',
      'Review quality control processes',
      'Analyze operational metrics',
      'Review inventory management',
      'Assess scalability',
      'Review key man dependencies',
      'Analyze operational risks'
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Due Diligence',
    icon: TrendingUp,
    color: 'text-orange-600',
    items: [
      'Analyze market size and growth',
      'Assess competitive landscape',
      'Review customer concentration',
      'Analyze pricing strategy',
      'Review sales processes',
      'Assess brand strength',
      'Review marketing channels',
      'Analyze customer retention',
      'Review product lifecycle',
      'Assess market positioning',
      'Review distribution channels',
      'Analyze growth opportunities'
    ]
  },
  {
    id: 'technical',
    name: 'Technical Due Diligence',
    icon: FileText,
    color: 'text-indigo-600',
    items: [
      'Review IT infrastructure',
      'Assess software systems',
      'Review data security',
      'Analyze website performance',
      'Review e-commerce platform',
      'Assess automation level',
      'Review backup systems',
      'Analyze integration capabilities',
      'Review mobile optimization',
      'Assess technical debt',
      'Review development processes',
      'Analyze scalability'
    ]
  }
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckSquare },
  na: { label: 'N/A', color: 'bg-gray-100 text-gray-500', icon: Square },
  issue: { label: 'Issue', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  critical: { label: 'Critical', color: 'text-red-600' }
};

export default function DueDiligenceChecklist({ dealId, dealName }: DueDiligenceChecklistProps) {
  const { user } = useAuth();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [newItem, setNewItem] = useState({
    category: 'financial',
    item: '',
    severity: 'medium' as const,
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchChecklistItems();
  }, [dealId]);

  const fetchChecklistItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dd_checklists')
        .select('*')
        .eq('deal_id', dealId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setChecklistItems(data || []);
    } catch (error) {
      console.error('Error fetching checklist items:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeStandardChecklist = async () => {
    try {
      const items = DD_CATEGORIES.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => ({
          deal_id: dealId,
          category: category.id,
          item,
          status: 'pending' as const,
          severity: 'medium' as const,
          order_index: categoryIndex * 100 + itemIndex,
          assigned_to: user?.id
        }))
      );

      const { error } = await supabase
        .from('dd_checklists')
        .insert(items);

      if (error) throw error;
      fetchChecklistItems();
    } catch (error) {
      console.error('Error initializing checklist:', error);
    }
  };

  const updateItemStatus = async (itemId: string, status: ChecklistItem['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      } else if (status !== 'completed') {
        updateData.completed_date = null;
      }

      const { error } = await supabase
        .from('dd_checklists')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
      fetchChecklistItems();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const addCustomItem = async () => {
    if (!newItem.item.trim()) return;

    try {
      const maxOrder = Math.max(...checklistItems.map(item => item.order_index), 0);
      const { error } = await supabase
        .from('dd_checklists')
        .insert({
          deal_id: dealId,
          category: newItem.category,
          item: newItem.item,
          severity: newItem.severity,
          due_date: newItem.due_date || null,
          notes: newItem.notes,
          assigned_to: user?.id,
          order_index: maxOrder + 1
        });

      if (error) throw error;

      setNewItem({
        category: 'financial',
        item: '',
        severity: 'medium',
        due_date: '',
        notes: ''
      });
      setShowAddItem(false);
      fetchChecklistItems();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateItem = async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from('dd_checklists')
        .update({
          item: item.item,
          severity: item.severity,
          due_date: item.due_date,
          notes: item.notes
        })
        .eq('id', item.id);

      if (error) throw error;
      setEditingItem(null);
      fetchChecklistItems();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('dd_checklists')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchChecklistItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = checklistItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchTerm && !item.item.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getCompletionStats = () => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.status === 'completed').length;
    const issues = checklistItems.filter(item => item.status === 'issue').length;
    const inProgress = checklistItems.filter(item => item.status === 'in_progress').length;
    
    return { total, completed, issues, inProgress, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const stats = getCompletionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Due Diligence Checklist</h2>
            <p className="text-gray-600">{dealName}</p>
          </div>
          <div className="flex items-center gap-2">
            {checklistItems.length === 0 ? (
              <button
                onClick={initializeStandardChecklist}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Initialize Standard Checklist
              </button>
            ) : (
              <button
                onClick={() => setShowAddItem(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {checklistItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-semibold">{stats.completed}/{stats.total}</div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-semibold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-semibold text-red-600">{stats.issues}</div>
              <div className="text-sm text-gray-600">Issues</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-semibold text-green-600">{Math.round(stats.percentage)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {checklistItems.length > 0 && (
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search checklist items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {DD_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {checklistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CheckSquare className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Due Diligence Checklist</h3>
            <p className="text-center mb-4">
              Initialize a standard checklist with common due diligence items,<br />
              or add your own custom items.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {selectedCategory === 'all' ? (
              DD_CATEGORIES.map(category => {
                const categoryItems = filteredItems.filter(item => item.category === category.id);
                if (categoryItems.length === 0) return null;

                return (
                  <CategorySection
                    key={category.id}
                    category={category}
                    items={categoryItems}
                    onStatusChange={updateItemStatus}
                    onEdit={setEditingItem}
                    onDelete={deleteItem}
                  />
                );
              })
            ) : (
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onStatusChange={updateItemStatus}
                    onEdit={setEditingItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          newItem={newItem}
          setNewItem={setNewItem}
          onAdd={addCustomItem}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSave={updateItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function CategorySection({ 
  category, 
  items, 
  onStatusChange, 
  onEdit, 
  onDelete 
}: {
  category: any;
  items: ChecklistItem[];
  onStatusChange: (id: string, status: ChecklistItem['status']) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
}) {
  const completed = items.filter(item => item.status === 'completed').length;
  const total = items.length;
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <category.icon className={`w-5 h-5 ${category.color}`} />
        <h3 className="text-lg font-medium">{category.name}</h3>
        <span className="text-sm text-gray-500">({completed}/{total})</span>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistItemRow({ 
  item, 
  onStatusChange, 
  onEdit, 
  onDelete 
}: {
  item: ChecklistItem;
  onStatusChange: (id: string, status: ChecklistItem['status']) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
}) {
  const StatusIcon = STATUS_CONFIG[item.status].icon;
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => {
            const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
            onStatusChange(item.id, nextStatus);
          }}
          className="p-1"
        >
          <StatusIcon className={`w-5 h-5 ${
            item.status === 'completed' ? 'text-green-600' : 'text-gray-400'
          }`} />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
              {item.item}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${STATUS_CONFIG[item.status].color}`}>
              {STATUS_CONFIG[item.status].label}
            </span>
            <span className={`text-xs ${SEVERITY_CONFIG[item.severity].color}`}>
              {SEVERITY_CONFIG[item.severity].label}
            </span>
          </div>
          
          {item.notes && (
            <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
          )}
          
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            {item.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Due: {format(new Date(item.due_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {item.completed_date && (
              <div className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                <span>Completed: {format(new Date(item.completed_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value as ChecklistItem['status'])}
          className="text-xs border rounded px-2 py-1"
        >
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <option key={status} value={status}>{config.label}</option>
          ))}
        </select>
        
        <button
          onClick={() => onEdit(item)}
          className="p-1 text-gray-400 hover:text-blue-600"
        >
          <Edit className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ newItem, setNewItem, onAdd, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Add Checklist Item</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              {DD_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Item</label>
            <input
              type="text"
              value={newItem.item}
              onChange={(e) => setNewItem(prev => ({ ...prev, item: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter checklist item"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              value={newItem.severity}
              onChange={(e) => setNewItem(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => (
                <option key={severity} value={severity}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={newItem.due_date}
              onChange={(e) => setNewItem(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={newItem.notes}
              onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

function EditItemModal({ item, onSave, onClose }: any) {
  const [editedItem, setEditedItem] = useState(item);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Edit Checklist Item</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item</label>
            <input
              type="text"
              value={editedItem.item}
              onChange={(e) => setEditedItem(prev => ({ ...prev, item: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              value={editedItem.severity}
              onChange={(e) => setEditedItem(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => (
                <option key={severity} value={severity}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={editedItem.due_date || ''}
              onChange={(e) => setEditedItem(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={editedItem.notes || ''}
              onChange={(e) => setEditedItem(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedItem)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}