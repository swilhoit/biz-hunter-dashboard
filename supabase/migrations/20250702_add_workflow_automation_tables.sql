-- Create workflow automation tables

-- General tasks table (for manual and workflow tasks)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'manual' CHECK (task_type IN ('manual', 'workflow', 'reminder')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  workflow_task_id UUID REFERENCES workflow_tasks(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  reminder_settings JSONB DEFAULT '{"enabled": false, "days_before": 1, "email": true, "in_app": true}',
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow templates table
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_stage deal_stage NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active workflow tasks table
CREATE TABLE workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  workflow_template_id UUID REFERENCES workflow_templates(id),
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('email', 'call', 'meeting', 'document', 'research', 'followup')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE NOT NULL,
  completed_date DATE,
  reminder_sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task dependencies table (for complex workflows)
CREATE TABLE workflow_task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Automation rules table
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stage_change', 'time_based', 'field_change', 'score_change')),
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automation execution log
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES automation_rules(id),
  deal_id UUID REFERENCES deals(id),
  trigger_data JSONB,
  actions_executed JSONB,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Saved searches table
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_workflow_tasks_deal_id ON workflow_tasks(deal_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_due_date ON workflow_tasks(due_date);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_workflow_templates_trigger_stage ON workflow_templates(trigger_stage);
CREATE INDEX idx_automation_rules_trigger_type ON automation_rules(trigger_type);
CREATE INDEX idx_automation_executions_deal_id ON automation_executions(deal_id);
CREATE INDEX idx_saved_searches_created_by ON saved_searches(created_by);
CREATE INDEX idx_saved_searches_is_default ON saved_searches(is_default);

-- Add RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can delete their own manual tasks" ON tasks
  FOR DELETE USING (auth.uid() = created_by AND task_type = 'manual');

-- Workflow templates policies
CREATE POLICY "Users can view workflow templates for their team" ON workflow_templates
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      team_id IS NULL OR 
      team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create workflow templates" ON workflow_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own workflow templates" ON workflow_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- Workflow tasks policies
CREATE POLICY "Users can view workflow tasks for their deals" ON workflow_tasks
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      deal_id IN (SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid()) OR
      assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can create workflow tasks" ON workflow_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update workflow tasks assigned to them" ON workflow_tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Task dependencies policies
CREATE POLICY "Users can view task dependencies for their tasks" ON workflow_task_dependencies
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      task_id IN (SELECT id FROM workflow_tasks WHERE assigned_to = auth.uid()) OR
      depends_on_task_id IN (SELECT id FROM workflow_tasks WHERE assigned_to = auth.uid())
    )
  );

-- Automation rules policies
CREATE POLICY "Users can view automation rules for their team" ON automation_rules
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      team_id IS NULL OR 
      team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create automation rules" ON automation_rules
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Automation executions policies
CREATE POLICY "Users can view automation executions for their deals" ON automation_executions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    deal_id IN (SELECT id FROM deals WHERE created_by = auth.uid() OR assigned_to = auth.uid())
  );

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create saved searches" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own saved searches" ON saved_searches
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
  FOR DELETE USING (auth.uid() = created_by);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically trigger workflows when deal stage changes
CREATE OR REPLACE FUNCTION trigger_stage_workflows()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if stage actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Insert workflow tasks for any active templates matching the new stage
    INSERT INTO workflow_tasks (
      deal_id,
      workflow_template_id,
      task_title,
      task_description,
      task_type,
      assigned_to,
      due_date
    )
    SELECT 
      NEW.id,
      wt.id,
      (task->>'title')::TEXT,
      (task->>'description')::TEXT,
      (task->>'task_type')::TEXT,
      COALESCE((task->>'assigned_to')::UUID, NEW.assigned_to, NEW.created_by),
      (CURRENT_DATE + INTERVAL '1 day' * (task->>'due_days_offset')::INTEGER)::DATE
    FROM workflow_templates wt,
    LATERAL jsonb_array_elements(wt.tasks) AS task
    WHERE wt.trigger_stage = NEW.stage 
    AND wt.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on deals table for automatic workflow triggering
CREATE TRIGGER deals_stage_change_trigger
  AFTER UPDATE OF stage ON deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_stage_workflows();