-- Instructions to apply this migration to Supabase:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to the SQL Editor
-- 3. Copy and paste the contents of migrations/create_asin_review_analysis_table.sql
-- 4. Run the query

-- Quick command to apply the migration:
-- Run this in Supabase SQL editor:

-- Create table for storing ASIN review analysis
CREATE TABLE IF NOT EXISTS asin_review_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    asin_id UUID NOT NULL REFERENCES asins(id) ON DELETE CASCADE,
    pain_points TEXT[] DEFAULT '{}',
    common_issues TEXT[] DEFAULT '{}',
    positive_aspects TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    sentiment_positive DECIMAL(5,2) DEFAULT 0,
    sentiment_negative DECIMAL(5,2) DEFAULT 0,
    sentiment_neutral DECIMAL(5,2) DEFAULT 0,
    key_themes JSONB DEFAULT '[]',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asin_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_asin_review_analysis_asin_id ON asin_review_analysis(asin_id);

-- Add RLS policies
ALTER TABLE asin_review_analysis ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read review analysis
CREATE POLICY "Users can view review analysis" ON asin_review_analysis
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create review analysis
CREATE POLICY "Users can create review analysis" ON asin_review_analysis
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update review analysis
CREATE POLICY "Users can update review analysis" ON asin_review_analysis
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_asin_review_analysis_updated_at ON asin_review_analysis;
CREATE TRIGGER update_asin_review_analysis_updated_at BEFORE UPDATE ON asin_review_analysis
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();