-- Simple deal_tasks table creation (for manual execution in Supabase dashboard)
-- Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql and run this:

CREATE TABLE IF NOT EXISTS deal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON deal_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_status ON deal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_assigned_to ON deal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_due_date ON deal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_sort_order ON deal_tasks(deal_id, status, sort_order);

-- Add foreign key constraint for deal_id
ALTER TABLE deal_tasks 
ADD CONSTRAINT fk_deal_tasks_deal_id 
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

-- Add foreign key constraints for user references  
ALTER TABLE deal_tasks 
ADD CONSTRAINT fk_deal_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id);

ALTER TABLE deal_tasks 
ADD CONSTRAINT fk_deal_tasks_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Enable RLS (you can add policies later)
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy (allows all operations for authenticated users for now)
CREATE POLICY "Authenticated users can manage tasks" ON deal_tasks
FOR ALL USING (auth.role() = 'authenticated');