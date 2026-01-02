-- Migration: Task Management System
-- Creates tasks table for automated follow-up reminders

-- 1. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || floor(random() * 1000000)::text),
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'follow_up', 'call', 'email', 'meeting', 'other'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_pending_due ON tasks(due_date) WHERE status = 'pending';

-- 3. Add comments
COMMENT ON TABLE tasks IS 'Task management for follow-ups, calls, and other lead activities';
COMMENT ON COLUMN tasks.type IS 'Type of task: follow_up, call, email, meeting, other';
COMMENT ON COLUMN tasks.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN tasks.status IS 'Task status: pending, completed, cancelled';
COMMENT ON COLUMN tasks.due_date IS 'When the task is due';
