-- Add progress column to tracker_tasks table
ALTER TABLE tracker_tasks 
ADD COLUMN progress INTEGER DEFAULT 0;

-- Add constraint to ensure progress is between 0 and 100
ALTER TABLE tracker_tasks 
ADD CONSTRAINT check_progress_range 
CHECK (progress >= 0 AND progress <= 100);

-- Update existing tasks to have reasonable default progress based on status
UPDATE tracker_tasks 
SET progress = CASE 
    WHEN status = 'completed' THEN 100
    WHEN status = 'in_progress' THEN 50
    WHEN status = 'review' THEN 75
    ELSE 0
END
WHERE progress = 0;
