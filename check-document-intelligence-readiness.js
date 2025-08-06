#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocumentIntelligenceReadiness() {
  console.log('🔍 Checking Document Intelligence System Readiness...\n');

  const results = {
    pgvector: false,
    tables: {
      document_extractions: false,
      document_insights: false,
      deal_documents: false
    },
    views: {
      document_insights_expanded: false
    },
    overall: false
  };

  try {
    // 1. Check pgvector extension
    console.log('1️⃣ Checking pgvector extension...');
    const { data: extensions, error: extError } = await supabase
      .rpc('pg_available_extensions')
      .select('name')
      .eq('name', 'vector');

    if (extError) {
      console.error('   ❌ Error checking extensions:', extError.message);
    } else if (extensions && extensions.length > 0) {
      console.log('   ✅ pgvector extension is available');
      
      // Check if it's installed
      const { data: installed, error: instError } = await supabase
        .rpc('pg_extension_config_dump', { extname: 'vector' });
      
      if (!instError && installed) {
        console.log('   ✅ pgvector extension is installed');
        results.pgvector = true;
      } else {
        console.log('   ⚠️  pgvector extension is available but not installed');
      }
    } else {
      console.log('   ❌ pgvector extension is not available');
    }

    // 2. Check tables
    console.log('\n2️⃣ Checking required tables...');
    
    // Check document_extractions
    const { data: deData, error: deError } = await supabase
      .from('document_extractions')
      .select('id')
      .limit(1);
    
    if (!deError || deError.code === 'PGRST116') { // PGRST116 = no rows returned
      console.log('   ✅ document_extractions table exists');
      results.tables.document_extractions = true;
    } else {
      console.log('   ❌ document_extractions table does not exist');
      console.log('      Error:', deError.message);
    }

    // Check document_insights
    const { data: diData, error: diError } = await supabase
      .from('document_insights')
      .select('id')
      .limit(1);
    
    if (!diError || diError.code === 'PGRST116') {
      console.log('   ✅ document_insights table exists');
      results.tables.document_insights = true;
    } else {
      console.log('   ❌ document_insights table does not exist');
      console.log('      Error:', diError.message);
    }

    // Check deal_documents (dependency)
    const { data: ddData, error: ddError } = await supabase
      .from('deal_documents')
      .select('id')
      .limit(1);
    
    if (!ddError || ddError.code === 'PGRST116') {
      console.log('   ✅ deal_documents table exists');
      results.tables.deal_documents = true;
    } else {
      console.log('   ❌ deal_documents table does not exist');
      console.log('      Error:', ddError.message);
    }

    // 3. Check views
    console.log('\n3️⃣ Checking views...');
    const { data: viewData, error: viewError } = await supabase
      .from('document_insights_expanded')
      .select('id')
      .limit(1);
    
    if (!viewError || viewError.code === 'PGRST116') {
      console.log('   ✅ document_insights_expanded view exists');
      results.views.document_insights_expanded = true;
    } else {
      console.log('   ❌ document_insights_expanded view does not exist');
      console.log('      Error:', viewError.message);
    }

    // 4. Check table schemas
    console.log('\n4️⃣ Checking table schemas...');
    
    // Get column info for document_extractions
    if (results.tables.document_extractions) {
      const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
        table_name: 'document_extractions'
      });
      
      if (!colError && columns) {
        console.log('   📋 document_extractions columns:', columns.map(c => c.column_name).join(', '));
        
        // Check for vector column
        const hasEmbedding = columns.some(c => c.column_name === 'embedding');
        if (hasEmbedding) {
          console.log('   ✅ embedding column exists');
        } else {
          console.log('   ⚠️  embedding column is missing');
        }
      }
    }

    // Overall status
    results.overall = results.pgvector && 
                     results.tables.document_extractions && 
                     results.tables.document_insights && 
                     results.tables.deal_documents;

    console.log('\n📊 Summary:');
    console.log('─'.repeat(50));
    console.log(`pgvector extension:        ${results.pgvector ? '✅' : '❌'}`);
    console.log(`document_extractions:      ${results.tables.document_extractions ? '✅' : '❌'}`);
    console.log(`document_insights:         ${results.tables.document_insights ? '✅' : '❌'}`);
    console.log(`deal_documents:            ${results.tables.deal_documents ? '✅' : '❌'}`);
    console.log(`document_insights_expanded: ${results.views.document_insights_expanded ? '✅' : '❌'}`);
    console.log('─'.repeat(50));
    
    if (results.overall) {
      console.log('\n✅ Document Intelligence System is READY!');
    } else {
      console.log('\n❌ Document Intelligence System is NOT READY');
      console.log('\nTo fix:');
      if (!results.pgvector) {
        console.log('- Enable pgvector extension in Supabase dashboard');
      }
      if (!results.tables.document_extractions || !results.tables.document_insights) {
        console.log('- Run the migration: supabase/migrations/20250129_document_intelligence.sql');
      }
      if (!results.tables.deal_documents) {
        console.log('- Ensure deal_documents table exists (part of CRM schema)');
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

// Alternative approach if RPC doesn't work
async function checkWithDirectQuery() {
  console.log('\n🔍 Alternative check using direct queries...\n');
  
  try {
    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('deals')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Cannot connect to database:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

// Run the check
checkDocumentIntelligenceReadiness()
  .then(() => checkWithDirectQuery())
  .catch(console.error);