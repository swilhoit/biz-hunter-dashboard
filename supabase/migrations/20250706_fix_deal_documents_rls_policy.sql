-- Fix RLS policies for deal_documents table to match the actual deals table schema
-- The deals table uses 'user_id' not 'created_by' and 'assigned_to'

-- Drop the existing policies that reference non-existent columns
DROP POLICY IF EXISTS "Users can view documents for deals they have access to" ON deal_documents;
DROP POLICY IF EXISTS "Users can upload documents for deals they have access to" ON deal_documents;
DROP POLICY IF EXISTS "Users can delete documents for deals they have access to" ON deal_documents;
DROP POLICY IF EXISTS "Users can update documents for deals they have access to" ON deal_documents;

-- Create new policies that match the actual schema
CREATE POLICY "Users can view documents for their deals" ON deal_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_documents.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents for their deals" ON deal_documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_documents.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for their deals" ON deal_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_documents.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their deals" ON deal_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_documents.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

-- Success message
SELECT 'deal_documents RLS policies fixed successfully!' as status;