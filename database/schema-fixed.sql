-- B1G Project Tracker - Database Schema
-- Execute this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/your-project/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse order of dependencies (for clean recreation)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS tracker_tasks CASCADE;
DROP TABLE IF EXISTS users_role CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Note: We use Supabase's built-in auth.users table instead of creating our own users table

-- 1. departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. users_role
CREATE TABLE users_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL CHECK (role_name IN ('admin', 'manager', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. profile (User Profile Table)
-- No password stored here - uses Supabase Auth
CREATE TABLE profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role_id UUID REFERENCES users_role(id),
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. tracker_tasks
CREATE TABLE tracker_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'underreview', 'approved', 'completed', 'declined')),
    assigned_to UUID REFERENCES profile(id),
    created_by UUID REFERENCES profile(id),
    department_id UUID REFERENCES departments(id),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'task_updated', 'system', 'department_update')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_profile_email ON profile(email);
CREATE INDEX idx_profile_department_id ON profile(department_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_users_role_user_id ON users_role(user_id);
CREATE INDEX idx_tracker_tasks_assigned_to ON tracker_tasks(assigned_to);
CREATE INDEX idx_tracker_tasks_created_by ON tracker_tasks(created_by);
CREATE INDEX idx_tracker_tasks_department_id ON tracker_tasks(department_id);
CREATE INDEX idx_tracker_tasks_status ON tracker_tasks(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_role_updated_at BEFORE UPDATE ON users_role FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profile_updated_at BEFORE UPDATE ON profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracker_tasks_updated_at BEFORE UPDATE ON tracker_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables (except auth.users which is managed by Supabase)
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (these can be refined later)
-- Users can see their own data
CREATE POLICY "Users can view own profile" ON profile FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profile FOR UPDATE USING (id = auth.uid());

-- Users can see tasks assigned to them or created by them
CREATE POLICY "Users can view assigned tasks" ON tracker_tasks FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Users can update assigned tasks" ON tracker_tasks FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Schema creation completed successfully
