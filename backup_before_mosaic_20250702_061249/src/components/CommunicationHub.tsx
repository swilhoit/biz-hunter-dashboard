import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Send,
  Reply,
  Forward,
  Archive,
  Plus,
  Search,
  Filter,
  FileText,
  User,
  Clock,
  ExternalLink,
  Copy,
  Star,
  MoreVertical,
  Download,
  Paperclip
} from 'lucide-react';

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

interface CommunicationHubProps {
  dealId: string;
  dealName: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerName?: string;
}

const EMAIL_TEMPLATES = [
  {
    id: 'initial_inquiry',
    name: 'Initial Inquiry',
    subject: 'Interest in {business_name} - Initial Questions',
    body: `Dear {broker_name},

I hope this email finds you well. I am writing to express my interest in the {business_name} listing that I saw on {source}.

I am an experienced business acquirer looking for opportunities in the {industry} space, and this business appears to be a good fit for my investment criteria.

Could you please provide me with:
1. The Information Memorandum or detailed financials
2. Current asking price and deal structure
3. Timeline for the sale process
4. Any key due diligence items I should be aware of

I am a qualified buyer with proof of funds available and can move quickly if this is the right opportunity.

Looking forward to hearing from you.

Best regards,
{your_name}
{your_email}
{your_phone}`
  },
  {
    id: 'follow_up',
    name: 'Follow-up',
    subject: 'Following up on {business_name}',
    body: `Hi {broker_name},

I wanted to follow up on my previous inquiry about {business_name}. I remain very interested in this opportunity and would appreciate any updates you can provide.

To reiterate, I am a serious buyer with:
- Proven track record in {industry} acquisitions
- Available capital ready to deploy
- Ability to close quickly with minimal contingencies

Please let me know the next steps in the process.

Thank you for your time.

Best regards,
{your_name}`
  },
  {
    id: 'loi_submission',
    name: 'Letter of Intent Submission',
    subject: 'LOI Submission for {business_name}',
    body: `Dear {broker_name},

Thank you for providing the detailed information about {business_name}. After careful review, I would like to submit the attached Letter of Intent.

Key terms of my offer:
- Purchase Price: {offer_price}
- Structure: {deal_structure}
- Due Diligence Period: {dd_period} days
- Closing Timeline: {closing_timeline}

I believe this is a fair offer that reflects the business's value and market conditions. I'm prepared to move quickly to due diligence upon acceptance.

Please let me know if you have any questions or would like to discuss the terms.

Best regards,
{your_name}`
  },
  {
    id: 'due_diligence_request',
    name: 'Due Diligence Request',
    subject: 'Due Diligence Items for {business_name}',
    body: `Dear {broker_name},

Thank you for accepting our LOI for {business_name}. I'm excited to move forward with the due diligence process.

To expedite our review, could you please provide the following items:

Financial Documents:
- 3 years of P&L statements
- 3 years of tax returns
- Bank statements (last 12 months)
- Accounts receivable/payable aging

Legal Documents:
- Corporate structure documents
- Key contracts and agreements
- Insurance policies
- Any pending litigation

Operational Documents:
- Employee handbook and org chart
- Vendor/supplier agreements
- Technology stack overview

I appreciate your assistance in gathering these materials. Please let me know if you have any questions about these requests.

Best regards,
{your_name}`
  }
];

