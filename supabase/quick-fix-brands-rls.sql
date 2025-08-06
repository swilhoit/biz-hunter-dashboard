-- Quick fix to disable RLS temporarily for testing
-- Run this in Supabase SQL Editor if you just want to test the feature

-- Check if brands table exists and disable RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brands') THEN
        ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled on brands table';
    ELSE
        RAISE NOTICE 'brands table does not exist - please run the full migration first';
    END IF;
END $$;

-- Alternative: Drop existing policies and create permissive ones
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brands') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own brands" ON brands;
        DROP POLICY IF EXISTS "Users can create their own brands" ON brands;
        DROP POLICY IF EXISTS "Users can update their own brands" ON brands;
        DROP POLICY IF EXISTS "Users can delete their own brands" ON brands;
        
        -- Enable RLS
        ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
        
        -- Create a temporary permissive policy for testing
        CREATE POLICY "Allow all operations on brands temporarily" ON brands
            FOR ALL 
            USING (true)
            WITH CHECK (true);
            
        RAISE NOTICE 'Temporary permissive policy created on brands table';
    END IF;
END $$;