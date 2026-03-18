-- B1G Project Tracker - Database Schema with Seed Policies
-- Execute this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/your-project/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in correct order to avoid foreign key issues

-- 1. departments (no dependencies)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. profile (created before users_role to avoid circular dependency)
CREATE TABLE profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role_id UUID,
    department_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. users_role (references profile)
CREATE TABLE users_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL CHECK (role_name IN ('admin', 'manager', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. tracker_tasks (references profile)
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

-- 5. notifications (references profile)
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

-- Add foreign key constraints after tables are created
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager_id FOREIGN KEY (manager_id) REFERENCES profile(id);
ALTER TABLE users_role ADD CONSTRAINT fk_users_role_user_id FOREIGN KEY (user_id) REFERENCES profile(id) ON DELETE CASCADE;
ALTER TABLE tracker_tasks ADD CONSTRAINT fk_tracker_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES profile(id);
ALTER TABLE tracker_tasks ADD CONSTRAINT fk_tracker_tasks_created_by FOREIGN KEY (created_by) REFERENCES profile(id);
ALTER TABLE tracker_tasks ADD CONSTRAINT fk_tracker_tasks_department_id FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES profile(id) ON DELETE CASCADE;

-- Row Level Security (RLS) Policies
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can view own profile" ON profile FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profile FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view assigned tasks" ON tracker_tasks FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Users can update assigned tasks" ON tracker_tasks FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for seed operations (bypass RLS for service role)
CREATE POLICY "Enable insert for service role" ON profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for service role" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for service role" ON users_role FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for service role" ON tracker_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for service role" ON notifications FOR INSERT WITH CHECK (true);

-- Enable select for service role (for reading during operations)
CREATE POLICY "Enable select for service role" ON profile FOR SELECT USING (true);
CREATE POLICY "Enable select for service role" ON departments FOR SELECT USING (true);
CREATE POLICY "Enable select for service role" ON users_role FOR SELECT USING (true);
CREATE POLICY "Enable select for service role" ON tracker_tasks FOR SELECT USING (true);
CREATE POLICY "Enable select for service role" ON notifications FOR SELECT USING (true);

-- Schema creation completed successfully
