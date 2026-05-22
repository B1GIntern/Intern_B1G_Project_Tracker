-- Migration: Update notifications_type_check constraint to include overdue_task
-- First, drop the existing constraint, then recreate it with the new type

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with all notification types including overdue_task
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('task_assigned', 'task_updated', 'task_completed', 'mention', 'system', 'overdue_task'));
