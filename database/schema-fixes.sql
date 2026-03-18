-- B1G Project Tracker - Database Schema Fixes
-- Execute this in Supabase SQL Editor after main schema is created
-- https://supabase.com/dashboard/project/your-project/sql

-- Fix 1: Add missing foreign key constraints to departments table
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager_id FOREIGN KEY (manager_id) REFERENCES profile(id);

-- Fix 2: Add missing foreign key constraints to tracker_tasks table  
ALTER TABLE tracker_tasks ADD CONSTRAINT fk_tracker_tasks_department_id FOREIGN KEY (department_id) REFERENCES departments(id);

-- Fix 3: Remove incorrect self-referencing foreign key constraint from users_role table
-- This line was causing the error: column "role_id" referenced in foreign key constraint does not exist
-- The users_role table should not reference itself

-- Fix 4: Add missing foreign key constraints to profile table
ALTER TABLE profile ADD CONSTRAINT fk_profile_role_id FOREIGN KEY (role_id) REFERENCES users_role(id);

-- Fix 5: Add missing foreign key constraints to tracker_tasks table (assigned_to & created_by)
ALTER TABLE tracker_tasks ADD CONSTRAINT fk_tracker_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES profile(id);
ALTER TABLE tracker_tasks ADD CONSTRAINT fk_tracker_tasks_created_by FOREIGN KEY (created_by) REFERENCES profile(id);

-- Fix 6: Add missing foreign key constraint to notifications table
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES profile(id) ON DELETE CASCADE;

-- All fixes applied successfully
