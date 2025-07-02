import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  FileText,
  User,
  Edit,
  ArrowRight,
  Upload,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Star,
  Clock,
  Plus,
  Filter,
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Eye,
  Reply
} from 'lucide-react';

interface Activity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string;
  outcome: string;
  next_steps: string;
  activity_date: string;
  duration_minutes: number;
  attendees: string[];
  metadata: any;
  created_at: string;
}

interface Communication {
  id: string;
  deal_id: string;
  direction: 'inbound' | 'outbound';
  channel: 'email' | 'phone' | 'sms' | 'meeting' | 'portal';
  subject: string;
  body: string;
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  phone_number: string;
  recording_url: string;
  scheduled_at: string;
  occurred_at: string;
  duration_minutes: number;
  user_id: string;
  contact_id: string;
  thread_id: string;
  status: string;
  created_at: string;
}

interface TimelineItem {
  id: string;
  type: 'activity' | 'communication';
  date: string;
  title: string;
  description: string;
  user_id: string;
  icon: React.ComponentType<any>;
  color: string;
  data: Activity | Communication;
}

interface DealTimelineProps {
  dealId: string;
}

const ACTIVITY_ICONS = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: MessageSquare,
  stage_change: ArrowRight,
  document_upload: Upload,
  task: CheckSquare,
  default: MessageSquare
};

const ACTIVITY_COLORS = {
  email: 'text-blue-600 bg-blue-100',
  call: 'text-green-600 bg-green-100',
  meeting: 'text-purple-600 bg-purple-100',
  note: 'text-gray-600 bg-gray-100',
  stage_change: 'text-orange-600 bg-orange-100',
  document_upload: 'text-indigo-600 bg-indigo-100',
  task: 'text-pink-600 bg-pink-100',
  default: 'text-gray-600 bg-gray-100'
};

