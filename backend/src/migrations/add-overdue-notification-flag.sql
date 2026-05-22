-- Migration: Add overdue_notification_sent column to tracker_tasks
-- This column tracks whether an overdue notification has been sent for a task
-- to prevent duplicate notifications

ALTER TABLE tracker_tasks 
ADD COLUMN IF NOT EXISTS overdue_notification_sent BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tracker_tasks_overdue_notification 
ON tracker_tasks(overdue_notification_sent) 
WHERE overdue_notification_sent = FALSE;