const COMMUNICATION_TYPES = [
  { value: 'email', label: 'Email', icon: Mail, color: 'text-blue-600' },
  { value: 'phone', label: 'Phone Call', icon: Phone, color: 'text-green-600' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-purple-600' },
  { value: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-orange-600' },
  { value: 'portal', label: 'Portal Message', icon: FileText, color: 'text-indigo-600' }
];

export default function CommunicationHub({ 
  dealId, 
  dealName, 
  brokerEmail = '', 
  brokerPhone = '', 
  brokerName = '' 
}: CommunicationHubProps) {
  const { user } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [filterChannel, setFilterChannel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    fetchCommunications();
  }, [dealId]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deal_communications')
        .select('*')
        .eq('deal_id', dealId)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedCommunications = communications.reduce((acc, comm) => {
    const threadId = comm.thread_id || comm.id;
    if (!acc[threadId]) {
      acc[threadId] = [];
    }
    acc[threadId].push(comm);
    return acc;
  }, {} as Record<string, Communication[]>);

  const filteredCommunications = Object.entries(groupedCommunications).filter(([threadId, comms]) => {
    const latestComm = comms[0];
    if (filterChannel !== 'all' && latestComm.channel !== filterChannel) return false;
    if (searchTerm && !latestComm.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !latestComm.body.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const formatTemplate = (template: string, variables: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  };

  const getTemplateVariables = () => {
    return {
      business_name: dealName,
      broker_name: brokerName,
      broker_email: brokerEmail,
      your_name: user?.email?.split('@')[0] || 'Your Name',
      your_email: user?.email || 'your@email.com',
      your_phone: 'Your Phone Number',
      source: 'listing source',
      industry: 'target industry',
      offer_price: '$XXX,XXX',
      deal_structure: 'Asset Purchase',
      dd_period: '30',
      closing_timeline: '45 days'
    };
  };

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
            <h2 className="text-xl font-semibold">Communications</h2>
            <p className="text-gray-600">{dealName}</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Communication
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          {brokerEmail && (
            <a
              href={`mailto:${brokerEmail}?subject=Regarding ${dealName}`}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <Mail className="w-4 h-4" />
              Email Broker
            </a>
          )}
          {brokerPhone && (
            <a
              href={`tel:${brokerPhone}`}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <Phone className="w-4 h-4" />
              Call Broker
            </a>
          )}
          <button
            onClick={() => {
              setSelectedTemplate('initial_inquiry');
              setShowCompose(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
          >
            <FileText className="w-4 h-4" />
            Use Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Channels</option>
            {COMMUNICATION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Communication List */}
        <div className="w-1/3 border-r overflow-y-auto">
          {filteredCommunications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No communications found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCommunications.map(([threadId, comms]) => {
                const latestComm = comms[0];
                const ChannelIcon = COMMUNICATION_TYPES.find(t => t.value === latestComm.channel)?.icon || MessageSquare;
                
                return (
                  <div
                    key={threadId}
                    onClick={() => setSelectedThread(threadId)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedThread === threadId ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="w-4 h-4 text-gray-500" />
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          latestComm.direction === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {latestComm.direction}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(latestComm.occurred_at || latestComm.created_at), 'MMM d')}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                      {latestComm.subject || `${latestComm.channel} communication`}
                    </h4>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {latestComm.body}
                    </p>
                    
                    {comms.length > 1 && (
                      <div className="mt-2 text-xs text-blue-600">
                        {comms.length} messages in thread
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Communication Detail */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <CommunicationDetail
              communications={groupedCommunications[selectedThread]}
              onRefresh={fetchCommunications}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a communication to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          dealId={dealId}
          dealName={dealName}
          brokerEmail={brokerEmail}
          brokerName={brokerName}
          selectedTemplate={selectedTemplate}
          templates={EMAIL_TEMPLATES}
          templateVariables={getTemplateVariables()}
          onClose={() => {
            setShowCompose(false);
            setSelectedTemplate('');
          }}
          onSend={() => {
            fetchCommunications();
            setShowCompose(false);
            setSelectedTemplate('');
          }}
        />
      )}
    </div>
  );
}

function CommunicationDetail({ communications, onRefresh }: any) {
  const sortedComms = [...communications].sort((a, b) => 
    new Date(a.occurred_at || a.created_at).getTime() - new Date(b.occurred_at || b.created_at).getTime()
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{sortedComms[0]?.subject}</h3>
            <p className="text-sm text-gray-600">
              {sortedComms.length} message{sortedComms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <Reply className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Forward className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedComms.map((comm, index) => {
          const ChannelIcon = COMMUNICATION_TYPES.find(t => t.value === comm.channel)?.icon || MessageSquare;
          
          return (
            <div key={comm.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ChannelIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {comm.direction === 'inbound' ? comm.from_email : 'You'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    comm.direction === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {comm.direction}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(comm.occurred_at || comm.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              
              {comm.to_emails && comm.to_emails.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  To: {comm.to_emails.join(', ')}
                </div>
              )}
              
              <div className="prose prose-sm max-w-none">
                {comm.body.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              
              {comm.duration_minutes > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  Duration: {comm.duration_minutes} minutes
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComposeModal({ 
  dealId, 
  dealName, 
  brokerEmail, 
  brokerName, 
  selectedTemplate, 
  templates, 
  templateVariables, 
  onClose, 
  onSend 
}: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    channel: 'email',
    direction: 'outbound',
    to_emails: brokerEmail ? [brokerEmail] : [],
    subject: '',
    body: '',
    scheduled_at: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setFormData(prev => ({
          ...prev,
          subject: formatTemplate(template.subject, templateVariables),
          body: formatTemplate(template.body, templateVariables)
        }));
      }
    }
  }, [selectedTemplate, templates, templateVariables]);

  const formatTemplate = (template: string, variables: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { error } = await supabase
        .from('deal_communications')
        .insert({
          deal_id: dealId,
          user_id: user?.id,
          direction: formData.direction,
          channel: formData.channel,
          subject: formData.subject,
          body: formData.body,
          to_emails: formData.to_emails,
          from_email: user?.email,
          occurred_at: formData.scheduled_at || new Date().toISOString(),
          status: 'sent'
        });

      if (error) throw error;
      onSend();
    } catch (error) {
      console.error('Error sending communication:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">New Communication</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                {COMMUNICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) {
                    setFormData(prev => ({
                      ...prev,
                      subject: formatTemplate(template.subject, templateVariables),
                      body: formatTemplate(template.body, templateVariables)
                    }));
                  }
                }}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.channel === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <input
                  type="email"
                  value={formData.to_emails.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    to_emails: e.target.value.split(',').map(email => email.trim()) 
                  }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter email addresses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter subject"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {formData.channel === 'email' ? 'Message' : 'Notes'}
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={12}
              placeholder={`Enter ${formData.channel === 'email' ? 'message' : 'notes'}...`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !formData.body.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            {formData.channel === 'email' ? 'Send Email' : 'Save Communication'}
          </button>
        </div>
      </div>
    </div>
  );
}