export default function DealTimeline({ dealId }: DealTimelineProps) {
  const { user } = useAuth();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note',
    title: '',
    description: '',
    outcome: '',
    next_steps: '',
    duration_minutes: 0,
    attendees: []
  });

  useEffect(() => {
    fetchTimelineData();
  }, [dealId, filter, searchTerm]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      // Fetch activities
      let activitiesQuery = supabase
        .from('deal_activities')
        .select('*')
        .eq('deal_id', dealId);

      if (filter !== 'all' && filter !== 'communications') {
        activitiesQuery = activitiesQuery.eq('activity_type', filter);
      }

      if (searchTerm) {
        activitiesQuery = activitiesQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Fetch communications
      let communicationsQuery = supabase
        .from('deal_communications')
        .select('*')
        .eq('deal_id', dealId);

      if (filter === 'communications') {
        // Include all communications
      } else if (filter !== 'all') {
        communicationsQuery = communicationsQuery.eq('channel', filter);
      }

      if (searchTerm) {
        communicationsQuery = communicationsQuery.or(`subject.ilike.%${searchTerm}%,body.ilike.%${searchTerm}%`);
      }

      const [activitiesResult, communicationsResult] = await Promise.all([
        activitiesQuery.order('activity_date', { ascending: false }),
        communicationsQuery.order('occurred_at', { ascending: false })
      ]);

      if (activitiesResult.error) throw activitiesResult.error;
      if (communicationsResult.error) throw communicationsResult.error;

      // Combine and sort timeline items
      const activities: TimelineItem[] = (activitiesResult.data || []).map(activity => ({
        id: activity.id,
        type: 'activity',
        date: activity.activity_date,
        title: activity.title,
        description: activity.description,
        user_id: activity.user_id,
        icon: ACTIVITY_ICONS[activity.activity_type as keyof typeof ACTIVITY_ICONS] || ACTIVITY_ICONS.default,
        color: ACTIVITY_COLORS[activity.activity_type as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.default,
        data: activity
      }));

      const communications: TimelineItem[] = (communicationsResult.data || []).map(comm => ({
        id: comm.id,
        type: 'communication',
        date: comm.occurred_at || comm.created_at,
        title: comm.subject || `${comm.channel} ${comm.direction}`,
        description: comm.body,
        user_id: comm.user_id,
        icon: ACTIVITY_ICONS[comm.channel as keyof typeof ACTIVITY_ICONS] || ACTIVITY_ICONS.default,
        color: ACTIVITY_COLORS[comm.channel as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.default,
        data: comm
      }));

      const allItems = [...activities, ...communications]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTimelineItems(allItems);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async () => {
    try {
      const { error } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          user_id: user?.id,
          activity_type: newActivity.type,
          title: newActivity.title,
          description: newActivity.description,
          outcome: newActivity.outcome,
          next_steps: newActivity.next_steps,
          duration_minutes: newActivity.duration_minutes,
          attendees: newActivity.attendees,
          activity_date: new Date().toISOString()
        });

      if (error) throw error;

      setNewActivity({
        type: 'note',
        title: '',
        description: '',
        outcome: '',
        next_steps: '',
        duration_minutes: 0,
        attendees: []
      });
      setShowNewActivity(false);
      fetchTimelineData();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
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
      <div className="p-6 border-b bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Timeline & Communications</h2>
          <button
            onClick={() => setShowNewActivity(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            <option value="communications">All Communications</option>
            <option value="email">Emails</option>
            <option value="call">Calls</option>
            <option value="meeting">Meetings</option>
            <option value="note">Notes</option>
            <option value="stage_change">Stage Changes</option>
            <option value="document_upload">Documents</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {timelineItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No timeline activities found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {timelineItems.map((item, index) => (
              <TimelineItemComponent
                key={item.id}
                item={item}
                isLast={index === timelineItems.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Activity Modal */}
      {showNewActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add New Activity</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Brief description of the activity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  placeholder="Detailed description..."
                />
              </div>
              
              {newActivity.type === 'call' || newActivity.type === 'meeting' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newActivity.duration_minutes}
                    onChange={(e) => setNewActivity({ ...newActivity, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              ) : null}
              
              <div>
                <label className="block text-sm font-medium mb-1">Outcome</label>
                <textarea
                  value={newActivity.outcome}
                  onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="What was the result?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Next Steps</label>
                <textarea
                  value={newActivity.next_steps}
                  onChange={(e) => setNewActivity({ ...newActivity, next_steps: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="What needs to happen next?"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewActivity(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!newActivity.title || !newActivity.description}
              >
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItemComponent({ 
  item, 
  isLast 
}: { 
  item: TimelineItem; 
  isLast: boolean; 
}) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = item.icon;

  return (
    <div className="flex gap-4">
      {/* Icon */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        {!isLast && <div className="w-px h-16 bg-gray-200 mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{format(new Date(item.date), 'MMM d, yyyy h:mm a')}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>You</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {item.type === 'activity' && (item.data as Activity).duration_minutes > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {formatDuration((item.data as Activity).duration_minutes)}
                </span>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="text-gray-700 mb-3">
            {item.description.length > 150 && !expanded
              ? `${item.description.substring(0, 150)}...`
              : item.description
            }
            {item.description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-800 ml-2"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Additional Details */}
          {expanded && item.type === 'activity' && (
            <div className="space-y-3 pt-3 border-t">
              {(item.data as Activity).outcome && (
                <div>
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Outcome</h5>
                  <p className="text-gray-600 text-sm">{(item.data as Activity).outcome}</p>
                </div>
              )}
              {(item.data as Activity).next_steps && (
                <div>
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Next Steps</h5>
                  <p className="text-gray-600 text-sm">{(item.data as Activity).next_steps}</p>
                </div>
              )}
              {(item.data as Activity).attendees && (item.data as Activity).attendees.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Attendees</h5>
                  <div className="flex flex-wrap gap-1">
                    {(item.data as Activity).attendees.map((attendee, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Communication Details */}
          {expanded && item.type === 'communication' && (
            <div className="space-y-3 pt-3 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Direction:</span>
                  <span className="ml-2 capitalize">{(item.data as Communication).direction}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Channel:</span>
                  <span className="ml-2 capitalize">{(item.data as Communication).channel}</span>
                </div>
                {(item.data as Communication).from_email && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">From:</span>
                    <span className="ml-2">{(item.data as Communication).from_email}</span>
                  </div>
                )}
                {(item.data as Communication).to_emails && (item.data as Communication).to_emails.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">To:</span>
                    <span className="ml-2">{(item.data as Communication).to_emails.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {item.type === 'communication' && (
              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
                <Paperclip className="w-3 h-3" />
                Attachments
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
};