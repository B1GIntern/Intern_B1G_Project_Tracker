-- Migration: Add all required columns and constraints for overdue task notifications

-- 1. Add overdue_notification_sent column to tracker_tasks
ALTER TABLE tracker_tasks 
ADD COLUMN IF NOT EXISTS overdue_notification_sent BOOLEAN DEFAULT FALSE;

-- 2. Update notifications_type_check constraint to include overdue_task
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('task_assigned', 'task_updated', 'task_completed', 'mention', 'system', 'overdue_task'));

-- 3. Create task_attachments table if not exists
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tracker_tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_tracker_tasks_overdue_notification 
ON tracker_tasks(overdue_notification_sent) 
WHERE overdue_notification_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
