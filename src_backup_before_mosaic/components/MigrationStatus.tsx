import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';

export default function MigrationStatus() {
  const [migrationStatus, setMigrationStatus] = useState<{
    dealsTableExists: boolean;
    activitiesTableExists: boolean;
    documentsTableExists: boolean;
    communicationsTableExists: boolean;
    loading: boolean;
  }>({
    dealsTableExists: false,
    activitiesTableExists: false,
    documentsTableExists: false,
    communicationsTableExists: false,
    loading: true
  });

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      // Check if CRM tables exist by trying to select from them
      const tableChecks = await Promise.allSettled([
        supabase.from('deals').select('id').limit(1),
        supabase.from('deal_activities').select('id').limit(1),
        supabase.from('deal_documents').select('id').limit(1),
        supabase.from('deal_communications').select('id').limit(1)
      ]);

      setMigrationStatus({
        dealsTableExists: tableChecks[0].status === 'fulfilled',
        activitiesTableExists: tableChecks[1].status === 'fulfilled',
        documentsTableExists: tableChecks[2].status === 'fulfilled',
        communicationsTableExists: tableChecks[3].status === 'fulfilled',
        loading: false
      });
    } catch (error) {
      console.error('Error checking migration status:', error);
      setMigrationStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const { dealsTableExists, activitiesTableExists, documentsTableExists, communicationsTableExists, loading } = migrationStatus;
  
  const allTablesExist = dealsTableExists && activitiesTableExists && documentsTableExists && communicationsTableExists;

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800">Checking CRM database status...</span>
        </div>
      </div>
    );
  }

  if (allTablesExist) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">CRM Database Ready</span>
        </div>
        <p className="text-green-700 text-sm mt-1">All CRM tables are properly configured and ready for use.</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-yellow-800 font-medium">CRM Database Setup Required</h4>
          <p className="text-yellow-700 text-sm mt-1 mb-3">
            The CRM database schema needs to be applied. Please run the migration to enable CRM features.
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {dealsTableExists ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={dealsTableExists ? 'text-green-700' : 'text-red-700'}>
                Deals table
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {activitiesTableExists ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={activitiesTableExists ? 'text-green-700' : 'text-red-700'}>
                Activities table
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {documentsTableExists ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={documentsTableExists ? 'text-green-700' : 'text-red-700'}>
                Documents table
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {communicationsTableExists ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={communicationsTableExists ? 'text-green-700' : 'text-red-700'}>
                Communications table
              </span>
            </div>
          </div>

          <div className="bg-yellow-100 rounded p-3 text-sm">
            <h5 className="font-medium text-yellow-800 mb-2">Migration Instructions:</h5>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700">
              <li>Open your Supabase dashboard</li>
              <li>Go to the SQL Editor</li>
              <li>Run the migration file: <code className="bg-yellow-200 px-1 rounded">supabase/migrations/20250701_create_crm_pipeline_schema.sql</code></li>
              <li>Refresh this page to check status</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}