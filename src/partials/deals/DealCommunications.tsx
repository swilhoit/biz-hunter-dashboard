import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Mail, Phone, Calendar, MessageSquare, Edit2, Trash2, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { communicationsAdapter } from '../../lib/database-adapter';

interface Communication {
  id: string;
  direction: 'inbound' | 'outbound';
  channel: 'email' | 'phone' | 'sms' | 'meeting' | 'portal';
  subject?: string;
  body?: string;
  from_email?: string;
  to_emails?: string[];
  cc_emails?: string[];
  phone_number?: string;
  recording_url?: string;
  scheduled_at?: string;
  occurred_at?: string;
  duration_minutes?: number;
  user_name?: string;
  user_email?: string;
  status?: string;
  created_at: string;
}

interface DealCommunicationsProps {
  dealId: string;
}

function DealCommunications({ dealId }: DealCommunicationsProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingComm, setEditingComm] = useState<Communication | null>(null);
  const [expandedComm, setExpandedComm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    direction: 'outbound' as 'inbound' | 'outbound',
    channel: 'email' as 'email' | 'phone' | 'sms' | 'meeting' | 'portal',
    subject: '',
    body: '',
    from_email: '',
    to_emails: '',
    cc_emails: '',
    phone_number: '',
    recording_url: '',
    scheduled_at: '',
    occurred_at: '',
    duration_minutes: ''
  });

  const loadCommunications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await communicationsAdapter.fetchDealCommunications(dealId);
      setCommunications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communications');
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadCommunications();
  }, [loadCommunications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commData = {
        ...formData,
        to_emails: formData.to_emails ? formData.to_emails.split(',').map(email => email.trim()) : [],
        cc_emails: formData.cc_emails ? formData.cc_emails.split(',').map(email => email.trim()) : [],
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        scheduled_at: formData.scheduled_at || null,
        occurred_at: formData.occurred_at || null
      };

      if (editingComm) {
        const updated = await communicationsAdapter.updateCommunication(editingComm.id, commData);
        setCommunications(prev => prev.map(c => c.id === editingComm.id ? updated : c));
      } else {
        const newComm = await communicationsAdapter.createCommunication(dealId, commData);
        setCommunications(prev => [newComm, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save communication');
    }
  };

  const resetForm = () => {
    setFormData({
      direction: 'outbound',
      channel: 'email',
      subject: '',
      body: '',
      from_email: '',
      to_emails: '',
      cc_emails: '',
      phone_number: '',
      recording_url: '',
      scheduled_at: '',
      occurred_at: '',
      duration_minutes: ''
    });
    setShowForm(false);
    setEditingComm(null);
  };

  const handleEdit = (comm: Communication) => {
    setEditingComm(comm);
    setFormData({
      direction: comm.direction,
      channel: comm.channel,
      subject: comm.subject || '',
      body: comm.body || '',
      from_email: comm.from_email || '',
      to_emails: comm.to_emails?.join(', ') || '',
      cc_emails: comm.cc_emails?.join(', ') || '',
      phone_number: comm.phone_number || '',
      recording_url: comm.recording_url || '',
      scheduled_at: comm.scheduled_at ? new Date(comm.scheduled_at).toISOString().slice(0, 16) : '',
      occurred_at: comm.occurred_at ? new Date(comm.occurred_at).toISOString().slice(0, 16) : '',
      duration_minutes: comm.duration_minutes?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (commId: string) => {
    if (confirm('Are you sure you want to delete this communication?')) {
      try {
        await communicationsAdapter.deleteCommunication(commId);
        setCommunications(prev => prev.filter(c => c.id !== commId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete communication');
      }
    }
  };

  const getChannelIcon = (channel: string, className = "w-4 h-4") => {
    switch (channel) {
      case 'email': return <Mail className={className} />;
      case 'phone': return <Phone className={className} />;
      case 'sms': return <MessageSquare className={className} />;
      case 'meeting': return <Calendar className={className} />;
      case 'portal': return <User className={className} />;
      default: return <MessageSquare className={className} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading communications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Communications</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Communication
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Communication Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editingComm ? 'Edit Communication' : 'Log New Communication'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Direction
                </label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value as 'inbound' | 'outbound' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Channel
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as 'email' | 'phone' | 'sms' | 'meeting' | 'portal' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                  <option value="meeting">Meeting</option>
                  <option value="portal">Portal</option>
                </select>
              </div>
            </div>

            {(formData.channel === 'email' || formData.channel === 'meeting') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter subject or meeting title"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes/Body
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter communication details, notes, or summary"
              />
            </div>

            {formData.channel === 'email' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="sender@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Emails (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.to_emails}
                    onChange={(e) => setFormData(prev => ({ ...prev, to_emails: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="recipient1@example.com, recipient2@example.com"
                  />
                </div>
              </div>
            )}

            {(formData.channel === 'phone' || formData.channel === 'sms') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {formData.channel === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="30"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled At
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Occurred At
                </label>
                <input
                  type="datetime-local"
                  value={formData.occurred_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {editingComm ? 'Update' : 'Save'} Communication
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Communications List */}
      <div className="space-y-4">
        {communications.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No communications logged yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Click "Log Communication" to record your first interaction
            </p>
          </div>
        ) : (
          communications.map((comm) => (
            <div key={comm.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-full ${comm.direction === 'inbound' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {getChannelIcon(comm.channel)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        comm.direction === 'inbound' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {comm.direction === 'inbound' ? '← Inbound' : '→ Outbound'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full capitalize">
                        {comm.channel}
                      </span>
                      {comm.duration_minutes && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {comm.duration_minutes}min
                        </span>
                      )}
                    </div>
                    {comm.subject && (
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {comm.subject}
                      </h4>
                    )}
                    {comm.body && (
                      <div className={`text-gray-600 dark:text-gray-400 text-sm ${expandedComm === comm.id ? '' : 'line-clamp-2'}`}>
                        {comm.body}
                      </div>
                    )}
                    {comm.body && comm.body.length > 100 && (
                      <button
                        onClick={() => setExpandedComm(expandedComm === comm.id ? null : comm.id)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm mt-1 flex items-center"
                      >
                        {expandedComm === comm.id ? (
                          <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                        ) : (
                          <>Show More <ChevronDown className="w-3 h-3 ml-1" /></>
                        )}
                      </button>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {comm.user_name && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {comm.user_name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {comm.occurred_at ? formatDate(comm.occurred_at) : formatDate(comm.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(comm)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Edit communication"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(comm.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete communication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DealCommunications;