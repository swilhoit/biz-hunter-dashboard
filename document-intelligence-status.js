#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocumentIntelligenceStatus() {
  console.log('📋 Document Intelligence System Status Report\n');
  console.log('═'.repeat(60));
  
  // Check environment
  console.log('\n🔧 Environment Check:');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Has Anon Key: ${supabaseKey ? '✅' : '❌'}`);
  
  // Check migration file
  const migrationPath = resolve(__dirname, 'supabase/migrations/20250129_document_intelligence.sql');
  const migrationExists = fs.existsSync(migrationPath);
  console.log(`   Migration file exists: ${migrationExists ? '✅' : '❌'}`);
  
  // Database checks
  console.log('\n💾 Database Status:');
  
  const tableChecks = [
    { name: 'document_extractions', required: true },
    { name: 'document_insights', required: true },
    { name: 'deal_documents', required: true, dependency: true },
    { name: 'deals', required: true, dependency: true }
  ];
  
  const results = {
    tables: {},
    ready: false
  };
  
  for (const table of tableChecks) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('count')
        .limit(0);
      
      if (!error || error.code === 'PGRST116') {
        console.log(`   ${table.name}: ✅ exists${table.dependency ? ' (dependency)' : ''}`);
        results.tables[table.name] = true;
      } else if (error.code === '42P01') {
        console.log(`   ${table.name}: ❌ does not exist${table.dependency ? ' (dependency)' : ''}`);
        results.tables[table.name] = false;
      } else {
        console.log(`   ${table.name}: ⚠️  unknown (${error.message})`);
        results.tables[table.name] = false;
      }
    } catch (err) {
      console.log(`   ${table.name}: ❌ error checking`);
      results.tables[table.name] = false;
    }
  }
  
  // Check if Document Intelligence tables exist
  const docIntelReady = results.tables.document_extractions && results.tables.document_insights;
  const dependenciesReady = results.tables.deal_documents && results.tables.deals;
  
  console.log('\n📊 Summary:');
  console.log('─'.repeat(60));
  
  if (docIntelReady) {
    console.log('✅ Document Intelligence tables are READY!');
    results.ready = true;
  } else if (dependenciesReady) {
    console.log('⚠️  Document Intelligence tables are NOT created');
    console.log('✅ Required dependencies (deals, deal_documents) exist');
    console.log('\n📌 Next Steps:');
    console.log('1. Run the Document Intelligence migration in Supabase Dashboard:');
    console.log('   - Go to: https://supabase.com/dashboard/project/ueemtnohgkovwzodzxdr/sql/new');
    console.log('   - Copy and paste the contents of:');
    console.log(`     ${migrationPath}`);
    console.log('   - Execute the SQL');
    console.log('\n2. Enable pgvector extension (if not already enabled):');
    console.log('   - In the SQL editor, run: CREATE EXTENSION IF NOT EXISTS vector;');
  } else {
    console.log('❌ Missing required dependencies');
    console.log('\n📌 Required Setup:');
    console.log('1. Ensure CRM/Deal tables are created first');
    console.log('2. Then run the Document Intelligence migration');
  }
  
  // Show migration preview
  if (migrationExists && !docIntelReady) {
    console.log('\n📄 Migration Preview:');
    console.log('─'.repeat(60));
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    const lines = migrationContent.split('\n').slice(0, 20);
    console.log(lines.join('\n'));
    console.log('... (truncated)');
  }
  
  return results;
}

// Run the check
checkDocumentIntelligenceStatus()
  .then(results => {
    console.log('\n═'.repeat(60));
    if (results.ready) {
      console.log('✅ System is ready for Document Intelligence features!');
    } else {
      console.log('⚠️  System requires setup. Follow the steps above.');
    }
    process.exit(results.ready ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });