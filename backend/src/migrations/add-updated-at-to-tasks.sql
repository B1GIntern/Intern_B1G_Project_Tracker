-- Add updated_at column to tracker_tasks table
ALTER TABLE tracker_tasks 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing tasks to have updated_at set to created_at initially
UPDATE tracker_tasks 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create trigger to automatically update updated_at when task is modified
CREATE OR REPLACE FUNCTION update_tracker_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tracker_tasks_updated_at_trigger
    BEFORE UPDATE ON tracker_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tracker_tasks_updated_at();
