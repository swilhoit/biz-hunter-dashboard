-- Create deal_tasks table for Kanban-style task management
CREATE TABLE deal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sort_order INTEGER DEFAULT 0,
  
  -- Add indexes for performance
  CONSTRAINT deal_tasks_deal_id_idx UNIQUE (deal_id, id)
);

-- Create indexes
CREATE INDEX idx_deal_tasks_deal_id ON deal_tasks(deal_id);
CREATE INDEX idx_deal_tasks_status ON deal_tasks(status);
CREATE INDEX idx_deal_tasks_assigned_to ON deal_tasks(assigned_to);
CREATE INDEX idx_deal_tasks_due_date ON deal_tasks(due_date);
CREATE INDEX idx_deal_tasks_sort_order ON deal_tasks(deal_id, status, sort_order);

-- Enable RLS
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_tasks
CREATE POLICY "Users can view tasks for deals they have access to" 
ON "public"."deal_tasks"
AS PERMISSIVE FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_tasks.deal_id
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

CREATE POLICY "Users can create tasks for deals they have access to" 
ON "public"."deal_tasks"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_tasks.deal_id
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

CREATE POLICY "Users can update tasks for deals they have access to" 
ON "public"."deal_tasks"
AS PERMISSIVE FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_tasks.deal_id
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

CREATE POLICY "Users can delete tasks for deals they have access to" 
ON "public"."deal_tasks"
AS PERMISSIVE FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_tasks.deal_id
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

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_deal_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set completed_at when status changes to 'done'
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_deal_tasks_updated_at
  BEFORE UPDATE ON deal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_tasks_updated_at();