import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database, Upload, CheckCircle } from 'lucide-react';

const SAMPLE_DEALS = [
  {
    business_name: 'PetSupply Pro',
    industry: 'Pet Products',
    asking_price: 750000,
    annual_revenue: 500000,
    ebitda: 200000,
    multiple: 3.75,
    business_age: 3,
    stage: 'qualified_leads',
    priority: 'high',
    score: 85,
    source: 'Empire Flippers',
    broker_name: 'John Smith',
    broker_email: 'john@empireflippers.com',
    next_action: 'Schedule due diligence call',
    next_action_date: '2025-01-05',
    tags: ['amazon-fba', 'pet-products', 'private-label']
  },
  {
    business_name: 'Kitchen Gadgets Plus',
    industry: 'Home & Kitchen',
    asking_price: 1200000,
    annual_revenue: 800000,
    ebitda: 320000,
    multiple: 3.75,
    business_age: 5,
    stage: 'due_diligence',
    priority: 'urgent',
    score: 92,
    source: 'Flippa',
    broker_name: 'Sarah Johnson',
    broker_email: 'sarah@flippa.com',
    next_action: 'Review financial statements',
    next_action_date: '2025-01-03',
    tags: ['amazon-fba', 'kitchen', 'high-margin']
  },
  {
    business_name: 'Fitness Gear Direct',
    industry: 'Fitness & Sports',
    asking_price: 450000,
    annual_revenue: 300000,
    ebitda: 120000,
    multiple: 3.75,
    business_age: 2,
    stage: 'first_contact',
    priority: 'medium',
    score: 78,
    source: 'BizBuySell',
    broker_name: 'Mike Wilson',
    broker_email: 'mike@bizbuysell.com',
    next_action: 'Send LOI draft',
    next_action_date: '2025-01-08',
    tags: ['amazon-fba', 'fitness', 'growing']
  },
  {
    business_name: 'Baby Care Essentials',
    industry: 'Baby Products',
    asking_price: 950000,
    annual_revenue: 650000,
    ebitda: 260000,
    multiple: 3.65,
    business_age: 4,
    stage: 'loi',
    priority: 'high',
    score: 88,
    source: 'Quiet Light',
    broker_name: 'Lisa Brown',
    broker_email: 'lisa@quietlight.com',
    next_action: 'Negotiate terms',
    next_action_date: '2025-01-04',
    tags: ['amazon-fba', 'baby-products', 'repeat-customers']
  },
  {
    business_name: 'Outdoor Adventure Co',
    industry: 'Outdoor Recreation',
    asking_price: 320000,
    annual_revenue: 220000,
    ebitda: 85000,
    multiple: 3.76,
    business_age: 1,
    stage: 'prospecting',
    priority: 'low',
    score: 65,
    source: 'Direct Outreach',
    broker_name: 'Self',
    broker_email: 'owner@outdooradventure.com',
    next_action: 'Initial contact email',
    next_action_date: '2025-01-10',
    tags: ['amazon-fba', 'outdoor', 'seasonal']
  }
];

export default function SampleDataLoader() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadSampleData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Add user ID and timestamps to sample deals
      const dealsWithUserData = SAMPLE_DEALS.map(deal => ({
        ...deal,
        created_by: user.id,
        assigned_to: user.id,
        stage_updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('deals')
        .insert(dealsWithUserData);

      if (error) throw error;

      // Add some sample activities
      const sampleActivities = [
        {
          deal_id: null, // Will be filled after deals are inserted
          user_id: user.id,
          activity_type: 'note',
          title: 'Initial research completed',
          description: 'Reviewed listing details and financial summary. Business shows strong fundamentals.',
          activity_date: new Date().toISOString()
        }
      ];

      setLoaded(true);
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert('Failed to load sample data. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loaded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Sample Data Loaded</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          5 sample deals have been added to your pipeline for testing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Database className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-blue-800 font-medium">Load Sample Data</h4>
          <p className="text-blue-700 text-sm mt-1 mb-3">
            Add sample deals to test the CRM pipeline functionality.
          </p>
          
          <button
            onClick={loadSampleData}
            disabled={loading || !user}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading Sample Data...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Load 5 Sample Deals
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}