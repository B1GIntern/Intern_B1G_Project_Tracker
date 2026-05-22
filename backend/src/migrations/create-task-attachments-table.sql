-- Migration: Create task_attachments table if it doesn't exist
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
