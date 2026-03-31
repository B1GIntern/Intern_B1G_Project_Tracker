-- Add task_id column to notifications table
-- This fixes the error: column "task_id" of relation "notifications" does not exist

ALTER TABLE notifications 
ADD COLUMN task_id TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
