-- Add playbook_data column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS playbook_data JSONB DEFAULT '{}'::jsonb;

-- Comment describing the structure
COMMENT ON COLUMN leads.playbook_data IS 'Stores checklist progress. Key = playbook_id, Value = { step_id: boolean, completed_at: timestamp }';
