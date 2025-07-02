import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', {
    url: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    allEnvVars: Object.keys(import.meta.env)
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);