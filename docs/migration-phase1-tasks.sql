-- Migration: Add Task Management & Sales Fields
-- Part of Phase 1: Automation & Foundation
-- Adds tracking for next actions, assignments, and detailed status timestamps

-- 1. Task Management Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_due TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);

-- 2. Sales Qualification & Lifecycle Fields (Prep for Phase 2/3)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mql_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sql_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS close_reason VARCHAR(255);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_next_action_due ON leads(next_action_due);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- 4. Utility function to auto-update updated_at (if not already exists)
-- (Assuming trigger already exists, if not we can add it, but usually standard)

-- 5. Backfill defaults for testing (Optional)
-- UPDATE leads SET next_action = 'Review Profile' WHERE status = 'New';
