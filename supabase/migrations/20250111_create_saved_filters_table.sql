-- Create saved filters table for listing feed
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    filter_type TEXT NOT NULL DEFAULT 'listings', -- 'listings' or 'deals'
    filters JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_filter_type ON saved_filters(filter_type);

-- Add RLS policies
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved filters
CREATE POLICY "Users can view their own saved filters" ON saved_filters
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own saved filters
CREATE POLICY "Users can create their own saved filters" ON saved_filters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved filters
CREATE POLICY "Users can update their own saved filters" ON saved_filters
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own saved filters
CREATE POLICY "Users can delete their own saved filters" ON saved_filters
    FOR DELETE USING (auth.uid() = user_id);

-- Function to ensure only one default filter per user per type
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE saved_filters 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND filter_type = NEW.filter_type 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single default filter
CREATE TRIGGER maintain_single_default_filter
    BEFORE INSERT OR UPDATE ON saved_filters
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_filter();