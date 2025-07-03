-- Add DELETE policy for deal_documents table to allow file deletion
CREATE POLICY "Users can delete documents for deals they have access to" 
ON "public"."deal_documents"
AS PERMISSIVE FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_documents.deal_id
    AND (
      deals.created_by = auth.uid()
      OR deals.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM deal_team_members
        WHERE deal_team_members.deal_id = deals.id
        AND deal_team_members.user_id = auth.uid()
      )
    )
  )
);

-- Also add UPDATE policy for future file metadata editing
CREATE POLICY "Users can update documents for deals they have access to" 
ON "public"."deal_documents"
AS PERMISSIVE FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_documents.deal_id
    AND (
      deals.created_by = auth.uid()
      OR deals.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM deal_team_members
        WHERE deal_team_members.deal_id = deals.id
        AND deal_team_members.user_id = auth.uid()
      )
    )
  )
);